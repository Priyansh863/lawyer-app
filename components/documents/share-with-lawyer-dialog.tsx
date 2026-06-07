"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
import {
  Loader2,
  Shield,
  UserPlus,
  Users,
  User,
  Search,
} from "lucide-react"
import {
  getDocumentAccessDetails,
  updateDocumentPrivacy,
  grantDocumentAccess,
  revokeDocumentAccess,
  searchRegisteredUsersForSharing,
  type DocumentPrivacyLevel,
  type ShareableUser,
  type DefaultGrantPool,
} from "@/lib/api/document-sharing-api"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import { cn } from "@/lib/utils"
import { normalizeDocumentPrivacy, type DocumentPrivacy } from "@/lib/document-privacy"

interface ShareDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: {
    id: string
    document_name: string
    privacy: string
    shared_with?: any[]
    uploaded_by?: any
  }
  onShareUpdate?: (updatedDocument: any) => void
}

type PrivacyOption = DocumentPrivacyLevel

function normalizeShared(users: any[] | undefined): ShareableUser[] {
  if (!users?.length) return []
  return users
    .map((u) => {
      if (typeof u === "string") return null
      if (!u?._id) return null
      return {
        _id: u._id,
        first_name: u.first_name || "",
        last_name: u.last_name || "",
        email: u.email || "",
        account_type: u.account_type,
      } as ShareableUser
    })
    .filter(Boolean) as ShareableUser[]
}

function formatVerifiedAt(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  } catch {
    return iso
  }
}

function grantPoolHintKey(pool: DefaultGrantPool): string {
  switch (pool) {
    case "own_clients":
      return "pages:shar.grantPoolOwnClients"
    case "own_lawyers":
      return "pages:shar.grantPoolOwnLawyers"
    default:
      return "pages:shar.grantAccessHint"
  }
}

function UserRelationshipBadge({ user, t }: { user: ShareableUser; t: (k: string) => string }) {
  if (user.is_own_client) {
    return (
      <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-blue-50 text-blue-700 border-blue-200">
        {t("pages:shar.relationshipOwnClient")}
      </Badge>
    )
  }
  if (user.is_own_lawyer) {
    return (
      <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-violet-50 text-violet-700 border-violet-200">
        {t("pages:shar.relationshipOwnLawyer")}
      </Badge>
    )
  }
  if (user.relationship) {
    return (
      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
        {user.relationship}
      </Badge>
    )
  }
  return null
}

export function ShareDocumentDialog({
  open,
  onOpenChange,
  document,
  onShareUpdate,
}: ShareDocumentDialogProps) {
  const [privacy, setPrivacy] = useState<PrivacyOption>("private")
  const [sharedWith, setSharedWith] = useState<ShareableUser[]>([])
  const [grantableUsers, setGrantableUsers] = useState<ShareableUser[]>([])
  const [manualSearchUsers, setManualSearchUsers] = useState<ShareableUser[]>([])
  const [manualSearchQuery, setManualSearchQuery] = useState("")
  const [searchingManual, setSearchingManual] = useState(false)
  const [allowShareWithAnyUser, setAllowShareWithAnyUser] = useState(true)
  const [defaultGrantPool, setDefaultGrantPool] = useState<DefaultGrantPool>("all_users")
  const [selectedGrantIds, setSelectedGrantIds] = useState<string[]>([])
  const [owner, setOwner] = useState<ShareableUser | null>(null)
  const [hasAccessCount, setHasAccessCount] = useState<number | null>(0)
  const [doesNotHaveAccessCount, setDoesNotHaveAccessCount] = useState<number | null>(0)
  const [lastVerifiedAt, setLastVerifiedAt] = useState<string>("")

  const [loadingDetails, setLoadingDetails] = useState(false)
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false)
  const [granting, setGranting] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const { toast } = useToast()
  const { t, language } = useTranslation()
  const profile = useSelector((state: RootState) => state.auth.user)

  const documentId = document.id
  const isPublic = privacy === "public"

  useEffect(() => {
    if (!open || !documentId) return

    let cancelled = false

    const load = async () => {
      setLoadingDetails(true)
      try {
        const details = await getDocumentAccessDetails(documentId, {
          document_name: document.document_name,
          privacy: document.privacy,
          shared_with: document.shared_with,
          uploaded_by: document.uploaded_by,
        })

        if (cancelled) return

        setPrivacy(
          normalizeDocumentPrivacy(
            details.document.privacy || document.privacy || "private"
          )
        )
        setSharedWith(
          details.document.shared_with?.length
            ? details.document.shared_with
            : normalizeShared(document.shared_with)
        )
        setGrantableUsers(details.grantableUsers ?? [])
        setAllowShareWithAnyUser(details.allowShareWithAnyRegisteredUser ?? true)
        setDefaultGrantPool(details.defaultGrantPool ?? "all_users")
        setManualSearchUsers([])
        setManualSearchQuery("")
        setOwner(details.owner)
        setHasAccessCount(details.hasAccessCount ?? null)
        setDoesNotHaveAccessCount(details.doesNotHaveAccessCount ?? null)
        setLastVerifiedAt(details.lastVerifiedAt || new Date().toISOString())
        setSelectedGrantIds([])
      } catch (error: any) {
        if (!cancelled) {
          toast({
            title: t("pages:shar.error"),
            description: error.message || t("pages:shar.failedToLoadAccess"),
            variant: "destructive",
          })
        }
      } finally {
        if (!cancelled) setLoadingDetails(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when modal opens for this doc id only
  }, [open, documentId])

  const ownerDisplay = owner || (profile as any)
  const ownerName = ownerDisplay
    ? `${ownerDisplay.first_name || ""} ${ownerDisplay.last_name || ""}`.trim() ||
      ownerDisplay.email
    : "—"
  const ownerEmail = ownerDisplay?.email || ""

  const notifyParent = (nextShared: ShareableUser[], nextPrivacy?: PrivacyOption) => {
    onShareUpdate?.({
      ...document,
      privacy: nextPrivacy ?? privacy,
      shared_with: nextShared,
    })
  }

  const handleUpdatePrivacy = async () => {
    setUpdatingPrivacy(true)
    try {
      await updateDocumentPrivacy(document.id, privacy)
      const nextShared = privacy === "public" ? [] : sharedWith
      if (privacy === "public") {
        setSharedWith([])
        setGrantableUsers([])
        setHasAccessCount(null)
        setDoesNotHaveAccessCount(null)
      }
      toast({
        title: t("pages:shar.success"),
        description:
          privacy === "public"
            ? t("pages:shar.privacyUpdatedPublic")
            : t("pages:shar.privacyUpdated"),
      })
      notifyParent(nextShared, privacy)
    } catch (error: any) {
      toast({
        title: t("pages:shar.error"),
        description: error.message || t("pages:shar.failedToUpdatePrivacy"),
        variant: "destructive",
      })
    } finally {
      setUpdatingPrivacy(false)
    }
  }

  useEffect(() => {
    if (!open || isPublic || !allowShareWithAnyUser) {
      setManualSearchUsers([])
      return
    }
    const q = manualSearchQuery.trim()
    if (q.length < 2) {
      setManualSearchUsers([])
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      setSearchingManual(true)
      try {
        const exclude = [
          ...sharedWith.map((u) => u._id),
          ...grantableUsers.map((u) => u._id),
          profile?._id ?? "",
        ].filter(Boolean)
        const results = await searchRegisteredUsersForSharing(q, { excludeIds: exclude })
        if (!cancelled) setManualSearchUsers(results)
      } catch {
        if (!cancelled) setManualSearchUsers([])
      } finally {
        if (!cancelled) setSearchingManual(false)
      }
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [
    manualSearchQuery,
    open,
    isPublic,
    allowShareWithAnyUser,
    sharedWith,
    grantableUsers,
    profile?._id,
  ])

  const quickGrantIds = new Set(grantableUsers.map((u) => u._id))
  const manualOnlyUsers = manualSearchUsers.filter((u) => !quickGrantIds.has(u._id))
  const usersForGrantList = [...grantableUsers, ...manualOnlyUsers]

  const handleGrantAccess = async () => {
    if (selectedGrantIds.length === 0) return
    setGranting(true)
    try {
      const updated = await grantDocumentAccess(document.id, selectedGrantIds)
      const granted = usersForGrantList.filter((u) => selectedGrantIds.includes(u._id))
      const nextShared = [...sharedWith, ...granted]
      setSharedWith(nextShared)
      setGrantableUsers((prev) => prev.filter((u) => !selectedGrantIds.includes(u._id)))
      setManualSearchUsers((prev) => prev.filter((u) => !selectedGrantIds.includes(u._id)))
      setManualSearchQuery("")
      setHasAccessCount(nextShared.length)
      setDoesNotHaveAccessCount((c) => Math.max(0, c - selectedGrantIds.length))
      setSelectedGrantIds([])
      setLastVerifiedAt(new Date().toISOString())

      if (updated?.shared_with) {
        const fromApi = normalizeShared(updated.shared_with)
        setSharedWith(fromApi)
        notifyParent(fromApi, privacy)
      } else {
        notifyParent(nextShared, privacy)
      }

      toast({
        title: t("pages:shar.success"),
        description: t("pages:shar.accessGranted"),
      })
    } catch (error: any) {
      toast({
        title: t("pages:shar.error"),
        description: error.message || t("pages:shar.failedToGrantAccess"),
        variant: "destructive",
      })
    } finally {
      setGranting(false)
    }
  }

  const handleRevoke = async (userId: string) => {
    if (!profile?._id) return
    setRevokingId(userId)
    try {
      const updated = await revokeDocumentAccess(document.id, userId, profile._id)
      const revokedUser = sharedWith.find((u) => u._id === userId)
      const nextShared = sharedWith.filter((u) => u._id !== userId)
      setSharedWith(nextShared)
      if (revokedUser) {
        setGrantableUsers((prev) => [...prev, revokedUser])
      }
      setHasAccessCount(nextShared.length)
      setDoesNotHaveAccessCount((c) => c + 1)
      setLastVerifiedAt(new Date().toISOString())

      if (updated?.shared_with) {
        const fromApi = normalizeShared(updated.shared_with)
        setSharedWith(fromApi)
        notifyParent(fromApi, privacy)
      } else {
        notifyParent(nextShared, privacy)
      }

      toast({
        title: t("pages:shar.success"),
        description: t("pages:shar.accessRevoked"),
      })
    } catch (error: any) {
      toast({
        title: t("pages:shar.error"),
        description: error.message || t("pages:shar.failedToRevokeAccess"),
        variant: "destructive",
      })
    } finally {
      setRevokingId(null)
    }
  }

  const toggleGrant = (userId: string) => {
    setSelectedGrantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const privacyOptions: { value: PrivacyOption; label: string }[] = [
    { value: "public", label: t("pages:shar.privacyPublic") },
    { value: "private", label: t("pages:shar.privacyPrivate") },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[920px] max-h-[90vh] overflow-y-auto p-6 gap-0">
        <DialogHeader className="pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-[#0F172A]">
            {t("pages:shar.manageAccess")}
          </DialogTitle>
          <p className="text-sm text-slate-500 font-medium truncate pt-1">
            {document.document_name}
          </p>
        </DialogHeader>

        {loadingDetails ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#0F172A]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Privacy Level */}
            <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                <Shield className="h-4 w-4" />
                {t("pages:shar.privacyLevel")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {privacyOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPrivacy(opt.value)}
                    className={cn(
                      "px-3 py-2 text-xs font-bold rounded-md border transition-colors",
                      privacy === opt.value
                        ? "bg-[#0F172A] text-white border-[#0F172A]"
                        : "bg-white text-[#0F172A] border-slate-200 hover:border-slate-400"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t("pages:shar.privacyPublicHint")}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t("pages:shar.privacyPrivateHint")}
              </p>
              <Button
                onClick={handleUpdatePrivacy}
                disabled={updatingPrivacy}
                className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold h-9"
              >
                {updatingPrivacy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("pages:shar.updatePrivacy")
                )}
              </Button>
            </section>

            {/* Admin Permission Verification */}
            <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-2 text-sm">
              <h3 className="text-sm font-bold text-[#0F172A] mb-2">
                {t("pages:shar.adminPermissionVerification")}
              </h3>
              <p className="text-slate-600">
                <span className="font-semibold text-[#0F172A]">{t("pages:shar.owner")}:</span>{" "}
                {ownerName}
                {ownerEmail ? ` (${ownerEmail})` : ""}
              </p>
              <p className="text-slate-600">
                <span className="font-semibold text-[#0F172A]">{t("pages:shar.hasAccess")}:</span>{" "}
                {isPublic && hasAccessCount === null
                  ? t("pages:shar.publicAccessAllUsers")
                  : `${hasAccessCount ?? 0} ${t("pages:shar.usersCount")}`}
              </p>
              <p className="text-slate-600">
                <span className="font-semibold text-[#0F172A]">
                  {t("pages:shar.doesNotHaveAccess")}:
                </span>{" "}
                {isPublic && doesNotHaveAccessCount === null
                  ? "—"
                  : `${doesNotHaveAccessCount ?? 0} ${t("pages:shar.usersCount")}`}
              </p>
              <p className="text-slate-500 text-xs pt-1">
                <span className="font-semibold">{t("pages:shar.lastVerified")}:</span>{" "}
                {lastVerifiedAt
                  ? formatVerifiedAt(lastVerifiedAt, language || 'en')
                  : "—"}
              </p>
            </section>

            {/* Grant Access — private documents only */}
            <section
              className={cn(
                "rounded-lg border border-slate-200 bg-white p-4 flex flex-col min-h-[280px]",
                isPublic && "opacity-60"
              )}
            >
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#0F172A] mb-1">
                <UserPlus className="h-4 w-4" />
                {t("pages:shar.grantAccess")}
              </h3>
              <p className="text-xs text-slate-500 mb-2">
                {isPublic
                  ? t("pages:shar.grantAccessDisabledPublic")
                  : t(grantPoolHintKey(defaultGrantPool))}
              </p>
              {allowShareWithAnyUser && !isPublic && (
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={manualSearchQuery}
                    onChange={(e) => setManualSearchQuery(e.target.value)}
                    placeholder={t("pages:shar.manualSearchPlaceholder")}
                    className="pl-9 h-9 text-sm"
                  />
                  {searchingManual && (
                    <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>
              )}
              {allowShareWithAnyUser && !isPublic && manualSearchQuery.trim().length >= 2 && (
                <p className="text-[11px] text-slate-400 mb-2">
                  {t("pages:shar.manualSearchHint")}
                </p>
              )}
              <div className="flex-1 overflow-y-auto space-y-2 min-h-[140px] max-h-[200px] pr-1 border border-slate-100 rounded-md p-2 bg-slate-50/50">
                {usersForGrantList.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    {manualSearchQuery.trim().length >= 2
                      ? t("pages:shar.noSearchResults")
                      : t("pages:shar.noUsersToGrant")}
                  </p>
                ) : (
                  usersForGrantList.map((user) => (
                    <label
                      key={user._id}
                      className="flex items-start gap-2 p-2 rounded-md hover:bg-white cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedGrantIds.includes(user._id)}
                        onCheckedChange={() => toggleGrant(user._id)}
                        disabled={isPublic}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-sm font-semibold text-[#0F172A] truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <UserRelationshipBadge user={user} t={t} />
                          {!quickGrantIds.has(user._id) && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                              {t("pages:shar.manualPickBadge")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <Button
                onClick={handleGrantAccess}
                disabled={isPublic || granting || selectedGrantIds.length === 0}
                className="w-full mt-3 bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold h-9"
              >
                {granting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("pages:shar.grantAccess")
                )}
              </Button>
            </section>

            {/* Current Users With Access — private documents only */}
            <section
              className={cn(
                "rounded-lg border border-slate-200 bg-white p-4 flex flex-col min-h-[280px]",
                isPublic && "opacity-60"
              )}
            >
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#0F172A] mb-3">
                <Users className="h-4 w-4" />
                {t("pages:shar.currentUsersWithAccess")}
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 min-h-[140px] max-h-[240px] pr-1">
                {sharedWith.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    {t("pages:shar.noUsersWithAccess")}
                  </p>
                ) : (
                  sharedWith.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/80"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="h-4 w-4 shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-semibold text-[#0F172A] truncate">
                              {user.first_name} {user.last_name}
                            </p>
                            <UserRelationshipBadge user={user} t={t} />
                          </div>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPublic || revokingId === user._id}
                        onClick={() => handleRevoke(user._id)}
                        className="shrink-0 h-8 text-xs font-bold border-red-200 text-red-600 hover:bg-red-50"
                      >
                        {revokingId === user._id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          t("pages:shar.revoke")
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        <DialogFooter className="pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="font-bold"
          >
            {t("pages:shar.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
