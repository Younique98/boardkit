import { PREMIUM_MONTHLY_PRICE_USD } from "@/lib/stripe"

interface PlanIndicatorProps {
  plan: "FREE" | "PREMIUM"
}

/**
 * Honest, minimal plan indicator: shows what plan the signed-in user is on
 * and the one relevant action for it (upgrade, or manage billing). Both
 * links are plain GETs to route handlers that redirect to Stripe - no
 * client JS needed here.
 */
export function PlanIndicator({ plan }: PlanIndicatorProps) {
  const isPremium = plan === "PREMIUM"

  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`px-2.5 py-1 rounded-full font-semibold text-xs ${
          isPremium
            ? "bg-bk-signal text-bk-signal-ink"
            : "bg-bk-border text-bk-ink-muted"
        }`}
      >
        {isPremium ? "Premium" : "Free plan"}
      </span>
      <a
        href={isPremium ? "/api/stripe/portal" : "/api/stripe/checkout"}
        className="font-medium text-bk-accent hover:underline"
      >
        {isPremium ? "Manage subscription" : `Upgrade — $${PREMIUM_MONTHLY_PRICE_USD}/mo`}
      </a>
    </div>
  )
}
