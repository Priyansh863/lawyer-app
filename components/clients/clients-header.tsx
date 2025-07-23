"use client"
import { RootState } from "@/lib/store"
import { useSelector } from "react-redux"
import { getGreeting } from "@/lib/helpers/greeting"
import { useTranslation } from "@/hooks/useTranslation"


export default  function ClientsHeader() {
  const user = useSelector((state: RootState) => state.auth.user)
  const { t } = useTranslation()

  // Get greeting based on time of day
  

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">
        {/* {user ? `${getGreeting()}, ${user.first_name} ${user.last_name}!` : "Welcome, User!"} */}
      </h1>
      <h2 className="text-xl font-semibold">{user?.account_type==="client" ? "Lawyers" : t('pages:clients.title')}</h2>
    </div>
  )
}
