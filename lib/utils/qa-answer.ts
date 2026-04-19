/**
 * Q&A answers may expose the answering lawyer as `answeredBy` and/or a populated `lawyer_id`
 * user object (same pattern as post.author). Helpers keep comparisons and avatars correct.
 */

export function qaAnswerLawyerIdString(lawyer_id: unknown): string | undefined {
  if (lawyer_id == null) return undefined
  if (typeof lawyer_id === "string") return lawyer_id
  if (typeof lawyer_id === "object" && !Array.isArray(lawyer_id)) {
    const o = lawyer_id as Record<string, unknown>
    const id = o._id ?? o.id
    if (typeof id === "string") return id
    if (id != null && typeof id !== "object") return String(id)
  }
  return undefined
}

/** Merged lawyer row for name/avatar: answeredBy wins over populated lawyer_id when both exist. */
export function qaAnswerLawyerProfileRow(answer: {
  answeredBy?: unknown
  lawyer_id?: unknown
}): Record<string, unknown> | null {
  const ab = answer.answeredBy
  const abObj = ab && typeof ab === "object" && !Array.isArray(ab) ? (ab as Record<string, unknown>) : null
  const lid = answer.lawyer_id
  const lidObj = lid && typeof lid === "object" && !Array.isArray(lid) ? (lid as Record<string, unknown>) : null
  if (abObj && lidObj) return { ...lidObj, ...abObj }
  return abObj ?? lidObj
}

export function qaAnswerDisplayLawyerName(answer: {
  answeredBy?: { first_name?: string; last_name?: string }
  lawyer_id?: unknown
  lawyer_name?: string
}): string {
  const row = qaAnswerLawyerProfileRow(answer)
  if (row) {
    const fn = typeof row.first_name === "string" ? row.first_name : ""
    const ln = typeof row.last_name === "string" ? row.last_name : ""
    const full = `${fn} ${ln}`.trim()
    if (full) return full
  }
  if (answer.lawyer_name) return answer.lawyer_name
  return "Lawyer"
}

export function qaAnswerPrimaryInitial(answer: {
  answeredBy?: { first_name?: string }
  lawyer_id?: unknown
}): string {
  const row = qaAnswerLawyerProfileRow(answer)
  const ch = typeof row?.first_name === "string" ? row.first_name[0] : undefined
  return ch ? ch.toUpperCase() : "?"
}
