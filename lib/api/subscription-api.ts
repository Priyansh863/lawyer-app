import type { SubscriptionPlan, TokenBundle, SubscriptionInvoice, SubscriptionState } from "@/types/subscription"

// Mock API functions for subscription management
//  these would make actual API calls to your backend

export async function getCurrentSubscription(): Promise<SubscriptionState> {
  // Simulate API call
  return {
    currentPlan: "advanced",
    billingCycle: "monthly",
    nextBillingDate: "2025-06-01",
    autoRenew: true,
  }
}

export async function getAvailablePlans(): Promise<SubscriptionPlan[]> {
  // Simulate API call
  return [
    {
      id: "free",
      name: "Free Trial",
      description: "14 days free Trial",
      price: { monthly: 0, annual: 0 },
      features: ["Limited access to cases", "Basic document storage", "Email support"],
    },
    {
      id: "advanced",
      name: "Advanced",
      description: "Best for 100+ team size",
      price: { monthly: 425, annual: 4250 },
      features: ["Unlimited cases", "Advanced document management", "Priority support", "AI features (limited)"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Best value for 1000+ team",
      price: { monthly: 799, annual: 7990 },
      features: [
        "Everything in Advanced",
        "Unlimited storage",
        "24/7 support",
        "Advanced analytics",
        "Custom integrations",
      ],
    },
    {
      id: "custom",
      name: "Custom",
      description: "Request a custom license",
      price: { monthly: 999, annual: 9990 },
      features: ["Custom solution", "Dedicated account manager", "On-premise deployment options", "Custom training"],
    },
  ]
}

export async function getTokenBundles(): Promise<TokenBundle[]> {
  // Simulate API call
  return [
    {
      id: "bundle-100",
      tokens: 100,
      price: 49,
      popular: false,
    },
    {
      id: "bundle-500",
      tokens: 500,
      price: 199,
      popular: true,
    },
    {
      id: "bundle-1000",
      tokens: 1000,
      price: 349,
      popular: false,
    },
    {
      id: "bundle-5000",
      tokens: 5000,
      price: 1499,
      popular: false,
    },
  ]
}

export async function getSubscriptionHistory(): Promise<SubscriptionInvoice[]> {
  // Simulate API call
  return [
    {
      id: "INV-001",
      date: "2025-05-01",
      description: "Monthly Subscription - Advanced Plan",
      amount: 425.0,
      status: "Paid",
    },
    {
      id: "INV-002",
      date: "2025-05-01",
      description: "Token Bundle - 500 Tokens",
      amount: 199.0,
      status: "Paid",
    },
    {
      id: "INV-003",
      date: "2025-04-01",
      description: "Monthly Subscription - Advanced Plan",
      amount: 425.0,
      status: "Paid",
    },
    {
      id: "INV-004",
      date: "2025-03-01",
      description: "Monthly Subscription - Advanced Plan",
      amount: 425.0,
      status: "Paid",
    },
    {
      id: "INV-005",
      date: "2025-02-01",
      description: "Monthly Subscription - Advanced Plan",
      amount: 425.0,
      status: "Paid",
    },
  ]
}

export async function changePlan(
  planId: string,
  billingCycle: "monthly" | "annual",
): Promise<{ success: boolean; message: string }> {
  // Simulate API call
  return {
    success: true,
    message: "Subscription plan updated successfully",
  }
}

export async function purchaseTokens(bundleId: string): Promise<{ success: boolean; message: string }> {
  // Simulate API call
  return {
    success: true,
    message: "Tokens purchased successfully",
  }
}

export async function exportSubscriptionHistory(): Promise<{ url: string }> {
  // Simulate API call
  return {
    url: "/api/subscription/export/download",
  }
}
