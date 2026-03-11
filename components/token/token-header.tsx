"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"

export default function TokenHeader() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("pages:tok.token.management")}
        </h1>
        <p className="text-gray-500">
          {t("pages:tok.token.subtitle")}
        </p>
      </div>
      <Button variant="outline" className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        {t("pages:tok.token.exportCSV")}
      </Button>
    </div>
  )
}
