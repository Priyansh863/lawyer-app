import { NextResponse } from "next/server"
import { getTokenBalance, getTokenTransactions, getTokenAnalytics } from "@/lib/api/token-api"

export async function GET() {
  try {
    const balance = await getTokenBalance()
    const transactions = await getTokenTransactions()
    const analytics = await getTokenAnalytics()

    return NextResponse.json({
      balance,
      transactions,
      analytics,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch token data" }, { status: 500 })
  }
}
