import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

/**
 * Reads the caller's GitHub OAuth access token straight out of the
 * encrypted session JWT cookie, server-side only.
 *
 * This deliberately does NOT go through auth()/session() - the session
 * object returned by that path is also what's serialized to the browser
 * for useSession()/`/api/auth/session`, so anything it carries is readable
 * by client-side JS. The access token (scope: "repo read:user user:email
 * project") must never round-trip through that channel. getToken() instead
 * decrypts the httpOnly cookie directly and returns it only to this server
 * code.
 */
export async function getGitHubAccessToken(request: NextRequest): Promise<string | null> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const accessToken = token?.accessToken
  return typeof accessToken === "string" && accessToken.length > 0 ? accessToken : null
}
