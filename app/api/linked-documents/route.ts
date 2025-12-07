import { type NextRequest, NextResponse } from "next/server"

// FIXED: Use the deployed backend URL instead of localhost
// When running in production/server-side, localhost won't work
const BACKEND_API_URL = 'https://lawyer-b-b5ud.vercel.app'

/**
 * GET /api/linked-documents
 * Fetches all linked documents for a user
 * Query params: userId (required)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      )
    }

    console.log(`Fetching documents from: ${BACKEND_API_URL}/api/documents?userId=${userId}`)

    // Get documents - Using the exact pattern provided
    const response = await fetch(
      `${BACKEND_API_URL}/api/documents?userId=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    )

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error response:', errorText)
      
      return NextResponse.json(
        { 
          success: false, 
          message: `Backend API error: ${response.status} ${response.statusText}`,
          error: errorText.substring(0, 200) // First 200 chars of error
        },
        { status: response.status }
      )
    }

    // Check content type before parsing JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Non-JSON response:', text.substring(0, 200))
      
      return NextResponse.json(
        { 
          success: false, 
          message: "Backend returned non-JSON response (likely an error page)",
          error: `Content-Type: ${contentType}`,
          hint: "Check if backend is running on the correct URL"
        },
        { status: 500 }
      )
    }

    const result = await response.json()
    
    if (result.success) {
      console.log('Documents fetched successfully:', result.data?.length || 0, 'documents')
      return NextResponse.json(result)
    } else {
      console.error('Backend returned error:', result.message)
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('Error in GET /api/linked-documents:', error)
    
    // Better error handling
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Cannot connect to backend server",
          error: "Network error - backend may be offline",
          hint: `Make sure backend is running at: ${BACKEND_API_URL}` 
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch linked documents",
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/linked-documents/open
 * Request to open a metadata-only file
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { docId } = body

    if (!docId) {
      return NextResponse.json(
        { success: false, message: "Document ID is required" },
        { status: 400 }
      )
    }

    console.log(`Opening file from: ${BACKEND_API_URL}/api/documents/open`)

    // Forward request to backend API
    const response = await fetch(`${BACKEND_API_URL}/api/documents/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ docId }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', errorText)
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error opening file:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to open file",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
