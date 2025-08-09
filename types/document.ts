export type DocumentStatus = "pending" | "approved" | "rejected";

export interface Document {
  _id: string;
  document_name: string;
  uploaded_by: {
    _id: string;
    first_name: string;
    last_name?: string;
    id: string;
  };
  upload_date: string;
  summary?: string;
  status: DocumentStatus;
  link: string;
  file_size?: string;
  file_type?: string;
  created_at: string;
  updated_at: string;
  __v: number;
  // Legacy fields for backward compatibility
  name?: string;
  uploadedBy?: string;
  uploadDate?: string;
}

// Schema for document creation/update
export const documentSchema = {
  document_name: {
    label: "Document Name",
    type: "text",
    required: true,
    validation: {
      minLength: 3,
      maxLength: 100,
    },
  },
  file: {
    label: "File",
    type: "file",
    required: true,
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
  },
  status: {
    label: "Status",
    type: "select",
    required: true,
    options: [
      { value: "pending", label: "Pending" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" },
    ],
    defaultValue: "pending",
  },
  summary: {
    label: "Summary",
    type: "textarea",
    required: false,
    validation: {
      maxLength: 500,
    },
  },
}

// Field mapping for API requests
export const documentApiMapping = {
  create: {
    document_name: "document_name",
    file: "file",
    summary: "summary",
    status: "status",
    uploaded_by: "uploaded_by",
  },
  update: {
    id: "document_id",
    document_name: "document_name",
    summary: "summary",
    status: "status",
  },
}

export interface DocumentFilters {
  status?: DocumentStatus;
  uploaded_by?: string;
  date_range?: {
    from: Date | string;
    to: Date | string;
  };
  query?: string;
  // Legacy filter options
  uploadedBy?: string;
  dateRange?: {
    from: Date | string;
    to: Date | string;
  };
}