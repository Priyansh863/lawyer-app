import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, Lock, Globe, Users, TrendingUp } from "lucide-react"
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
}

export function DocumentsHeader({ onDocumentUploaded }: DocumentsHeaderProps) {
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
  
  // Fetch clients for lawyers and document statistics
  useEffect(() => {
    const fetchData = async () => {
      // Fetch clients for lawyers
      if (user?.account_type === 'lawyer') {
        const res = await getClientsAndLawyers()
        setClients(res.clients)
      }
      
      // Fetch document statistics
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
    // Refresh stats after upload
    setTimeout(() => {
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
    }, 1000)
  }
  
  return (
    <div className="flex flex-col space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Document Management</h2>
          <p className="text-muted-foreground">
            Upload, manage, and share your legal documents securely with enhanced privacy controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Show secure link generator for lawyers */}
          {user?.account_type === 'lawyer' && (
            <SecureLinkGenerator clients={clients} />
          )}
          
          <Button 
            onClick={() => setShowUploadDialog(true)}
            className="bg-gray-900 hover:bg-gray-800"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.total}</div>
            <p className="text-xs text-muted-foreground">
              All uploaded documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Documents</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{documentStats.public}</div>
            <p className="text-xs text-muted-foreground">
              Visible to all users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Private Documents</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{documentStats.private}</div>
            <p className="text-xs text-muted-foreground">
              Restricted access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{documentStats.processed}</div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>
      </div>



      {/* Enhanced Document Upload Dialog */}
      <PDFUpload
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  )
}
