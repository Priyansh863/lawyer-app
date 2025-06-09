import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const uploadedBy = searchParams.get("uploadedBy")

    // Mock documents data
    const documents = [
      {
        id: "1",
        name: "Agreement.pdf",
        uploadedBy: "Client",
        uploadDate: "18/02/2025",
        summary: "Property sale agreement summary",
        status: "approved",
        fileSize: "2.5 MB",
        fileType: "PDF",
      },
      {
        id: "2",
        name: "ID_Proof.jpg",
        uploadedBy: "Client",
        uploadDate: "18/02/2025",
        summary: "Aadhaar card for verification",
        status: "pending",
        fileSize: "1.2 MB",
        fileType: "JPG",
      },
    ]

    let filteredDocuments = documents

    if (status && status !== "all") {
      filteredDocuments = filteredDocuments.filter((doc) => doc.status === status)
    }

    if (uploadedBy) {
      filteredDocuments = filteredDocuments.filter((doc) =>
        doc.uploadedBy.toLowerCase().includes(uploadedBy.toLowerCase()),
      )
    }

    return NextResponse.json(filteredDocuments)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const name = formData.get("name") as string
    const file = formData.get("file") as File
    const summary = formData.get("summary") as string

    if (!name || !file || !summary) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Mock document creation
    const newDocument = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      uploadedBy: "Current User",
      uploadDate: new Date().toLocaleDateString(),
      summary,
      status: "pending",
      fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      fileType: file.type.split("/")[1].toUpperCase(),
    }

    return NextResponse.json(newDocument, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }
}
