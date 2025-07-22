"use client"
import { RootState } from "@/lib/store"
import { useSelector } from "react-redux"
import { getGreeting } from "@/lib/helpers/greeting"


export default  function CasesHeader() {
  const user = useSelector((state: RootState) => state.auth.user)

  // Get greeting based on time of day


  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
       {/* {getGreeting()}, {user?.first_name+ " " + user?.last_name || "User"}! */}

      </h1>
      <h2 className="text-xl font-semibold">Cases</h2>
    </div>
  )
}


