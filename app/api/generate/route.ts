import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { GitHubService } from "@/lib/github"
import { getTemplateById } from "@/lib/templates"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { templateId, template: clientTemplate, owner, repo } = await request.json()

    if ((!templateId && !clientTemplate) || !owner || !repo) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Use provided template object (for custom templates) or fetch by ID (for built-in templates)
    const template = clientTemplate || getTemplateById(templateId)
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    const github = new GitHubService(session.accessToken)

    // Verify access to repository
    const hasAccess = await github.verifyAccess(owner, repo)
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to repository or repository not found" },
        { status: 403 }
      )
    }

    // Generate the board
    const result = await github.generateBoard(owner, repo, template)

    // Add cache-busting parameter to force GitHub to show fresh data
    const timestamp = Date.now()

    return NextResponse.json({
      success: true,
      ...result,
      repositoryUrl: `https://github.com/${owner}/${repo}`,
      issuesUrl: `https://github.com/${owner}/${repo}/issues?t=${timestamp}`,
    })
  } catch (error) {
    console.error("Generation error:", error)
    const message = error instanceof Error ? error.message : "Failed to generate board"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
