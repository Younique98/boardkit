import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { getStripeClient } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

/**
 * Stripe webhook endpoint. Verifies the signature, then keeps the User
 * record's plan/subscription fields in sync with Stripe.
 *
 * Configure this URL (https://<your-domain>/api/stripe/webhook) in the
 * Stripe Dashboard under Developers > Webhooks, subscribed to at least:
 *   - checkout.session.completed
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 * and set STRIPE_WEBHOOK_SECRET to the signing secret Stripe shows you for
 * that endpoint (see .env.example).
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured - rejecting webhook")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 })
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  // IMPORTANT: read the raw body via .text(), never .json() - Stripe's
  // signature is computed over the exact raw bytes, and JSON-parsing then
  // re-serializing would invalidate it.
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    const stripe = getStripeClient()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(checkoutSession)
        break
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }
      default:
        // Other event types are ignored - not an error, just not something
        // this app tracks.
        break
    }
  } catch (error) {
    // Log and 500 so Stripe retries delivery, but don't leak internals.
    console.error(`Failed to process Stripe webhook event ${event.type}:`, error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function resolveGithubUserId(params: {
  metadataGithubUserId?: string | null
  stripeCustomerId?: string | null
}): Promise<string | null> {
  const { metadataGithubUserId, stripeCustomerId } = params

  if (metadataGithubUserId) return metadataGithubUserId

  if (stripeCustomerId) {
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId },
      select: { id: true },
    })
    if (user) return user.id
  }

  return null
}

async function handleCheckoutCompleted(checkoutSession: Stripe.Checkout.Session) {
  const githubUserId = await resolveGithubUserId({
    metadataGithubUserId: checkoutSession.metadata?.githubUserId ?? checkoutSession.client_reference_id,
    stripeCustomerId: typeof checkoutSession.customer === "string" ? checkoutSession.customer : null,
  })

  if (!githubUserId) {
    console.error("checkout.session.completed: could not resolve a GitHub user id", {
      checkoutSessionId: checkoutSession.id,
    })
    return
  }

  const customerId =
    typeof checkoutSession.customer === "string" ? checkoutSession.customer : checkoutSession.customer?.id

  const subscriptionId =
    typeof checkoutSession.subscription === "string"
      ? checkoutSession.subscription
      : checkoutSession.subscription?.id

  if (!customerId || !subscriptionId) {
    console.error("checkout.session.completed: missing customer or subscription id", {
      checkoutSessionId: checkoutSession.id,
    })
    return
  }

  // Fetch the subscription directly rather than trusting checkout.session's
  // own snapshot - customer.subscription.updated (handled below) will also
  // fire and is the source of truth going forward, but doing this here
  // means the user is marked PREMIUM immediately instead of waiting on a
  // second webhook delivery.
  const stripe = getStripeClient()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  await prisma.user.upsert({
    where: { id: githubUserId },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      plan: isActiveSubscriptionStatus(subscription.status) ? "PREMIUM" : "FREE",
      stripeCurrentPeriodEnd: getCurrentPeriodEnd(subscription),
    },
    create: {
      id: githubUserId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      plan: isActiveSubscriptionStatus(subscription.status) ? "PREMIUM" : "FREE",
      stripeCurrentPeriodEnd: getCurrentPeriodEnd(subscription),
    },
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id

  const githubUserId = await resolveGithubUserId({
    metadataGithubUserId: subscription.metadata?.githubUserId ?? null,
    stripeCustomerId: customerId,
  })

  if (!githubUserId) {
    console.error("customer.subscription.updated: could not resolve a GitHub user id", {
      subscriptionId: subscription.id,
      customerId,
    })
    return
  }

  await prisma.user.updateMany({
    where: { id: githubUserId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      plan: isActiveSubscriptionStatus(subscription.status) ? "PREMIUM" : "FREE",
      stripeCurrentPeriodEnd: getCurrentPeriodEnd(subscription),
    },
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id

  const githubUserId = await resolveGithubUserId({
    metadataGithubUserId: subscription.metadata?.githubUserId ?? null,
    stripeCustomerId: customerId,
  })

  if (!githubUserId) {
    console.error("customer.subscription.deleted: could not resolve a GitHub user id", {
      subscriptionId: subscription.id,
      customerId,
    })
    return
  }

  await prisma.user.updateMany({
    where: { id: githubUserId },
    data: {
      plan: "FREE",
      stripeCurrentPeriodEnd: null,
      // Deliberately keep stripeCustomerId/stripeSubscriptionId - the
      // customer record still exists in Stripe (useful if they resubscribe
      // or open the billing portal to view past invoices).
    },
  })
}

function isActiveSubscriptionStatus(status: Stripe.Subscription.Status): boolean {
  return status === "active" || status === "trialing"
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription): Date | null {
  // current_period_end lives on the subscription item in recent API
  // versions, not the subscription itself.
  const item = subscription.items.data[0]
  const periodEnd = item?.current_period_end
  return typeof periodEnd === "number" ? new Date(periodEnd * 1000) : null
}
