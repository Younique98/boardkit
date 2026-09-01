import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { encode, decode } from "next-auth/jwt"

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
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
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
      }
      return token
    },
    async session({ session }) {
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
