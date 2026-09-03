import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { encode, decode } from "next-auth/jwt"
import { upsertUserOnSignIn } from "@/lib/user"

// NextAuth v5's own default session cookie name is "authjs.session-token".
// This app overrides it to the older v4-style name below (kept for
// continuity with cookies already issued before the v5 upgrade). Any code
// that reads the session cookie directly - i.e. getToken() calls outside
// this file, see lib/github-auth.ts - must be told this same name, or it
// silently falls back to the v5 default and never finds the cookie.
export const SESSION_COOKIE_NAME = `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "repo read:user user:email project",
        },
      },
      // Disable PKCE for GitHub OAuth (fixes Vercel deployment issue)
      checks: ["state"],
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    // Explicitly use encrypted JWTs (NextAuth v5 uses JWE by default)
    encode: async (params) => {
      // Use NextAuth's built-in encryption (JWE - JSON Web Encryption)
      return encode(params)
    },
    decode: async (params) => {
      // Use NextAuth's built-in decryption
      return decode(params)
    },
  },
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Host-" : ""}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    state: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 900, // 15 minutes
      },
    },
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.expiresAt = account.expires_at

        // Fresh sign-in - make sure a User row exists for this GitHub
        // account so it's there the first time they hit a DB-backed route
        // (plan lookups, Stripe checkout, etc). `sub` is the GitHub numeric
        // user id (see the GitHub provider's default profile() mapping).
        if (typeof token.sub === "string" && token.sub.length > 0) {
          try {
            await upsertUserOnSignIn({
              githubId: token.sub,
              email: typeof token.email === "string" ? token.email : null,
            })
          } catch (error) {
            // Never block sign-in on a DB hiccup - the row gets created
            // lazily on the next sign-in or the first Stripe checkout.
            console.error("Failed to upsert user on sign-in:", error)
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      // token.sub (the GitHub numeric user id) is not sensitive - unlike
      // the OAuth access token above, it's fine to expose to client-side
      // JS. The pricing UI and billing routes use it to key plan lookups.
      if (session.user && typeof token.sub === "string") {
        session.user.id = token.sub
      }

      // Intentionally do NOT copy the GitHub OAuth access token (or its
      // expiry) onto the session object here. The session returned by this
      // callback is what /api/auth/session serves to the browser and what
      // useSession() exposes to client-side JS, so anything placed on it is
      // readable by any script running on the page (e.g. via an XSS bug or
      // a malicious dependency) - including the raw token with its
      // "repo read:user user:email project" scope.
      //
      // The token itself still lives in the encrypted, httpOnly JWT cookie
      // (see the jwt() callback above). Server-side code that needs it
      // (API routes) should call getToken() from "next-auth/jwt" directly
      // against the incoming request instead of reading it off the
      // session - see lib/github-auth.ts.
      return session
    },
  },
  pages: {
    signIn: "/",
  },
})
