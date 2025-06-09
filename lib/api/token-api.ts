import type { TokenTransaction, TokenAnalytics, TokenBalance } from "@/types/token"

export async function getTokenBalance(): Promise<TokenBalance> {
  // This would be an API call in a real implementation
  return {
    available: 1254,
    total: 2000,
    spent: 746,
  }
}

export async function getTokenTransactions(): Promise<TokenTransaction[]> {
  // This would be an API call in a real implementation
  return [
    {
      id: 1,
      date: "Mar 24, 2025",
      clientId: "23165",
      amount: "$20",
      type: "earned",
    },
    {
      id: 2,
      date: "Mar 24, 2025",
      clientId: "23156",
      amount: "$20",
      type: "earned",
    },
    {
      id: 3,
      date: "Mar 24, 2025",
      clientId: "23622",
      amount: "$20",
      type: "earned",
    },
  ]
}

export async function getTokenAnalytics(): Promise<TokenAnalytics[]> {
  // This would be an API call in a real implementation
  return [
    {
      name: "HomeGoods",
      tokens: 8,
      unused: 6,
    },
    {
      name: "Apples",
      tokens: 18,
      unused: 0,
    },
    {
      name: "B&B",
      tokens: 25,
      unused: 5,
    },
    {
      name: "Durable",
      tokens: 12,
      unused: 0,
    },
    {
      name: "Palace",
      tokens: 8,
      unused: 6,
    },
    {
      name: "Cleaning",
      tokens: 8,
      unused: 0,
    },
  ]
}

export async function exportTokenTransactions(): Promise<Blob> {
  // This would be an API call in a real implementation
  // For now, just return a mock CSV
  const csv = `Date,ClientID,Amount,Type
Mar 24, 2025,23165,$20,earned
Mar 24, 2025,23156,$20,earned
Mar 24, 2025,23622,$20,earned`

  return new Blob([csv], { type: "text/csv" })
}
