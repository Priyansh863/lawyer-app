export type CaseStatus = "pending" | "approved" | "rejected"

export interface Case {
  id: string
  title: string
  clientName: string
  clientId: string
  status: CaseStatus
  createdAt: string
  updatedAt: string
  description?: string
  assignedTo: string[]
}

// Schema for case creation/update
export const caseSchema = {
  title: {
    label: "Case Title",
    type: "text",
    required: true,
    validation: {
      minLength: 3,
      maxLength: 100,
    },
  },
  clientId: {
    label: "Client",
    type: "select",
    required: true,
    options: "api:clients", // This would be populated from an API
  },
  description: {
    label: "Description",
    type: "textarea",
    required: false,
    validation: {
      maxLength: 1000,
    },
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
  assignedTo: {
    label: "Assigned To",
    type: "multiselect",
    required: true,
    options: "api:users", // This would be populated from an API
  },
}

// Field mapping for API requests
export const caseApiMapping = {
  create: {
    title: "title",
    clientId: "client_id",
    description: "description",
    status: "status",
    assignedTo: "assigned_to",
  },
  update: {
    id: "case_id",
    title: "title",
    description: "description",
    status: "status",
    assignedTo: "assigned_to",
  },
}
