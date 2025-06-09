import { NextResponse } from "next/server"
import { exportTokenTransactions } from "@/lib/api/token-api"

export async function GET() {
  try {
    const csvBlob = await exportTokenTransactions()

    // Convert blob to buffer for response
    const buffer = await csvBlob.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=token-transactions.csv",
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to export token transactions" }, { status: 500 })
  }
}
