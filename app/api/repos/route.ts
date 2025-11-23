import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { GitHubService } from "@/lib/github"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const github = new GitHubService(session.accessToken)
    const repos = await github.getUserRepos()

    return NextResponse.json({ repos })
  } catch (error) {
    console.error("Failed to fetch repos:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch repositories"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
