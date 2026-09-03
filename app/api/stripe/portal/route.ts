import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStripeClient } from "@/lib/stripe"
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit"

/**
 * Creates a Stripe Billing Portal session and redirects the signed-in user
 * to it, so they can manage or cancel their own subscription. This is the
 * entirety of BoardKit's cancel/manage-subscription flow - no custom UI,
 * Stripe's hosted portal is the standard, correct way to do this.
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  const identifier = `user:${userId}`
  const rateLimitResult = await rateLimit(identifier, RateLimitPresets.lenient)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    })

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found. Subscribe first to manage billing." },
        { status: 400 }
      )
    }

    const stripe = getStripeClient()
    const origin = request.nextUrl.origin

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/`,
    })

    return NextResponse.redirect(portalSession.url, 303)
  } catch (error) {
    console.error("Failed to create Stripe Billing Portal session:", error)
    return NextResponse.json(
      { error: "Failed to open billing portal. Please try again." },
      { status: 500 }
    )
  }
}
