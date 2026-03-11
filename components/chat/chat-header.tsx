"use client"
import { RootState } from "@/lib/store"
import { useSelector } from "react-redux"
import { getGreeting } from "@/lib/helpers/greeting"
import { useEffect, useState } from "react"
import { useTranslation } from "@/hooks/useTranslation"

export default function ChatHeader() {
  const { t } = useTranslation()
  const user = useSelector((state: RootState) => state.auth.user)
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
        {/* {greeting}{user ? ` ${user.first_name} ${user.last_name}` : ' User'}! */}
      </h1>
      <h2 className="text-xl font-semibold">{t('pages:chat.title')}</h2>
    </div>
  )
}
