import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { GitHubService } from "@/lib/github"
import { rateLimit, getClientIdentifier, RateLimitPresets } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  try {
    // Rate limiting - moderate for repository listing
    const identifier = getClientIdentifier(request)
    const rateLimitResult = rateLimit(identifier, RateLimitPresets.moderate)

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

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const github = new GitHubService(session.accessToken)
    const repos = await github.getUserRepos()

    return NextResponse.json({ repos })
  } catch (error) {
    // Log error server-side only
    console.error("Repository fetch failed:", error)

    // Return sanitized error message
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    )
  }
}
