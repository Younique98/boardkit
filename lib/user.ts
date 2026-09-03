import { Plan } from "@prisma/client"
import { prisma } from "@/lib/prisma"

/**
 * Ensures a User row exists for this GitHub account, called from the
 * NextAuth `jwt` callback on every fresh sign-in (see lib/auth.ts). Cheap
 * upsert - creates the row on first sign-in, otherwise just refreshes the
 * email address GitHub reports (which can change).
 *
 * Never throws into the auth flow: a DB hiccup here should not block sign-in
 * (the row gets created/updated on the next sign-in, or lazily by the Stripe
 * checkout route). Callers should still wrap this in try/catch as a second
 * line of defense.
 */
export async function upsertUserOnSignIn(params: {
  githubId: string
  email?: string | null
}) {
  const { githubId, email } = params
  return prisma.user.upsert({
    where: { id: githubId },
    update: { email: email ?? undefined },
    create: { id: githubId, email: email ?? undefined, plan: Plan.FREE },
  })
}

/**
 * Looks up a user's current plan for feature-gating decisions (rate limits,
 * the pricing UI, etc). Defaults to FREE on any failure - a DB outage should
 * degrade users to the free tier, never silently grant premium.
 */
export async function getUserPlan(githubId: string): Promise<Plan> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: githubId },
      select: { plan: true, stripeCurrentPeriodEnd: true },
    })

    if (!user) return Plan.FREE

    // Safety net: if the webhook that should have downgraded this user on
    // cancellation/non-payment never arrived, don't let a stale PREMIUM
    // flag outlive the period Stripe actually paid for.
    if (
      user.plan === Plan.PREMIUM &&
      user.stripeCurrentPeriodEnd &&
      user.stripeCurrentPeriodEnd.getTime() < Date.now()
    ) {
      return Plan.FREE
    }

    return user.plan
  } catch (error) {
    console.error("Failed to look up user plan, defaulting to FREE:", error)
    return Plan.FREE
  }
}
