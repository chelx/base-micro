import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal: string) => defaultVal),
          },
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  describe('generateTokenPair', () => {
    const payload = { sub: 'user-1', email: 'user@test.com', roles: ['user'] };

    it('should return accessToken and refreshToken', async () => {
      jwtService.sign
        .mockReturnValueOnce('access-token-value')
        .mockReturnValueOnce('refresh-token-value');

      const result = await service.generateTokenPair(payload);

      expect(result).toEqual({
        accessToken: 'access-token-value',
        refreshToken: 'refresh-token-value',
      });
    });

    it('should call jwtService.sign twice (access + refresh)', async () => {
      jwtService.sign.mockReturnValueOnce('at').mockReturnValueOnce('rt');

      await service.generateTokenPair(payload);

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should sign access token with payload, jti, and type', async () => {
      jwtService.sign.mockReturnValueOnce('at').mockReturnValueOnce('rt');

      await service.generateTokenPair(payload);

      const firstCall = jwtService.sign.mock.calls[0][0] as any;
      expect(firstCall.sub).toBe('user-1');
      expect(firstCall.email).toBe('user@test.com');
      expect(firstCall.roles).toEqual(['user']);
      expect(firstCall.jti).toBeDefined();
      expect(firstCall.type).toBe('access');
    });

    it('should sign refresh token with separate secret and expiresIn', async () => {
      jwtService.sign.mockReturnValueOnce('at').mockReturnValueOnce('rt');

      await service.generateTokenPair(payload);

      const secondCallOptions = jwtService.sign.mock.calls[1][1] as any;
      expect(secondCallOptions).toBeDefined();
      expect(secondCallOptions.secret).toBeDefined();
      expect(secondCallOptions.expiresIn).toBeDefined();
    });

    it('should use different JTI for access and refresh tokens', async () => {
      jwtService.sign.mockReturnValueOnce('at').mockReturnValueOnce('rt');

      await service.generateTokenPair(payload);

      const accessJti = (jwtService.sign.mock.calls[0][0] as any).jti;
      const refreshJti = (jwtService.sign.mock.calls[1][0] as any).jti;
      expect(accessJti).not.toBe(refreshJti);
    });
  });

  describe('verifyAccessToken', () => {
    it('should return decoded payload on valid token', async () => {
      const decoded = {
        sub: 'user-1',
        email: 'a@b.com',
        roles: ['user'],
        jti: 'abc',
      };
      jwtService.verify.mockReturnValue(decoded as any);

      const result = await service.verifyAccessToken('valid-token');

      expect(result).toEqual(decoded);
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException on invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.verifyAccessToken('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return decoded payload on valid refresh token', async () => {
      const decoded = {
        sub: 'user-1',
        email: 'a@b.com',
        roles: ['user'],
        jti: 'def',
      };
      jwtService.verify.mockReturnValue(decoded as any);

      const result = await service.verifyRefreshToken('valid-refresh');

      expect(result).toEqual(decoded);
    });

    it('should verify with refresh secret', async () => {
      jwtService.verify.mockReturnValue({ sub: '1', jti: 'x' } as any);

      await service.verifyRefreshToken('token');

      expect(jwtService.verify).toHaveBeenCalledWith('token', {
        secret: expect.any(String),
      });
    });

    it('should throw UnauthorizedException on invalid refresh token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.verifyRefreshToken('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
