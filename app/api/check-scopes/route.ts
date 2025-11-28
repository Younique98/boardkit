import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

interface SessionWithToken {
  accessToken?: string
}

export async function GET() {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // Get the access token from the session
  const accessToken = (session as unknown as SessionWithToken).accessToken

  if (!accessToken) {
    return NextResponse.json({ error: "No access token" }, { status: 401 })
  }

  // Check the scopes by calling GitHub API
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const scopes = response.headers.get("x-oauth-scopes") || "none"

  return NextResponse.json({
    scopes: scopes.split(",").map(s => s.trim()),
    hasProjectScope: scopes.includes("project")
  })
}
