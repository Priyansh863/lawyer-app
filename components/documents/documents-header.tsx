import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/hooks/useTranslation"
import { useState } from "react"
import PDFUpload from "./pdf-upload"

interface DocumentsHeaderProps {
  onDocumentUploaded?: () => void
}

export function DocumentsHeader({ onDocumentUploaded }: DocumentsHeaderProps) {
  const { t } = useTranslation()
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  
  const handleUploadSuccess = () => {
    setShowUploadDialog(false)
    onDocumentUploaded?.()
  }
  
  return (
    <div className="flex flex-col space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('pages:documents.title')}</h2>
        <p className="text-muted-foreground">{t('pages:documents.description')}</p>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={() => setShowUploadDialog(true)}
          className="bg-gray-900 hover:bg-gray-800"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('pages:documents.uploadPdf')}
        </Button>
      </div>

      {/* Enhanced PDF Upload Dialog with Privacy Settings */}
      <PDFUpload
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  )
}
