import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getGitHubAccessToken } from "@/lib/github-auth"
import { GitHubService } from "@/lib/github"
import { getUserPlan } from "@/lib/user"
import { rateLimit, getClientIdentifier, RateLimitPresets } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  try {
    // Rate limiting - moderate for repository listing, higher ceiling for
    // premium users (see lib/rate-limit.ts).
    const session = await auth()
    const userId = session?.user?.id
    const identifier = userId ? `user:${userId}` : `ip:${getClientIdentifier(request)}`
    const plan = userId ? await getUserPlan(userId) : "FREE"
    const rateLimitResult = await rateLimit(identifier, RateLimitPresets.moderate, plan)

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

    let accessToken: string | null
    try {
      accessToken = await getGitHubAccessToken(request)
    } catch (authError) {
      console.error("Reading session token failed:", authError)
      return NextResponse.json(
        { error: "Authentication error. Please sign out and sign in again." },
        { status: 401 }
      )
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const github = new GitHubService(accessToken)

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
      const message = githubError instanceof Error ? githubError.message : String(githubError)
      return NextResponse.json(
        { error: `GitHub API error: ${message}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Repository fetch failed:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `Failed to fetch repositories: ${message}` },
      { status: 500 }
    )
  }
}
