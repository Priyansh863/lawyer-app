"use client"
import { RootState } from "@/lib/store"
import { useSelector } from "react-redux"
import { useTranslation } from "@/hooks/useTranslation"
import OnboardClientForm from "./onboard-client-form"

interface ClientsHeaderProps {
  onClientCreated?: () => void;
}

export default function ClientsHeader() {
  const user = useSelector((state: RootState) => state.auth.user)
  const { t } = useTranslation()

  return (
    <div className="mb-2">
      <h2 className="text-2xl font-bold text-[#0F172A]">
        {user?.account_type === "client"
          ? t('pages:client.lawyerManagement')
          : t('pages:client.clientManagement')}
      </h2>
    </div>
  )
}
