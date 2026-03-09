import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPayload {
  sub: string;
  email?: string;
  roles: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.refreshSecret = this.config.get<string>(
      'JWT_REFRESH_SECRET',
      'dev-refresh-secret-change-me',
    );
    this.refreshExpiresIn = this.config.get<string>(
      'JWT_REFRESH_EXPIRES',
      '7d',
    );
  }

  /**
   * Tạo cặp Access + Refresh token
   */
  async generateTokenPair(payload: TokenPayload): Promise<TokenPair> {
    const jti = uuidv4();

    const accessToken = this.jwtService.sign({
      ...payload,
      jti,
      type: 'access',
    });

    const refreshToken = this.jwtService.sign(
      { ...payload, jti: uuidv4(), type: 'refresh' },
      {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiresIn as any,
      },
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(
    token: string,
  ): Promise<TokenPayload & { jti: string }> {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(
    token: string,
  ): Promise<TokenPayload & { jti: string }> {
    try {
      return this.jwtService.verify(token, { secret: this.refreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
