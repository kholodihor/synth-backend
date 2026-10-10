import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_TTL = 3600; // 1 hour in seconds

export class RedisService {
  private static instance: Redis;

  static getInstance(): Redis {
    if (!RedisService.instance) {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        throw new Error('REDIS_URL is not configured');
      }

      RedisService.instance = new Redis(redisUrl, {
        // Managed Redis providers (e.g. Upstash) require TLS; enable it only for rediss://
        ...(redisUrl.startsWith('rediss://') && { tls: { rejectUnauthorized: false } }),
        retryStrategy: (times) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 5,
        enableReadyCheck: false,
        connectionName: 'synth-backend',
        reconnectOnError: () => true,
      });

      RedisService.instance.on('connect', () => {
        console.log('Redis connected successfully');
      });

      RedisService.instance.on('error', (error) => {
        console.error('Redis connection error:', error);
      });
    }

    return RedisService.instance;
  }

  /**
   * Serialize and store a value with a TTL (seconds).
   */
  static async setWithTTL<T>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      await this.getInstance().setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  /**
   * Fetch and deserialize a cached value. Returns null on a miss.
   */
  static async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const value = await this.getInstance().get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      await this.getInstance().del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  /**
   * Delete every key matching a glob pattern (e.g. "bands:page:*").
   * Uses SCAN so it is safe to run in production.
   */
  static async deleteByPattern(pattern: string): Promise<void> {
    try {
      const redis = this.getInstance();
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      console.error('Redis deleteByPattern error:', error);
    }
  }

  static async isHealthy(): Promise<boolean> {
    try {
      await this.getInstance().ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}
