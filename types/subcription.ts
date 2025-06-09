export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: {
    monthly: number
    annual: number
  }
  features: string[]
}

export interface TokenBundle {
  id: string
  tokens: number
  price: number
  popular?: boolean
}

export interface SubscriptionInvoice {
  id: string
  date: string
  description: string
  amount: number
  status: "Paid" | "Pending" | "Failed"
}

export interface SubscriptionState {
  currentPlan: string
  billingCycle: "monthly" | "annual"
  nextBillingDate: string
  autoRenew: boolean
}
