"use client"
import { getGreeting } from "@/lib/helpers/greeting"
import { RootState } from "@/lib/store"
import { useSelector } from "react-redux"

export default  function AIAssistantsHeader() {
  const user = useSelector((state: RootState) => state.auth.user)


  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
       {getGreeting()}

      </h1>
      <h2 className="text-xl font-semibold">AI-Assistants</h2>
    </div>
  )
}
