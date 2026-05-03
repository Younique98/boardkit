import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { GitHubService } from "@/lib/github"
import { rateLimit, getClientIdentifier, RateLimitPresets } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  try {
    // Rate limiting - moderate for repository listing
    const identifier = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(identifier, RateLimitPresets.moderate)

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

    try {
      const repos = await github.getUserRepos()
      return NextResponse.json({ repos })
    } catch (githubError: unknown) {
      const status = (githubError as { status?: number })?.status
      console.error("GitHub API error fetching repos:", githubError)

      if (status === 401) {
        return NextResponse.json(
          { error: "GitHub token expired. Please sign out and sign in again." },
          { status: 401 }
        )
      }
      if (status === 403) {
        return NextResponse.json(
          { error: "Insufficient GitHub permissions. Please sign out and sign in again to re-authorize." },
          { status: 403 }
        )
      }
      throw githubError
    }
  } catch (error) {
    console.error("Repository fetch failed:", error)
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    )
  }
}
