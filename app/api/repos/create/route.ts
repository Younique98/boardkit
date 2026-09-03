import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { getGitHubAccessToken } from "@/lib/github-auth"
import { GitHubService } from "@/lib/github"
import { getUserPlan } from "@/lib/user"
import { rateLimit, getClientIdentifier, RateLimitPresets } from "@/lib/rate-limit"

// GitHub repo name rules: letters, digits, ., -, _ (GitHub itself is the
// final authority - this just rejects obviously-invalid input early with a
// clear message instead of a raw 422 from the API).
const createRepoSchema = z.object({
  name: z
    .string()
    .min(1, "Repository name is required")
    .max(100, "Repository name is too long")
    .regex(
      /^[A-Za-z0-9._-]+$/,
      "Repository name can only contain letters, numbers, periods, hyphens, and underscores"
    ),
  description: z.string().max(350).optional(),
  isPrivate: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const identifier = userId ? `user:${userId}` : `ip:${getClientIdentifier(request)}`
    const plan = userId ? await getUserPlan(userId) : "FREE"

    // Strict preset - creating a repository is a real, impactful GitHub API
    // call, same tier as board generation.
    const rateLimitResult = await rateLimit(identifier, RateLimitPresets.strict, plan)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
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
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const validation = createRepoSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid request parameters" },
        { status: 400 }
      )
    }

    const { name, description, isPrivate } = validation.data
    const github = new GitHubService(accessToken)

    try {
      const repo = await github.createRepository({ name, description, isPrivate })
      return NextResponse.json({
        repo: {
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          owner: { login: repo.owner.login },
          private: repo.private,
          description: repo.description,
        },
      })
    } catch (githubError: unknown) {
      const status = (githubError as { status?: number })?.status
      console.error("GitHub API error creating repo:", githubError)

      if (status === 422) {
        // GitHub's 422 covers a few distinct problems (name already taken,
        // invalid name it accepted client-side but rejects server-side,
        // etc) - the `errors[].message` is the most specific, human-usable
        // reason it gives us.
        const details = (githubError as { response?: { data?: { errors?: Array<{ message?: string }> } } })
          ?.response?.data?.errors
        const specificMessage = details?.[0]?.message

        return NextResponse.json(
          {
            error: specificMessage
              ? `Couldn't create repository: ${specificMessage}`
              : `A repository named "${name}" already exists on your account. Choose a different name.`,
            code: "name_taken",
          },
          { status: 422 }
        )
      }
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
      return NextResponse.json({ error: `GitHub API error: ${message}` }, { status: 500 })
    }
  } catch (error) {
    console.error("Repository creation failed:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `Failed to create repository: ${message}` }, { status: 500 })
  }
}
