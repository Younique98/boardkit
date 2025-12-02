import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { rateLimit, getClientIdentifier, RateLimitPresets } from "@/lib/rate-limit"

interface SessionWithToken {
  accessToken?: string
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting - lenient for lightweight scope checks
    const identifier = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(identifier, RateLimitPresets.lenient)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          }
        }
      )
    }

    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get the access token from the session
    const accessToken = (session as unknown as SessionWithToken).accessToken

    if (!accessToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check the scopes by calling GitHub API
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error("GitHub API request failed")
    }

    const scopes = response.headers.get("x-oauth-scopes") || "none"

    return NextResponse.json({
      scopes: scopes.split(",").map(s => s.trim()),
      hasProjectScope: scopes.includes("project")
    })
  } catch (error) {
    // Log error server-side only
    console.error("Scope check failed:", error)

    // Return sanitized error message
    return NextResponse.json(
      { error: "Failed to check permissions" },
      { status: 500 }
    )
  }
}
