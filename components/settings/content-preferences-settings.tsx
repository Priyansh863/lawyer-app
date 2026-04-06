"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, Undo2 } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"

type HiddenPost = { id: string; title?: string }
type BlockedAuthor = { id: string; name?: string }

const PREF_HIDDEN_POSTS_KEY = "posts_hidden_posts_v1"
const PREF_BLOCKED_AUTHORS_KEY = "posts_blocked_authors_v1"

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? (v as T[]) : []
  } catch {
    return []
  }
}

export default function ContentPreferencesSettings() {
  const { t } = useTranslation()
  const [hiddenPosts, setHiddenPosts] = useState<HiddenPost[]>([])
  const [blockedAuthors, setBlockedAuthors] = useState<BlockedAuthor[]>([])

  const load = () => {
    const hidden = safeParseArray<any>(localStorage.getItem(PREF_HIDDEN_POSTS_KEY))
      .map((x) => (typeof x === "string" ? ({ id: x } as HiddenPost) : x))
      .filter((x) => x?.id)
    const blocked = safeParseArray<any>(localStorage.getItem(PREF_BLOCKED_AUTHORS_KEY))
      .map((x) => (typeof x === "string" ? ({ id: x } as BlockedAuthor) : x))
      .filter((x) => x?.id)

    setHiddenPosts(hidden)
    setBlockedAuthors(blocked)
  }

  const persist = (nextHidden: HiddenPost[], nextBlocked: BlockedAuthor[]) => {
    localStorage.setItem(PREF_HIDDEN_POSTS_KEY, JSON.stringify(nextHidden))
    localStorage.setItem(PREF_BLOCKED_AUTHORS_KEY, JSON.stringify(nextBlocked))
    window.dispatchEvent(new Event("contentPreferencesUpdated"))
  }

  useEffect(() => {
    load()
    const handler = () => load()
    window.addEventListener("contentPreferencesUpdated", handler)
    window.addEventListener("storage", handler)
    return () => {
      window.removeEventListener("contentPreferencesUpdated", handler)
      window.removeEventListener("storage", handler)
    }
  }, [])

  const hiddenCount = hiddenPosts.length
  const blockedCount = blockedAuthors.length

  const hiddenLabel = useMemo(() => (hiddenCount === 1 ? t("pages:settings.contentPreferences.hiddenPost") : t("pages:settings.contentPreferences.hiddenPosts")), [hiddenCount, t])
  const blockedLabel = useMemo(() => (blockedCount === 1 ? t("pages:settings.contentPreferences.blockedAuthor") : t("pages:settings.contentPreferences.blockedAuthors")), [blockedCount, t])

  return (
    <div className="space-y-6">
      <Card className="p-6 border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">{t("pages:settings.contentPreferences.title")}</h3>
            <p className="text-sm text-slate-500 mt-1">
              {t("pages:settings.contentPreferences.description")}
            </p>
          </div>
          <Button
            variant="outline"
            className="border-slate-200"
            onClick={() => persist([], [])}
            disabled={hiddenCount === 0 && blockedCount === 0}
            title={t("pages:settings.contentPreferences.clearAllTitle")}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("pages:settings.contentPreferences.clearAll")}
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-slate-200">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black uppercase tracking-wider text-slate-400">{hiddenLabel}</h4>
          <div className="text-xs font-bold text-slate-500">{hiddenCount}</div>
        </div>

        {hiddenPosts.length === 0 ? (
          <div className="mt-4 text-sm text-slate-500">{t("pages:settings.contentPreferences.noHiddenPosts")}</div>
        ) : (
          <div className="mt-4 space-y-2">
            {hiddenPosts.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-200">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#0F172A] truncate">{p.title || p.id}</div>
                  <div className="text-xs text-slate-500 truncate">{p.id}</div>
                </div>
                <Button
                  variant="outline"
                  className="border-slate-200"
                  onClick={() => {
                    const nextHidden = hiddenPosts.filter((x) => x.id !== p.id)
                    persist(nextHidden, blockedAuthors)
                  }}
                >
                  <Undo2 className="h-4 w-4 mr-2" />
                  {t("pages:settings.contentPreferences.undo")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 border-slate-200">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black uppercase tracking-wider text-slate-400">{blockedLabel}</h4>
          <div className="text-xs font-bold text-slate-500">{blockedCount}</div>
        </div>

        {blockedAuthors.length === 0 ? (
          <div className="mt-4 text-sm text-slate-500">{t("pages:settings.contentPreferences.noBlockedAuthors")}</div>
        ) : (
          <div className="mt-4 space-y-2">
            {blockedAuthors.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-200">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#0F172A] truncate">{a.name || a.id}</div>
                  <div className="text-xs text-slate-500 truncate">{a.id}</div>
                </div>
                <Button
                  variant="outline"
                  className="border-slate-200"
                  onClick={() => {
                    const nextBlocked = blockedAuthors.filter((x) => x.id !== a.id)
                    persist(hiddenPosts, nextBlocked)
                  }}
                >
                  <Undo2 className="h-4 w-4 mr-2" />
                  {t("pages:settings.contentPreferences.unblock")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

