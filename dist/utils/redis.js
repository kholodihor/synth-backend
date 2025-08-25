"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.RedisService = void 0;
const ioredis_1 = require("ioredis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const CACHE_TTL = 3600; // 1 hour in seconds
class RedisService {
    static getInstance() {
        if (!RedisService.instance) {
            // Extract URL and token from environment variable
            const redisUrl = process.env.REDIS_URL;
            if (!redisUrl) {
                throw new Error('Redis URL not configured');
            }
            RedisService.instance = new ioredis_1.Redis(redisUrl, {
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
    static async setWithTTL(key, value, ttl = CACHE_TTL) {
        try {
            await this.getInstance().setex(key, ttl, JSON.stringify(value));
        }
        catch (error) {
            console.error('Redis set error:', error);
        }
    }
    static async get(key) {
        try {
            const value = await this.getInstance().get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }
    static async delete(key) {
        try {
            await this.getInstance().del(key);
        }
        catch (error) {
            console.error('Redis delete error:', error);
        }
    }
    static async isHealthy() {
        try {
            await this.getInstance().ping();
            return true;
        }
        catch (error) {
            console.error('Redis health check failed:', error);
            return false;
        }
    }
}
exports.RedisService = RedisService;
exports.redis = RedisService.getInstance();
