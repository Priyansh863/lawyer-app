export interface TokenTransaction {
  id: string | number
  date: string
  clientId: string
  amount: string
  type: "earned" | "spent"
}

export interface TokenAnalytics {
  name: string
  tokens: number
  unused: number
}

export interface TokenBalance {
  available: number
  total: number
  spent: number
}
