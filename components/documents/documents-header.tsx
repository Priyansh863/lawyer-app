import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PDFUpload } from "./pdf-upload"
import { useTranslation } from "@/hooks/useTranslation"

interface DocumentsHeaderProps {
  onDocumentUploaded?: () => void
}

export function DocumentsHeader({ onDocumentUploaded }: DocumentsHeaderProps) {
  const { t } = useTranslation()
  
  return (
    <div className="flex flex-col space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('pages:documents.title')}</h2>
        <p className="text-muted-foreground">{t('pages:documents.description')}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder={t('pages:documents.searchPlaceholder')} className="pl-10" />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
     

         

          <PDFUpload 
            onUploadSuccess={onDocumentUploaded}
            trigger={
              <Button className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800">
                <Plus className="mr-2 h-4 w-4" />
                {t('pages:documents.uploadPdf')}
              </Button>
            }
          />
        </div>
      </div>
    </div>
  )
}
