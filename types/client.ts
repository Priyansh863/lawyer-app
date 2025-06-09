export type ClientStatus = "active" | "inactive" | "pending"

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  notes?: string
  status: ClientStatus
  createdAt: string
  lastContactDate: string
  caseId: string
  contactInfo: string
  activeCases: number
  isFavorite: boolean
  isBlocked: boolean
  avatar?: string
}

// Schema for client creation/update
export const clientSchema = {
  name: {
    label: "Name",
    type: "text",
    required: true,
    validation: {
      minLength: 2,
      maxLength: 100,
    },
  },
  email: {
    label: "Email Address",
    type: "email",
    required: true,
    validation: {
      pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    },
  },
  phone: {
    label: "Phone Number",
    type: "tel",
    required: true,
    validation: {
      pattern: "^[0-9\\-\\+\\s()]{8,20}$",
    },
  },
  address: {
    label: "Address",
    type: "textarea",
    required: false,
    validation: {
      maxLength: 200,
    },
  },
  notes: {
    label: "Notes",
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
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "pending", label: "Pending" },
    ],
    defaultValue: "active",
  },
  isFavorite: {
    label: "Favorite",
    type: "checkbox",
    required: false,
    defaultValue: false,
  },
  isBlocked: {
    label: "Blocked",
    type: "checkbox",
    required: false,
    defaultValue: false,
  },
}

// Field mapping for API requests
export const clientApiMapping = {
  create: {
    name: "name",
    email: "email",
    phone: "phone",
    address: "address",
    notes: "notes",
    status: "status",
    isFavorite: "is_favorite",
    isBlocked: "is_blocked",
  },
  update: {
    id: "client_id",
    name: "name",
    email: "email",
    phone: "phone",
    address: "address",
    notes: "notes",
    status: "status",
    isFavorite: "is_favorite",
    isBlocked: "is_blocked",
  },
}
