/** Normalize profile picture fields used inconsistently across API (profile_image vs avatar). */

export type WithProfileImage = {
  profile_image?: string | null
  avatar?: string | null
  picture?: string | null
}

/** Turn API paths like `/uploads/x.jpg` into absolute URLs for `<img src>`. */
export function toDisplayableMediaUrl(value?: string | null): string | undefined {
  if (typeof value !== "string") return undefined
  const v = value.trim()
  if (!v || v === "#") return undefined
  if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("data:") || v.startsWith("blob:")) {
    return v
  }
  if (typeof window !== "undefined" && v.startsWith("/")) {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || ""
      if (api) {
        const base = api.replace(/\/api\/v1\/?$/i, "").replace(/\/+$/, "")
        const apiOrigin = new URL(base.match(/^https?:\/\//i) ? base : `https://${base}`).origin
        if (apiOrigin !== window.location.origin) {
          return `${apiOrigin}${v}`
        }
      }
    } catch {
      /* use app origin */
    }
    return `${window.location.origin}${v}`
  }
  if (v.startsWith("//")) {
    return `https:${v}`
  }
  return v
}

export function resolveProfileImageUrl(user: WithProfileImage | null | undefined): string | undefined {
  if (!user) return undefined
  const raw = user.profile_image ?? user.avatar ?? user.picture
  if (typeof raw !== "string") return undefined
  const s = raw.trim()
  if (!s) return undefined
  return toDisplayableMediaUrl(s)
}

const NEST_USER_KEYS = ["user", "userId", "user_id", "account", "lawyer", "client", "member"] as const

export function resolveProfileImageUrlLoose(
  user: Record<string, unknown> | null | undefined,
  depth = 0
): string | undefined {
  if (!user || typeof user !== "object" || depth > 4) return undefined

  const tryString = (v: unknown): string | undefined => {
    if (typeof v !== "string") return undefined
    const s = v.trim()
    return s ? toDisplayableMediaUrl(s) : undefined
  }

  const candidates: unknown[] = [
    user.profile_image,
    user.avatar,
    user.picture,
    user.profileImage,
    user.profile_picture,
    user.profilePicture,
    user.profile_photo,
    user.profile_image_url,
    user.avatar_url,
    user.photo,
    user.photo_url,
    user.photoUrl,
    user.image,
    user.imageUrl,
    user.image_url,
    user.profilePhoto,
  ]

  for (const c of candidates) {
    const u = tryString(c)
    if (u) return u
  }

  const nested = user.profile as Record<string, unknown> | undefined
  if (nested && typeof nested === "object") {
    const u = tryString(nested.url ?? nested.image ?? nested.avatar)
    if (u) return u
  }

  const imgObj = user.image as Record<string, unknown> | undefined
  if (imgObj && typeof imgObj === "object") {
    const u = tryString(imgObj.url ?? imgObj.src)
    if (u) return u
  }

  for (const key of NEST_USER_KEYS) {
    const sub = user[key]
    if (sub && typeof sub === "object" && !Array.isArray(sub)) {
      const got = resolveProfileImageUrlLoose(sub as Record<string, unknown>, depth + 1)
      if (got) return got
    }
  }

  return undefined
}
