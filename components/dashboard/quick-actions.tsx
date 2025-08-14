import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Plus } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"

export default function QuickActions() {
  const { t } = useTranslation()
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t("pages:quick.quickActions")}</CardTitle>

      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" className="w-full justify-start gap-2">
          <Calendar size={16} />
          {t("pages:quick.scheduleCall")}
        </Button>

        <Button variant="outline" className="w-full justify-start gap-2">
          <Plus size={16} />
          {t("pages:quick.newCase")}
        </Button>
      </CardContent>
    </Card>
  )
}
