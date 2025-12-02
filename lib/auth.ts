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
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.expiresAt = account.expires_at
      }
      return token
    },
    async session({ session, token }) {
      // Adding custom properties to session (type cast for custom fields)
      const extendedSession = session as typeof session & {
        accessToken?: string
        expiresAt?: number
      }
      extendedSession.accessToken = token.accessToken as string
      extendedSession.expiresAt = token.expiresAt as number
      return session
    },
  },
  pages: {
    signIn: "/",
  },
})
