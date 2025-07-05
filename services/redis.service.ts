import { Effect, Context, Layer, Console } from 'effect';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const CACHE_TTL = 3600; // 1 hour in seconds

// Define the interface for our Redis service
export interface RedisService {
  setWithTTL(key: string, value: any, ttl?: number): Effect.Effect<never, Error, void>;
  get(key: string): Effect.Effect<never, Error, any | null>;
  delete(key: string): Effect.Effect<never, Error, void>;
  isHealthy(): Effect.Effect<never, Error, boolean>;
}

// Create a Context for the Redis service
export class RedisServiceLive extends Context.Tag('RedisService')<
  RedisServiceLive,
  RedisService
>() {}

// Implementation of the Redis service
class RedisServiceImpl implements RedisService {
  constructor(private readonly client: Redis) {}

  setWithTTL(key: string, value: any, ttl: number = CACHE_TTL): Effect.Effect<never, Error, void> {
    return Effect.tryPromise(() => this.client.setex(key, ttl, JSON.stringify(value)))
      .pipe(
        Effect.mapError(error => new Error(`Redis set error: ${error}`)),
        Effect.tap(() => Console.log(`Set key ${key} in Redis`)),
        Effect.asUnit
      );
  }

  get(key: string): Effect.Effect<never, Error, any | null> {
    return Effect.tryPromise(async () => {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    })
    .pipe(
      Effect.mapError(error => new Error(`Redis get error: ${error}`)),
      Effect.tap(result => 
        result 
          ? Console.log(`Retrieved key ${key} from Redis cache`)
          : Console.log(`Key ${key} not found in Redis cache`)
      )
    );
  }

  delete(key: string): Effect.Effect<never, Error, void> {
    return Effect.tryPromise(() => this.client.del(key))
      .pipe(
        Effect.mapError(error => new Error(`Redis delete error: ${error}`)),
        Effect.tap(() => Console.log(`Deleted key ${key} from Redis`)),
        Effect.asUnit
      );
  }

  isHealthy(): Effect.Effect<never, Error, boolean> {
    return Effect.tryPromise(async () => {
      await this.client.ping();
      return true;
    })
    .pipe(
      Effect.mapError(error => new Error(`Redis health check failed: ${error}`))
    );
  }
}

// Create a Layer that provides the Redis service
export const RedisLayer = Layer.effect(
  RedisServiceLive,
  Effect.gen(function* (_) {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      return yield* _(Effect.fail(new Error('Redis URL not configured')));
    }
    
    const client = new Redis(redisUrl, {
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
    
    // Set up event listeners
    client.on('connect', () => {
      console.log('Redis connected successfully');
    });
    
    client.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
    
    client.on('close', () => {
      console.log('Redis connection closed');
    });
    
    return new RedisServiceImpl(client);
  })
);

// Helper functions to use the Redis service without having to provide it explicitly
export const setWithTTL = (key: string, value: any, ttl?: number) =>
  Effect.flatMap(RedisServiceLive, (redis) => redis.setWithTTL(key, value, ttl));

export const get = (key: string) =>
  Effect.flatMap(RedisServiceLive, (redis) => redis.get(key));

export const deleteKey = (key: string) =>
  Effect.flatMap(RedisServiceLive, (redis) => redis.delete(key));

export const isHealthy = () =>
  Effect.flatMap(RedisServiceLive, (redis) => redis.isHealthy());