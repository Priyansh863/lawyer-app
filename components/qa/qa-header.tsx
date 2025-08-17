"use client"

import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { useTranslation } from "@/hooks/useTranslation"

export default function QAHeader() {
  const router = useRouter()
  const { t } = useTranslation()
 const user=useSelector((state: any) => state.auth.user)
  

  return (
    <div className="flex items-center justify-between mb-12">
      <div>
        <h1 className="text-2xl font-semibold">{t('pages:qa.title')}</h1>
        <p className="text-sm text-gray-500">{t('pages:qa.description')}</p>
      </div>
      {user?.account_type ==="client" && <Button onClick={() => router.push("/qa/new/form")} className="flex items-center gap-2">
        <PlusCircle size={16} />
        <span>{t('pages:qa.addQuestion')}</span>
      </Button>}
    </div>
  )
}
