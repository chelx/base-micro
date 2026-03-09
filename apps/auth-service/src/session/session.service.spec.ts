import { ConfigService } from '@nestjs/config';
import { SessionService } from './session.service';

// Mock ioredis
const mockPipeline = {
  set: jest.fn().mockReturnThis(),
  sadd: jest.fn().mockReturnThis(),
  expire: jest.fn().mockReturnThis(),
  del: jest.fn().mockReturnThis(),
  srem: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  smembers: jest.fn(),
  pipeline: jest.fn(() => mockPipeline),
  quit: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedis);
});

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    jest.clearAllMocks();
    const configService = {
      get: jest.fn((key: string, defaultVal: any) => defaultVal),
    } as any;
    service = new SessionService(configService);
  });

  describe('createSession', () => {
    it('should store session and track in user-sessions set', async () => {
      const sessionData = {
        userId: 'user-1',
        deviceInfo: 'Chrome',
        createdAt: 1000,
        lastActivity: 1000,
      };

      await service.createSession('sess-1', sessionData);

      expect(mockRedis.pipeline).toHaveBeenCalled();
      expect(mockPipeline.set).toHaveBeenCalledWith(
        'session:sess-1',
        JSON.stringify(sessionData),
        'EX',
        86400,
      );
      expect(mockPipeline.sadd).toHaveBeenCalledWith(
        'user-sessions:user-1',
        'sess-1',
      );
      expect(mockPipeline.exec).toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('should return parsed session data', async () => {
      const data = { userId: 'u1', createdAt: 1, lastActivity: 1 };
      mockRedis.get.mockResolvedValue(JSON.stringify(data));

      const result = await service.getSession('sess-1');

      expect(result).toEqual(data);
      expect(mockRedis.get).toHaveBeenCalledWith('session:sess-1');
    });

    it('should return null if session not found', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.getSession('no-session');

      expect(result).toBeNull();
    });
  });

  describe('destroySession', () => {
    it('should delete session and remove from user set', async () => {
      const data = { userId: 'user-1', createdAt: 1, lastActivity: 1 };
      mockRedis.get.mockResolvedValue(JSON.stringify(data));

      await service.destroySession('sess-1');

      expect(mockPipeline.del).toHaveBeenCalledWith('session:sess-1');
      expect(mockPipeline.srem).toHaveBeenCalledWith(
        'user-sessions:user-1',
        'sess-1',
      );
    });

    it('should do nothing if session not found', async () => {
      mockRedis.get.mockResolvedValue(null);

      await service.destroySession('no-session');

      expect(mockPipeline.del).not.toHaveBeenCalled();
    });
  });

  describe('destroyAllSessions', () => {
    it('should destroy all sessions for a user', async () => {
      mockRedis.smembers.mockResolvedValue(['sess-1', 'sess-2']);

      const count = await service.destroyAllSessions('user-1');

      expect(count).toBe(2);
      expect(mockPipeline.del).toHaveBeenCalledWith('session:sess-1');
      expect(mockPipeline.del).toHaveBeenCalledWith('session:sess-2');
      expect(mockPipeline.del).toHaveBeenCalledWith('user-sessions:user-1');
    });

    it('should return 0 if user has no sessions', async () => {
      mockRedis.smembers.mockResolvedValue([]);

      const count = await service.destroyAllSessions('user-1');

      expect(count).toBe(0);
    });
  });

  describe('blacklistToken', () => {
    it('should set blacklist key with TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await service.blacklistToken('jti-123', 900);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'blacklist:jti-123',
        '1',
        'EX',
        900,
      );
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true if token is blacklisted', async () => {
      mockRedis.get.mockResolvedValue('1');

      const result = await service.isTokenBlacklisted('jti-123');

      expect(result).toBe(true);
    });

    it('should return false if token is not blacklisted', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.isTokenBlacklisted('jti-123');

      expect(result).toBe(false);
    });
  });

  describe('onModuleDestroy', () => {
    it('should quit Redis connection', async () => {
      await service.onModuleDestroy();
      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });
});
