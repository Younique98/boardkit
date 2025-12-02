/**
 * Distributed rate limiting with Redis fallback to in-memory
 *
 * For production with multiple instances, configure Redis:
 * - UPSTASH_REDIS_REST_URL: Your Upstash Redis URL
 * - UPSTASH_REDIS_REST_TOKEN: Your Upstash Redis token
 *
 * Without Redis, falls back to in-memory (single instance only)
 */

import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

// Redis client (only initialized if env vars are present)
let redis: Redis | null = null
let redisRateLimiters: Map<string, Ratelimit> | null = null

// Initialize Redis if configured
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  redisRateLimiters = new Map()
  console.log("✅ Redis rate limiting enabled (distributed)")
} else {
  console.warn("⚠️ Redis not configured - using in-memory rate limiting (single instance only)")
}

// In-memory rate limiter (fallback)
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
if (!redis) {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

interface RateLimitOptions {
  interval: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

/**
 * Get or create Redis rate limiter for specific options
 */
function getRedisRateLimiter(options: RateLimitOptions): Ratelimit {
  if (!redis || !redisRateLimiters) {
    throw new Error("Redis not initialized")
  }

  const key = `${options.maxRequests}-${options.interval}`

  if (!redisRateLimiters.has(key)) {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(options.maxRequests, `${options.interval}ms`),
      analytics: true,
      prefix: "@boardkit/ratelimit",
    })
    redisRateLimiters.set(key, limiter)
  }

  return redisRateLimiters.get(key)!
}

/**
 * Redis-based rate limiting
 */
async function rateLimitRedis(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const limiter = getRedisRateLimiter(options)
  const result = await limiter.limit(identifier)

  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  }
}

/**
 * In-memory rate limiting (fallback for single instance)
 */
function rateLimitMemory(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  if (!entry || entry.resetTime < now) {
    // First request or window expired - create new entry
    const resetTime = now + options.interval
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime,
    })

    return {
      success: true,
      remaining: options.maxRequests - 1,
      reset: resetTime,
    }
  }

  // Within rate limit window
  if (entry.count < options.maxRequests) {
    entry.count++
    return {
      success: true,
      remaining: options.maxRequests - entry.count,
      reset: entry.resetTime,
    }
  }

  // Rate limit exceeded
  return {
    success: false,
    remaining: 0,
    reset: entry.resetTime,
  }
}

/**
 * Check if a request should be rate limited
 * Uses Redis if configured, otherwise falls back to in-memory
 *
 * @param identifier - Unique identifier (e.g., IP address or user ID)
 * @param options - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 */
export async function rateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  if (redis) {
    return await rateLimitRedis(identifier, options)
  } else {
    return rateLimitMemory(identifier, options)
  }
}

/**
 * Get client identifier from request
 * Uses multiple headers as fallback for identifying the client
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from various headers (for proxies/load balancers)
  const headers = request.headers
  const forwarded = headers.get("x-forwarded-for")
  const realIp = headers.get("x-real-ip")
  const cfConnectingIp = headers.get("cf-connecting-ip")

  // Use the first available IP
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  if (realIp) {
    return realIp
  }
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Fallback to a generic identifier if no IP is available
  return "unknown"
}

/**
 * Preset rate limit configurations for different endpoints
 */
export const RateLimitPresets = {
  // Strict limit for expensive operations (board generation)
  strict: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
  // Moderate limit for general API calls
  moderate: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  // Lenient limit for read-only operations
  lenient: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
} as const
