import { NextResponse } from "next/server"
import { getSubscriptionHistory } from "@/lib/api/subscription-api"

export async function GET() {
  try {
    const history = await getSubscriptionHistory()

    return NextResponse.json(history)
  } catch (error) {
    console.error("Error fetching subscription history:", error)
    return NextResponse.json({ error: "Failed to fetch subscription history" }, { status: 500 })
  }
}
