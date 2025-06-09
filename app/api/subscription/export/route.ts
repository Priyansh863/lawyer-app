import { NextResponse } from "next/server"

export async function GET() {
  try {
    // In a real application, you would generate a CSV file from the subscription history
    // and return a URL to download it

    return NextResponse.json({
      url: "/api/subscription/export/download",
    })
  } catch (error) {
    console.error("Error exporting subscription history:", error)
    return NextResponse.json({ error: "Failed to export subscription history" }, { status: 500 })
  }
}
