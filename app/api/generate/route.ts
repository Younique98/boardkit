import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { GitHubService } from "@/lib/github"
import { getTemplateById } from "@/lib/templates"
import { rateLimit, getClientIdentifier, RateLimitPresets } from "@/lib/rate-limit"
import { z } from "zod"

const boardColumnSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
})

const phaseColumnMappingSchema = z.object({
  phaseName: z.string(),
  columnName: z.string(),
})

const boardConfigurationSchema = z.object({
  enabled: z.boolean(),
  boardType: z.enum(["kanban", "scrum", "custom", "none"]),
  boardName: z.string(),
  columns: z.array(boardColumnSchema),
  phaseMapping: z.array(phaseColumnMappingSchema),
})

const generateRequestSchema = z.object({
  templateId: z.string().optional(),
  template: z.any().optional(),
  owner: z.string().min(1).max(100),
  repo: z.string().min(1).max(100),
  boardConfig: boardConfigurationSchema.optional(),
}).refine(data => data.templateId || data.template, {
  message: "Either templateId or template must be provided",
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - strict for expensive board generation
    const identifier = getClientIdentifier(request)
    const rateLimitResult = rateLimit(identifier, RateLimitPresets.strict)

    if (!rateLimitResult.success) {
      const resetDate = new Date(rateLimitResult.reset).toISOString()
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RateLimitPresets.strict.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetDate,
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

    // Validate and parse request body
    const body = await request.json()
    const validation = generateRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      )
    }

    const { templateId, template: clientTemplate, owner, repo, boardConfig } = validation.data

    // Use provided template object (for custom templates) or fetch by ID (for built-in templates)
    const template = clientTemplate || (templateId ? getTemplateById(templateId) : null)
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
        { error: "Repository access denied" },
        { status: 403 }
      )
    }

    // Generate the board (and optionally create project board)
    const result = await github.generateBoard(owner, repo, template, boardConfig)

    // Add cache-busting parameter to force GitHub to show fresh data
    const timestamp = Date.now()

    const response = {
      success: true,
      ...result,
      repositoryUrl: `https://github.com/${owner}/${repo}`,
      issuesUrl: `https://github.com/${owner}/${repo}/issues?t=${timestamp}`,
      projectUrl: result.projectUrl ? `${result.projectUrl}?t=${timestamp}` : undefined,
    }

    return NextResponse.json(response)
  } catch (error) {
    // Log detailed error for debugging (server-side only)
    console.error("Board generation failed:", error)

    // Return sanitized error message to client
    return NextResponse.json(
      { error: "Failed to generate board. Please try again." },
      { status: 500 }
    )
  }
}
