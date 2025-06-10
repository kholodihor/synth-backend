import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const CACHE_TTL = 3600; // 1 hour in seconds

export class RedisService {
  private static instance: Redis;

  static getInstance(): Redis {
    if (!RedisService.instance) {
      // Extract URL and token from environment variable
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        throw new Error('Redis URL not configured');
      }
      
      // Use the Upstash Redis URL format with token authentication
      const url = 'redis://default:ATFVAAIjcDE1ODkzM2E0MjI4ZmU0MWE0OGY5OGIyYWI3OWEyZTdhOXAxMA@obliging-swift-12629.upstash.io:6379';
      
      RedisService.instance = new Redis(url, {
        tls: { rejectUnauthorized: false },
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 5,
        enableReadyCheck: false,
        connectionName: 'synth-backend',
        reconnectOnError: () => true
      });

      RedisService.instance.on('connect', () => {
        console.log('Redis connected successfully');
      });

      RedisService.instance.on('error', (error) => {
        console.error('Redis connection error:', error);
      });

      RedisService.instance.on('close', () => {
        console.log('Redis connection closed');
      });
    }

    return RedisService.instance;
  }

  static async setWithTTL(key: string, value: any, ttl: number = CACHE_TTL): Promise<void> {
    try {
      await this.getInstance().setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  static async get(key: string): Promise<any | null> {
    try {
      const value = await this.getInstance().get(key);
      return value ? JSON.parse(value) : null;
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

export const redis = RedisService.getInstance();