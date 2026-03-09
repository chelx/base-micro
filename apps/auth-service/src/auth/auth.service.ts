import {
  Injectable,
  UnauthorizedException,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { TokenService, TokenPair, TokenPayload } from '../token/token.service';
import { SessionService, SessionData } from '../session/session.service';
import { VneidService, VneidUserInfo } from './vneid.service';
import { v4 as uuidv4 } from 'uuid';

interface VerifyCredentialsResponse {
  success: boolean;
  userId: string;
  email: string;
  roles: string[];
}

interface UserServiceClient {
  verifyCredentials(data: any): import('rxjs').Observable<VerifyCredentialsResponse>;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private userService: UserServiceClient;

  constructor(
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly vneidService: VneidService,
    @Inject('USER_SERVICE') private client: ClientGrpc,
  ) { }

  onModuleInit() {
    this.userService = this.client.getService<UserServiceClient>('UserService');
  }

  /**
   * SSO Login: Exchange VNeID authorization code for tokens
   */
  async loginWithVneid(
    code: string,
    deviceInfo?: string,
  ): Promise<TokenPair & { user: VneidUserInfo }> {
    const vneidToken = await this.vneidService.exchangeCode(code);
    const userInfo = await this.vneidService.getUserInfo(vneidToken.accessToken);

    const payload: TokenPayload = {
      sub: userInfo.id,
      email: userInfo.email,
      roles: ['user'],
    };
    const tokenPair = await this.tokenService.generateTokenPair(payload);

    const sessionId = uuidv4();
    const sessionData: SessionData = {
      userId: userInfo.id,
      deviceInfo,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };
    await this.sessionService.createSession(sessionId, sessionData);

    return { ...tokenPair, user: userInfo };
  }

  /**
   * Refresh token flow with rotation
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const decoded = await this.tokenService.verifyRefreshToken(refreshToken);
    const isBlacklisted = await this.sessionService.isTokenBlacklisted(decoded.jti);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    await this.sessionService.blacklistToken(decoded.jti, 7 * 24 * 3600);

    const payload: TokenPayload = {
      sub: decoded.sub,
      email: decoded.email,
      roles: decoded.roles,
    };
    return this.tokenService.generateTokenPair(payload);
  }

  /**
   * Logout (single device)
   */
  async logout(accessToken: string): Promise<void> {
    const decoded = await this.tokenService.verifyAccessToken(accessToken);
    await this.sessionService.blacklistToken(decoded.jti, 15 * 60);
  }

  /**
   * Logout all devices
   */
  async logoutAll(userId: string): Promise<number> {
    return this.sessionService.destroyAllSessions(userId);
  }

  /**
   * Local Login: Verify username/password via User Service gRPC
   */
  async login(
    usernameOrEmail: string,
    password: string,
    deviceInfo?: string,
  ): Promise<TokenPair> {
    try {
      const response = await firstValueFrom(
        this.userService.verifyCredentials({
          usernameOrEmail,
          password,
        }),
      );

      if (!response.success) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload: TokenPayload = {
        sub: response.userId,
        email: response.email,
        roles: response.roles || [],
      };

      const tokenPair = await this.tokenService.generateTokenPair(payload);

      const sessionId = uuidv4();
      await this.sessionService.createSession(sessionId, {
        userId: response.userId,
        deviceInfo,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      });

      return tokenPair;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      console.error('Login error:', err.message);
      throw new UnauthorizedException('Authentication failed: ' + (err.message || 'Unknown error'));
    }
  }

  /**
   * Validate token cho gRPC / Gateway
   */
  async validateToken(
    token: string,
  ): Promise<{ valid: boolean; payload?: TokenPayload }> {
    try {
      const decoded = await this.tokenService.verifyAccessToken(token);
      const isBlacklisted = await this.sessionService.isTokenBlacklisted(decoded.jti);
      if (isBlacklisted) return { valid: false };
      return {
        valid: true,
        payload: {
          sub: decoded.sub,
          email: decoded.email,
          roles: decoded.roles,
        },
      };
    } catch {
      return { valid: false };
    }
  }
}
