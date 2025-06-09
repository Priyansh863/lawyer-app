import type { Metadata } from "next"
import SubscriptionLayout from "@/components/layouts/subscription-layout"
import SubscriptionPlans from "@/components/subscription/subscription-plans"
import TokenBundles from "@/components/subscription/token-bundles"
import SubscriptionHistory from "@/components/subscription/subscription-history"

export const metadata: Metadata = {
  title: "Subscription | Legal Practice Management",
  description: "Manage your subscription plans and token purchases",
}

export default function SubscriptionPage() {
  return (
    <SubscriptionLayout>
      <div className="space-y-8">
        <SubscriptionPlans />
        <TokenBundles />
        <SubscriptionHistory />
      </div>
    </SubscriptionLayout>
  )
}
