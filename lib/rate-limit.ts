/**
 * Plan-aware rate limiting, with Redis available only to premium traffic.
 *
 * FREE plan requests always use the in-memory limiter at the base preset
 * caps below, regardless of whether Redis is configured - free tier limits
 * are deliberately strict enough that per-instance (rather than distributed)
 * counting is fine, and it keeps Redis capacity for paying users.
 *
 * PREMIUM plan requests get materially higher limits (see
 * PREMIUM_RATE_LIMIT_MULTIPLIER) and, when Redis is configured, those higher
 * limits are enforced with Redis so they hold across multiple instances. If
 * Redis isn't configured, premium requests still get the higher limit, just
 * enforced in-memory (per instance) instead of erroring.
 *
 * To configure Redis:
 * - UPSTASH_REDIS_REST_URL: Your Upstash Redis URL
 * - UPSTASH_REDIS_REST_TOKEN: Your Upstash Redis token
 */

import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"
import type { Plan } from "@prisma/client"

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
  if (process.env.NODE_ENV !== "production") {
    console.log("✅ Redis rate limiting enabled for premium users (distributed)")
  }
} else {
  console.warn("⚠️ Redis not configured - premium users get the higher in-memory limit instead (single instance only). Free-tier limiting is unaffected either way.")
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

// Premium plan requests get this many times the free-tier request budget.
// Applied on top of whichever RateLimitPresets entry the caller passes in.
const PREMIUM_RATE_LIMIT_MULTIPLIER = 5

/**
 * Check if a request should be rate limited.
 *
 * FREE (the default) always uses the in-memory limiter at exactly the
 * supplied `options`. PREMIUM multiplies `options.maxRequests` by
 * PREMIUM_RATE_LIMIT_MULTIPLIER and, when Redis is configured, enforces that
 * higher limit with Redis (distributed across instances); otherwise it's
 * enforced in-memory - never an error, just a per-instance approximation.
 *
 * @param identifier - Unique identifier (e.g., IP address or user ID -
 *   prefer a user id when the caller is authenticated, so a premium user's
 *   higher limit isn't diluted by sharing an IP-based bucket with others)
 * @param options - Base (free-tier) rate limit configuration
 * @param plan - The requesting user's plan. Defaults to FREE.
 * @returns Rate limit result with success status and metadata
 */
export async function rateLimit(
  identifier: string,
  options: RateLimitOptions,
  plan: Plan = "FREE"
): Promise<RateLimitResult> {
  if (plan === "PREMIUM") {
    const premiumOptions: RateLimitOptions = {
      interval: options.interval,
      maxRequests: options.maxRequests * PREMIUM_RATE_LIMIT_MULTIPLIER,
    }

    if (redis) {
      try {
        return await rateLimitRedis(identifier, premiumOptions)
      } catch (error) {
        console.error("Redis rate limit failed for premium user, falling back to in-memory:", error)
        return rateLimitMemory(identifier, premiumOptions)
      }
    }

    return rateLimitMemory(identifier, premiumOptions)
  }

  // FREE - always in-memory, always the base preset. Redis (if configured)
  // is reserved for premium traffic.
  return rateLimitMemory(identifier, options)
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
