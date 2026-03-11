import { Button } from "@/components/ui/button"
import { Upload, FileText, Lock, Globe, Users, TrendingUp, Search, FolderPlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "@/hooks/useTranslation"
import { useState, useEffect } from "react"
import PDFUpload from "./pdf-upload"
import SecureLinkGenerator from "./secure-link-generator"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { getClientsAndLawyers } from "@/lib/api/users-api"
import { getDocuments } from "@/lib/api/documents-api"

interface Client {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface DocumentsHeaderProps {
  onDocumentUploaded?: () => void
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
}

export function DocumentsHeader({
  onDocumentUploaded,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange
}: DocumentsHeaderProps) {
  const { t } = useTranslation()
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [documentStats, setDocumentStats] = useState({
    total: 0,
    public: 0,
    private: 0,
    processed: 0
  })
  const user = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    const fetchData = async () => {
      if (user?.account_type === 'lawyer') {
        const res = await getClientsAndLawyers()
        setClients(res.clients)
      }

      try {
        const response = await getDocuments()
        if (response.success && response.documents) {
          const docs = response.documents
          const publicDocs = docs.filter(d => !d.privacy || d.privacy === 'public').length
          const privateDocs = docs.filter(d => (d.privacy as any) === 'private').length + docs.filter(d => (d.privacy as any) === 'fully_private').length
          const processedDocs = docs.filter(d => (d.status as any) === 'Completed' || (d.status as any) === 'Approved' || (d.status as any) === 'Processing').length

          setDocumentStats({
            total: docs.length,
            public: publicDocs,
            private: privateDocs,
            processed: processedDocs
          })
        }
      } catch (error) {
        console.error('Error fetching document stats:', error)
      }
    }

    fetchData()
  }, [user])

  const handleUploadSuccess = () => {
    setShowUploadDialog(false)
    onDocumentUploaded?.()
    const fetchStats = async () => {
      try {
        const response = await getDocuments()
        if (response.success && response.documents) {
          const docs = response.documents
          const publicDocs = docs.filter(d => !d.privacy || d.privacy === 'public').length
          const privateDocs = docs.filter(d => d.privacy && (d.privacy === 'private')).length
          const processedDocs = docs.filter(d => ['Completed', 'Approved', 'Processing'].includes(d.status as string)).length

          setDocumentStats({
            total: docs.length,
            public: publicDocs,
            private: privateDocs,
            processed: processedDocs
          })
        }
      } catch (error) {
        console.error('Error refreshing stats:', error)
      }
    }
    fetchStats()
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Documents Management</h2>
      </div>

      {/* Toolbar Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search"
            className="pl-10 h-10 border-gray-200"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Sort Dropdown */}
        <Select defaultValue="newest">
          <SelectTrigger className="w-[140px] h-10 border-gray-200">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          {user?.account_type === 'lawyer' && (
            <SecureLinkGenerator clients={clients} />
          )}

          <Button variant="outline" className="h-10 border-gray-200 bg-gray-50/50">
            Add Folder
          </Button>

          <Button
            onClick={() => setShowUploadDialog(true)}
            className="h-10 bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2 px-5"
          >
            <FolderPlus className="h-4 w-4" />
            Add Documents
          </Button>
        </div>
      </div>

      <PDFUpload
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  )
}
