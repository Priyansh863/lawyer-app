"use client"
import { RootState } from "@/lib/store"
import { useSelector } from "react-redux"
import { getGreeting } from "@/lib/helpers/greeting"
import { useEffect, useState } from "react"

export default function ChatHeader() {
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
      <h2 className="text-xl font-semibold">Chat</h2>
    </div>
  )
}
