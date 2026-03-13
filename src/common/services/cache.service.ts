import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const CACHE_KEYS = {
  EMPLOYEES: 'employees',
  EMPLOYEE: 'employee',
  DEPARTMENTS: 'departments',
  DEPARTMENT: 'department',
  JOB_POSITIONS: 'job_positions',
  JOB_POSITION: 'job_position',
  HOLIDAYS: 'holidays',
  ATTENDANCE_TODAY: 'attendance_today',
  ATTENDANCE_MY: 'attendance_my',
} as const;

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly ttlSeconds: number;
  private readonly keyPrefix: string;
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.ttlSeconds = this.configService.get<number>('CACHE_TTL', 60);
    this.keyPrefix = this.configService.get<string>(
      'CACHE_KEY_PREFIX',
      'fourier',
    );
    this.redis = new Redis({
      username: this.configService.get<string>('REDIS_USERNAME') || undefined,
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      db: this.configService.get<number>('REDIS_DB', 0),
      keyPrefix: `${this.keyPrefix}:`,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    this.redis.on('error', (error) => {
      this.logger.warn(`Redis cache unavailable: ${error.message}`);
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  private async ensureConnection() {
    if (this.redis.status !== 'ready') {
      await this.redis.connect();
    }
  }

  async get(key: string): Promise<any> {
    try {
      await this.ensureConnection();
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : undefined;
    } catch {
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      await this.ensureConnection();
      await this.redis.set(
        key,
        JSON.stringify(value),
        'EX',
        ttl ?? this.ttlSeconds,
      );
    } catch {
      this.logger.warn(`Failed to cache key: ${key}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.ensureConnection();
      await this.redis.del(key);
    } catch {
      this.logger.warn(`Failed to delete cache key: ${key}`);
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    try {
      await this.ensureConnection();
      const stream = this.redis.scanStream({
        match: `${this.keyPrefix}:${prefix}*`,
      });
      for await (const chunk of stream) {
        const keys = chunk as string[];
        if (keys.length > 0) {
          const normalizedKeys = keys.map((key: string) =>
            key.replace(`${this.keyPrefix}:`, ''),
          );
          if (normalizedKeys.length > 0) {
            await this.redis.del(...normalizedKeys);
          }
        }
      }
    } catch {
      this.logger.warn(`Failed to delete cache keys by prefix: ${prefix}`);
    }
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = (await this.get(key)) as T | undefined;
    if (cached !== undefined) {
      return cached;
    }
    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }
}
