import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/hooks/useTranslation"
import { useState, useEffect } from "react"
import PDFUpload from "./pdf-upload"
import SecureLinkGenerator from "./secure-link-generator"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import axios from "axios"
import { getClientsAndLawyers } from "@/lib/api/users-api"

interface Client {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface DocumentsHeaderProps {
  onDocumentUploaded?: () => void
}

export function DocumentsHeader({ onDocumentUploaded }: DocumentsHeaderProps) {
  const { t } = useTranslation()
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const user = useSelector((state: RootState) => state.auth.user)
  
  // Fetch clients for lawyers
  useEffect(() => {
    const fetchClients = async () => {
      const res = await getClientsAndLawyers()
 
      setClients(res.clients)
    };

    

    fetchClients();
  }, [user]);
  
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

      <div className="flex justify-end gap-3">
        {/* Show secure link generator for lawyers */}
        {(user)?.account_type === 'lawyer' && (
          <SecureLinkGenerator clients={clients} />
        )}
        
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
