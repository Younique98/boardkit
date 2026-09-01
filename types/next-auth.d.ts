import "next-auth"

// Deliberately no `accessToken` on the `Session` type: the session object is
// what gets serialized to the browser (useSession(), /api/auth/session), and
// the GitHub OAuth token must never round-trip through that channel. Server
// code reads it from the JWT directly via getToken() - see
// lib/github-auth.ts.
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    expiresAt?: number
  }
}
