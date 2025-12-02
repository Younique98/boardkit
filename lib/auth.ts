import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

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
      // @ts-expect-error - Adding custom accessToken property to session
      session.accessToken = token.accessToken
      // @ts-expect-error - Adding expiresAt to session
      session.expiresAt = token.expiresAt
      return session
    },
  },
  pages: {
    signIn: "/",
  },
})
