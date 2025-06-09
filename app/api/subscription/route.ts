import { NextResponse } from "next/server"
import { getCurrentSubscription, getAvailablePlans, getTokenBundles } from "@/lib/api/subscription-api"

export async function GET() {
  try {
    const [currentSubscription, availablePlans, tokenBundles] = await Promise.all([
      getCurrentSubscription(),
      getAvailablePlans(),
      getTokenBundles(),
    ])

    return NextResponse.json({
      currentSubscription,
      availablePlans,
      tokenBundles,
    })
  } catch (error) {
    console.error("Error fetching subscription data:", error)
    return NextResponse.json({ error: "Failed to fetch subscription data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { planId, billingCycle } = body

    // In a real application, you would validate the input and update the subscription in your database

    return NextResponse.json({
      success: true,
      message: "Subscription updated successfully",
    })
  } catch (error) {
    console.error("Error updating subscription:", error)
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
  }
}
