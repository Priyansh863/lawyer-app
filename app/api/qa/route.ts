import { type NextRequest, NextResponse } from "next/server"
import type { QAItem } from "@/types/qa"
import endpoints from "@/constant/endpoints"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const page = searchParams.get("page") || "1"
    const limit = searchParams.get("limit") || "10"
    
    // Build query string
    const queryParams = new URLSearchParams()
    if (status) queryParams.append("status", status)
    if (category) queryParams.append("category", category)
    queryParams.append("page", page)
    queryParams.append("limit", limit)
    
    // Call backend API
    const response = await fetch(`${endpoints.question.CREATE_QUESTION}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Error fetching questions: ${response.statusText}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data.data)
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Get the auth token from request headers or cookies
    let token = request.headers.get('authorization')?.split(' ')[1]
    
    // If no token in headers, try cookies from the request
    if (!token) {
      token = request.cookies.get('authToken')?.value
    }

    // Validate required fields
    if (!data.question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    // Call backend API to create the question
    const response = await fetch(endpoints.question.CREATE_QUESTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        question: data.question,
        clientName: data.clientName,
        isAnonymous: data.isAnonymous,
        category: data.category,
        tags: data.tags
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || "Failed to create question" },
        { status: response.status }
      )
    }

    const responseData = await response.json()
    return NextResponse.json(responseData.data, { status: 201 })
  } catch (error) {
    console.error("Error creating question:", error)
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    )
  }
}
