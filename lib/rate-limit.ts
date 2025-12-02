/**
 * Simple in-memory rate limiter for API routes
 * For production with multiple instances, consider using Redis
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

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
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address or user ID)
 * @param options - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 */
export function rateLimit(
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
