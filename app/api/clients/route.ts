import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { getClients, createClient } from "@/lib/api/clients-api"
import { clientApiMapping } from "@/types/client"

/**
 * GET /api/clients
 * Get clients with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get("status") || "all"
    const query = url.searchParams.get("query") || ""
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")

    const clients = await getClients({
      status: status as any,
      query,
      page,
      limit,
    })

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("Get clients error:", error)
    return NextResponse.json({ error: "Failed to retrieve clients" }, { status: 500 })
  }
}

/**
 * POST /api/clients
 * Create a new client
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Map request fields to API fields using the mapping
    const apiData: Record<string, any> = {}
    for (const [clientField, apiField] of Object.entries(clientApiMapping.create)) {
      if (body[clientField] !== undefined) {
        apiData[apiField] = body[clientField]
      }
    }

    const newClient = await createClient(apiData)

    return NextResponse.json({ client: newClient }, { status: 201 })
  } catch (error) {
    console.error("Create client error:", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}
