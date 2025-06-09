import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Mock document data
    const document = {
      id,
      name: "Agreement.pdf",
      uploadedBy: "Client",
      uploadDate: "18/02/2025",
      summary: "Property sale agreement summary",
      status: "approved",
      fileSize: "2.5 MB",
      fileType: "PDF",
    }

    return NextResponse.json(document)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()

    // Mock document update
    const updatedDocument = {
      id,
      ...body,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(updatedDocument)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Mock document deletion
    return NextResponse.json({ message: "Document deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
