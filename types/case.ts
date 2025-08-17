// Korean Legal Case Status Types based on court outcomes
export type CaseStatus = 
  // Judgment Outcomes (판결 종국)
  | "full_win"           // 전부 승소 - Full Win
  | "full_loss"          // 전부 패소 - Full Loss  
  | "partial_win"        // 부분 승소 - Partial Win
  | "partial_loss"       // 부분 패소 - Partial Loss
  | "dismissal"          // 기각 - Dismissal
  | "rejection"          // 각하 - Rejection
  // Non-Judgment Outcomes (판결 외 종국)
  | "withdrawal"         // 취하 - Withdrawal
  | "mediation"          // 조정 - Mediation
  | "settlement"         // 화해 - Settlement
  | "trial_cancellation" // 공판취소 - Trial Cancellation
  | "suspension"         // 중지 - Suspension
  | "closure"            // 종결 - Closure
  // Active case statuses
  | "in_progress"        // 진행 중 - Case in progress
  | "pending"            // 대기 중 - Pending start

export type CaseType = "civil" | "criminal" | "family" | "corporate" | "immigration" | "personal_injury" | "real_estate" | "intellectual_property" | "employment" | "tax" | "bankruptcy" | "other"

export type CourtType = "district_court" | "high_court" | "supreme_court" | "family_court" | "commercial_court" | "consumer_court" | "labor_court" | "tax_court" | "tribunal" | "arbitration" | "other"

export interface Case {
  id: string
  _id?: string
  case_number: string
  title: string
  description?: string
  summary?: string
  key_points?: string[]
  status: CaseStatus
  case_type: CaseType
  court_type: CourtType
  client_id: {
    _id: string
    first_name: string
    last_name?: string
    id: string
  } | string
  lawyer_id: {
    _id: string
    first_name: string
    last_name?: string
    id: string
  } | string
  files: any[]
  important_dates?: { event: string; date: string }[]
  created_at: string
  updated_at: string
  createdAt: string
  updatedAt: string
  __v?: number
  // Legacy fields for backward compatibility
  clientName?: string
  clientId?: string
  assignedTo?: string[]
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

// Case Type Configuration
export const caseTypeConfig = {
  civil: { label: "Civil Law", color: "bg-blue-100 text-blue-800" },
  criminal: { label: "Criminal Law", color: "bg-red-100 text-red-800" },
  family: { label: "Family Law", color: "bg-pink-100 text-pink-800" },
  corporate: { label: "Corporate Law", color: "bg-purple-100 text-purple-800" },
  immigration: { label: "Immigration Law", color: "bg-green-100 text-green-800" },
  personal_injury: { label: "Personal Injury", color: "bg-orange-100 text-orange-800" },
  real_estate: { label: "Real Estate Law", color: "bg-teal-100 text-teal-800" },
  intellectual_property: { label: "Intellectual Property", color: "bg-indigo-100 text-indigo-800" },
  employment: { label: "Employment Law", color: "bg-yellow-100 text-yellow-800" },
  tax: { label: "Tax Law", color: "bg-gray-100 text-gray-800" },
  bankruptcy: { label: "Bankruptcy Law", color: "bg-red-100 text-red-800" },
  other: { label: "Other", color: "bg-slate-100 text-slate-800" }
}

// Court Type Configuration
export const courtTypeConfig = {
  district_court: { label: "District Court", color: "bg-blue-100 text-blue-800" },
  high_court: { label: "High Court", color: "bg-purple-100 text-purple-800" },
  supreme_court: { label: "Supreme Court", color: "bg-red-100 text-red-800" },
  family_court: { label: "Family Court", color: "bg-pink-100 text-pink-800" },
  commercial_court: { label: "Commercial Court", color: "bg-green-100 text-green-800" },
  consumer_court: { label: "Consumer Court", color: "bg-orange-100 text-orange-800" },
  labor_court: { label: "Labor Court", color: "bg-yellow-100 text-yellow-800" },
  tax_court: { label: "Tax Court", color: "bg-gray-100 text-gray-800" },
  tribunal: { label: "Tribunal", color: "bg-teal-100 text-teal-800" },
  arbitration: { label: "Arbitration", color: "bg-indigo-100 text-indigo-800" },
  other: { label: "Other", color: "bg-slate-100 text-slate-800" }
}

// Field mapping for API requests
export const caseApiMapping = {
  create: {
    title: "title",
    clientId: "client_id",
    description: "description",
    status: "status",
    assignedTo: "assigned_to",
    case_type: "case_type",
    court_type: "court_type",
  },
  update: {
    id: "case_id",
    title: "title",
    description: "description",
    status: "status",
    assignedTo: "assigned_to",
    case_type: "case_type",
    court_type: "court_type",
  },
}
