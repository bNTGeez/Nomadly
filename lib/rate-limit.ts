import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Redis is configured
const isRedisConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// Single Redis client from env (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
export const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Mock rate limiter for development when Redis is not available
const createMockLimiter = () => ({
  limit: async () => {
    // Always allow requests when using mock limiter
    return {
      success: true,
      limit: 1000,
      remaining: 999,
      reset: Date.now() + 60000,
    };
  },
});

// Wrapper to handle Redis connection failures gracefully
const createSafeLimiter = (limiter: Ratelimit) => ({
  limit: async (key: string) => {
    try {
      return await limiter.limit(key);
    } catch (error) {
      // If Redis connection fails, allow the request
      console.warn("Rate limiter Redis connection failed, allowing request:", error);
      return {
        success: true,
        limit: 1000,
        remaining: 999,
        reset: Date.now() + 60000,
      };
    }
  },
});

// General purpose limiter: 60 req/min (or unlimited in development)
export const generalLimiter = redis && process.env.NODE_ENV === "production"
  ? createSafeLimiter(
      new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(60, "1 m"),
      })
    )
  : createMockLimiter();

// Search/autocomplete: 30 req/min (or unlimited in development)
export const searchLimiter = redis && process.env.NODE_ENV === "production"
  ? createSafeLimiter(
      new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(30, "1 m"),
      })
    )
  : createMockLimiter();

// Search/autocomplete: 120 req/hour (or unlimited in development)
export const searchHourlyLimiter = redis && process.env.NODE_ENV === "production"
  ? createSafeLimiter(
      new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(120, "1 h"),
      })
    )
  : createMockLimiter();

// Auth endpoints: 5 req/min (or unlimited in development)
export const authLimiter = redis && process.env.NODE_ENV === "production"
  ? createSafeLimiter(
      new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
      })
    )
  : createMockLimiter();

// Auth endpoints: 20 req/hour (or unlimited in development)
export const authHourlyLimiter = redis && process.env.NODE_ENV === "production"
  ? createSafeLimiter(
      new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(20, "1 h"),
      })
    )
  : createMockLimiter();

// AI/generation endpoints: 10 req/min (or unlimited in development)
export const aiLimiter = redis && process.env.NODE_ENV === "production"
  ? createSafeLimiter(
      new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
      })
    )
  : createMockLimiter();

// AI/generation burst: 3 req / 10s (or unlimited in development)
export const aiBurstLimiter = redis && process.env.NODE_ENV === "production"
  ? createSafeLimiter(
      new Ratelimit({
        redis: redis,
        limiter: Ratelimit.fixedWindow(3, "10 s"),
      })
    )
  : createMockLimiter();

export function retryAfterSeconds(resetMs: number) {
  const secs = Math.max(1, Math.ceil((resetMs - Date.now()) / 1000));
  return secs.toString();
}
