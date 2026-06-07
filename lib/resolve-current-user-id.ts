/** Resolve logged-in user id from Redux prop, session blob, or localStorage. */
export function resolveCurrentUserId(explicit?: string | null): string | null {
  if (explicit != null && String(explicit).trim()) {
    return String(explicit).trim()
  }

  if (typeof window === 'undefined') return null

  const fromRecord = (row: Record<string, unknown> | null | undefined): string | null => {
    if (!row) return null
    const id = row._id ?? row.id ?? row.userId ?? row.user_id
    if (id != null && String(id).trim()) return String(id).trim()
    return null
  }

  try {
    const authUser = localStorage.getItem('authUser')
    if (authUser) {
      const parsed = JSON.parse(authUser) as Record<string, unknown>
      const direct = fromRecord(parsed)
      if (direct) return direct
    }

    const raw = localStorage.getItem('user')
    if (!raw) return null

    const parsed = JSON.parse(raw) as Record<string, unknown>
    const direct = fromRecord(parsed)
    if (direct) return direct

    const ud = parsed.userData
    if (ud && typeof ud === 'object' && !Array.isArray(ud)) {
      const nested = fromRecord(ud as Record<string, unknown>)
      if (nested) return nested
    }

    const data = parsed.data
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const d = data as Record<string, unknown>
      const fromData = fromRecord(d)
      if (fromData) return fromData
      const inner = d.userData
      if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
        const fromInner = fromRecord(inner as Record<string, unknown>)
        if (fromInner) return fromInner
      }
    }
  } catch {
    return null
  }

  return null
}
