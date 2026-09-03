import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStripeClient, STRIPE_PRICE_ID } from "@/lib/stripe"
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit"

/**
 * Starts a Stripe Checkout session for the BoardKit Premium monthly
 * subscription and redirects the signed-in user straight to it.
 *
 * Linked to directly (e.g. <a href="/api/stripe/checkout">Upgrade</a>) -
 * this is a GET that ends in a redirect, not a fetch() call.
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    // Not signed in - send them to sign in first rather than erroring.
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

  if (!STRIPE_PRICE_ID) {
    console.error("STRIPE_PRICE_ID is not configured")
    return NextResponse.json(
      { error: "Billing is not configured yet. Please try again later." },
      { status: 503 }
    )
  }

  try {
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: session.user.email ?? null },
    })

    // Already on premium - send them to the portal to manage the existing
    // subscription instead of starting a second one.
    if (user.plan === "PREMIUM" && user.stripeCustomerId) {
      return NextResponse.redirect(new URL("/api/stripe/portal", request.url))
    }

    const stripe = getStripeClient()
    const origin = request.nextUrl.origin

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      // Reuse the existing Stripe customer if this user has one (e.g. a
      // lapsed subscriber resubscribing); otherwise let Checkout collect
      // an email, seeded from their GitHub account email.
      ...(user.stripeCustomerId
        ? { customer: user.stripeCustomerId }
        : { customer_email: user.email ?? undefined }),
      client_reference_id: userId,
      subscription_data: {
        metadata: { githubUserId: userId },
      },
      metadata: { githubUserId: userId },
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
    })

    if (!checkoutSession.url) {
      throw new Error("Stripe did not return a Checkout URL")
    }

    return NextResponse.redirect(checkoutSession.url, 303)
  } catch (error) {
    console.error("Failed to create Stripe Checkout session:", error)
    return NextResponse.json(
      { error: "Failed to start checkout. Please try again." },
      { status: 500 }
    )
  }
}
