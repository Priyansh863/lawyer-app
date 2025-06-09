export interface Document {
  id: string
  name: string
  uploadedBy: string
  uploadDate: string
  summary: string
  status: "approved" | "pending" | "rejected"
  fileSize?: string
  fileType?: string
  createdAt: Date
  updatedAt: Date
}

export interface DocumentFilters {
  status?: string
  uploadedBy?: string
  dateRange?: {
    from: Date
    to: Date
  }
}

export interface DocumentFormData {
  name: string
  file: File
  summary: string
  tags?: string[]
}
