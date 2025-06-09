import TokenHeader from "@/components/token/token-header"
import TokenBalance from "@/components/token/token-balance"
import TokenTransactions from "@/components/token/token-transactions"
import TokenAnalytics from "@/components/token/token-analytics"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Token | Legal Practice Management",
  description: "Display token usage and earnings",
}

export default function TokenPage() {
  return (
    <div className="space-y-6">
      <TokenHeader />
      <TokenBalance />
      <TokenTransactions />
      <TokenAnalytics />
    </div>
  )
}
