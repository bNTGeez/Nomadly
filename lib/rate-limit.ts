import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Single Redis client from env (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// General purpose limiter: 60 req/min
export const generalLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
});

// Search/autocomplete: 30 req/min
export const searchLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
});

// Search/autocomplete: 120 req/hour
export const searchHourlyLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(120, "1 h"),
});

// Auth endpoints: 5 req/min
export const authLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
});

// Auth endpoints: 20 req/hour
export const authHourlyLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"),
});

// AI/generation endpoints: 10 req/min
export const aiLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});

// AI/generation burst: 3 req / 10s
export const aiBurstLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(3, "10 s"),
});

export function retryAfterSeconds(resetMs: number) {
  const secs = Math.max(1, Math.ceil((resetMs - Date.now()) / 1000));
  return secs.toString();
}
