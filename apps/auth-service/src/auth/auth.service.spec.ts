import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenService, TokenPair, TokenPayload } from '../token/token.service';
import { SessionService, SessionData } from '../session/session.service';
import {
  VneidService,
  VneidTokenResponse,
  VneidUserInfo,
} from './vneid.service';

describe('AuthService', () => {
  let service: AuthService;
  let tokenService: jest.Mocked<TokenService>;
  let sessionService: jest.Mocked<SessionService>;
  let vneidService: jest.Mocked<VneidService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: TokenService,
          useValue: {
            generateTokenPair: jest.fn(),
            verifyAccessToken: jest.fn(),
            verifyRefreshToken: jest.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            createSession: jest.fn(),
            destroyAllSessions: jest.fn(),
            blacklistToken: jest.fn(),
            isTokenBlacklisted: jest.fn(),
          },
        },
        {
          provide: VneidService,
          useValue: {
            exchangeCode: jest.fn(),
            getUserInfo: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    tokenService = module.get(TokenService) as jest.Mocked<TokenService>;
    sessionService = module.get(SessionService) as jest.Mocked<SessionService>;
    vneidService = module.get(VneidService) as jest.Mocked<VneidService>;
  });

  describe('loginWithVneid', () => {
    const mockVneidToken: VneidTokenResponse = {
      accessToken: 'vneid-access-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    };
    const mockUserInfo: VneidUserInfo = {
      id: 'user-123',
      fullName: 'Nguyen Van A',
      email: 'a@vneid.vn',
    };
    const mockTokenPair: TokenPair = {
      accessToken: 'jwt-access',
      refreshToken: 'jwt-refresh',
    };

    it('should exchange code, get user info, generate tokens, and create session', async () => {
      vneidService.exchangeCode.mockResolvedValue(mockVneidToken);
      vneidService.getUserInfo.mockResolvedValue(mockUserInfo);
      tokenService.generateTokenPair.mockResolvedValue(mockTokenPair);
      sessionService.createSession.mockResolvedValue(undefined);

      const result = await service.loginWithVneid('auth-code');

      expect(vneidService.exchangeCode).toHaveBeenCalledWith('auth-code');
      expect(vneidService.getUserInfo).toHaveBeenCalledWith(
        'vneid-access-token',
      );
      expect(tokenService.generateTokenPair).toHaveBeenCalledWith({
        sub: 'user-123',
        email: 'a@vneid.vn',
        roles: ['user'],
      });
      expect(sessionService.createSession).toHaveBeenCalled();
      expect(result.accessToken).toBe('jwt-access');
      expect(result.refreshToken).toBe('jwt-refresh');
      expect(result.user).toEqual(mockUserInfo);
    });
  });

  describe('refreshTokens', () => {
    it('should verify, check blacklist, blacklist old, and issue new tokens', async () => {
      const decoded = {
        sub: 'user-1',
        email: 'e@x.com',
        roles: ['user'],
        jti: 'old-jti',
      };
      tokenService.verifyRefreshToken.mockResolvedValue(decoded);
      sessionService.isTokenBlacklisted.mockResolvedValue(false);
      sessionService.blacklistToken.mockResolvedValue(undefined);
      const newPair: TokenPair = {
        accessToken: 'new-at',
        refreshToken: 'new-rt',
      };
      tokenService.generateTokenPair.mockResolvedValue(newPair);

      const result = await service.refreshTokens('old-refresh-token');

      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(
        'old-refresh-token',
      );
      expect(sessionService.isTokenBlacklisted).toHaveBeenCalledWith('old-jti');
      expect(sessionService.blacklistToken).toHaveBeenCalledWith(
        'old-jti',
        7 * 24 * 3600,
      );
      expect(result).toEqual(newPair);
    });

    it('should throw if refresh token is blacklisted', async () => {
      const decoded = {
        sub: 'u',
        email: 'e',
        roles: [],
        jti: 'blacklisted-jti',
      };
      tokenService.verifyRefreshToken.mockResolvedValue(decoded);
      sessionService.isTokenBlacklisted.mockResolvedValue(true);

      await expect(service.refreshTokens('bad-rt')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should verify access token and blacklist it', async () => {
      const decoded = { sub: 'u', email: 'e', roles: [], jti: 'token-jti' };
      tokenService.verifyAccessToken.mockResolvedValue(decoded);
      sessionService.blacklistToken.mockResolvedValue(undefined);

      await service.logout('access-token');

      expect(tokenService.verifyAccessToken).toHaveBeenCalledWith(
        'access-token',
      );
      expect(sessionService.blacklistToken).toHaveBeenCalledWith(
        'token-jti',
        15 * 60,
      );
    });
  });

  describe('logoutAll', () => {
    it('should call destroyAllSessions with userId', async () => {
      sessionService.destroyAllSessions.mockResolvedValue(3);

      const result = await service.logoutAll('user-1');

      expect(sessionService.destroyAllSessions).toHaveBeenCalledWith('user-1');
      expect(result).toBe(3);
    });
  });

  describe('validateToken', () => {
    it('should return valid=true with payload for valid non-blacklisted token', async () => {
      const decoded = {
        sub: 'user-1',
        email: 'e@x.com',
        roles: ['admin'],
        jti: 'jti',
      };
      tokenService.verifyAccessToken.mockResolvedValue(decoded);
      sessionService.isTokenBlacklisted.mockResolvedValue(false);

      const result = await service.validateToken('valid-token');

      expect(result.valid).toBe(true);
      expect(result.payload).toEqual({
        sub: 'user-1',
        email: 'e@x.com',
        roles: ['admin'],
      });
    });

    it('should return valid=false if token is blacklisted', async () => {
      const decoded = { sub: 'u', email: 'e', roles: [], jti: 'bl-jti' };
      tokenService.verifyAccessToken.mockResolvedValue(decoded);
      sessionService.isTokenBlacklisted.mockResolvedValue(true);

      const result = await service.validateToken('blacklisted-token');

      expect(result.valid).toBe(false);
    });

    it('should return valid=false on verification error', async () => {
      tokenService.verifyAccessToken.mockRejectedValue(new Error('expired'));

      const result = await service.validateToken('expired-token');

      expect(result.valid).toBe(false);
    });
  });
});
