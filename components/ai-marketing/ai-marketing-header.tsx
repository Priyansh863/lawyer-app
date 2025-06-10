"use client"
import { RootState } from "@/lib/store"
import { useSelector } from "react-redux"
import { getGreeting } from "@/lib/helpers/greeting"

export default async function AIMarketingHeader() {
  const user = useSelector((state: RootState) => state.auth.user)

  // Get greeting based on time of day
  

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
       {/* {getGreeting()}, {user?.first_name+ " " + user?.last_name || "User"}! */}

      </h1>
      <h2 className="text-xl font-semibold">AI-Marketing</h2>
      <p className="text-muted-foreground">Generate and distribute legal content on social media platforms</p>
    </div>
  )
}
