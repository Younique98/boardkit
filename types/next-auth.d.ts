import "next-auth"
import type { DefaultSession } from "next-auth"

// `id` (the GitHub numeric user id, from the JWT `sub` claim) is safe to
// expose on the session - unlike the OAuth access token below, it's not a
// credential. It's how DB-backed plan lookups and the pricing UI key off
// "who is this" without decrypting the session cookie server-side. See the
// `session` callback in lib/auth.ts.
declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}

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
