"use client"
import { RootState } from "@/lib/store"
import { useSelector } from "react-redux"
import { useTranslation } from "@/hooks/useTranslation"

export default function VideoConsultationsHeader() {
  const user = useSelector((state: RootState) => state.auth.user)
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
        {/* {getGreeting()}, {user?.first_name+ " " + user?.last_name || "User"}! */}
      </h1>
      <h2 className="text-xl font-semibold">{t("pages:consultation.videoConsultations")}</h2>
    </div>
  )
}
