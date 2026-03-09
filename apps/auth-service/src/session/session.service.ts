import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface SessionData {
  userId: string;
  deviceInfo?: string;
  createdAt: number;
  lastActivity: number;
}

@Injectable()
export class SessionService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly sessionTTL: number;
  private readonly keyPrefix = 'session:';
  private readonly userSessionsPrefix = 'user-sessions:';

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      password: this.config.get<string>('REDIS_PASSWORD', ''),
      db: this.config.get<number>('REDIS_SESSION_DB', 1),
    });
    this.sessionTTL = this.config.get<number>('SESSION_TTL', 86400); // 24h
  }

  /**
   * Tạo session mới cho user
   */
  async createSession(sessionId: string, data: SessionData): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.set(
      `${this.keyPrefix}${sessionId}`,
      JSON.stringify(data),
      'EX',
      this.sessionTTL,
    );
    // Track sessions của user để hỗ trợ "logout all"
    pipeline.sadd(`${this.userSessionsPrefix}${data.userId}`, sessionId);
    pipeline.expire(
      `${this.userSessionsPrefix}${data.userId}`,
      this.sessionTTL,
    );
    await pipeline.exec();
  }

  /**
   * Lấy session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const data = await this.redis.get(`${this.keyPrefix}${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Xóa session (logout)
   */
  async destroySession(sessionId: string): Promise<void> {
    const data = await this.getSession(sessionId);
    if (data) {
      const pipeline = this.redis.pipeline();
      pipeline.del(`${this.keyPrefix}${sessionId}`);
      pipeline.srem(`${this.userSessionsPrefix}${data.userId}`, sessionId);
      await pipeline.exec();
    }
  }

  /**
   * Đăng xuất khỏi tất cả thiết bị
   */
  async destroyAllSessions(userId: string): Promise<number> {
    const sessionIds = await this.redis.smembers(
      `${this.userSessionsPrefix}${userId}`,
    );
    if (sessionIds.length === 0) return 0;

    const pipeline = this.redis.pipeline();
    for (const sid of sessionIds) {
      pipeline.del(`${this.keyPrefix}${sid}`);
    }
    pipeline.del(`${this.userSessionsPrefix}${userId}`);
    await pipeline.exec();

    return sessionIds.length;
  }

  /**
   * Blacklist token (khi logout hoặc đổi password)
   */
  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(`blacklist:${jti}`, '1', 'EX', ttlSeconds);
  }

  /**
   * Kiểm tra token có bị blacklist không
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const result = await this.redis.get(`blacklist:${jti}`);
    return result !== null;
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
