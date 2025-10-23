'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { 
  FileText, 
  MoreVertical, 
  Eye, 
  Share2, 
  Trash2, 
  Lock, 
  Globe,
  Users,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Ban,
  Filter,
  SortDesc,
  Video,
  Image,
  File,
  Download
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { getDocuments, deleteDocument, downloadDocumentSummary, downloadDocument } from '@/lib/api/documents-api'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from "@/hooks/useTranslation"
import { ShareDocumentDialog } from '@/components/documents/share-with-lawyer-dialog'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

interface Document {
  _id: string
  document_name: string
  status: 'Pending' | 'Completed' | 'Failed' | 'Rejected' | 'Approved' | 'Processing' | 'Cancelled'
  uploaded_by: {
    _id: string
    first_name: string
    last_name: string
    email: string
    account_type?: 'client' | 'lawyer' | 'admin'
  } | string
  link: string
  summary?: string
  privacy?: 'public' | 'private' | 'fully_private'
  file_size?: number
  file_type?: string
  document_type?: 'case_related' | 'general'
  case_id?: string
  shared_with?: any[]
  is_shared?: boolean
  created_at?: string
  updated_at?: string
  createdAt: string
  updatedAt: string
}

interface DocumentsTableProps {
  onDocumentUpdate?: () => void
  refreshTrigger?: number
}

export default function DocumentsTable({ 
  onDocumentUpdate, 
  refreshTrigger 
}: DocumentsTableProps) {
  const { t } = useTranslation();
  // Separate state for all documents and filtered documents
  const [allDocuments, setAllDocuments] = useState<Document[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Completed' | 'Failed' | 'Rejected' | 'Approved' | 'Processing' | 'Cancelled'>('all')
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'private' | 'fully_private'>('all')
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'PDF' | 'DOCX' | 'TXT' | 'Image' | 'Video'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingSummaryId, setDownloadingSummaryId] = useState<string | null>(null)
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  // Get user from Redux store with safety check
  const user = useSelector((state: RootState) => state.auth?.user)
  const isClient = user?.account_type === 'client'
  const isLawyer = user?.account_type === 'lawyer'

  // Load documents on component mount and when refreshTrigger changes
  useEffect(() => {
    loadDocuments()
  }, [refreshTrigger])

  // Apply filters when search term or any filter changes
  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, privacyFilter, fileTypeFilter, allDocuments])

  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await getDocuments()
      if (response.success && response.documents) {
        // Sort by latest uploads first
        const sortedDocs = response.documents.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt)
          const dateB = new Date(b.created_at || b.createdAt)
          return dateB.getTime() - dateA.getTime()
        })
        setAllDocuments(sortedDocs)
      } else {
        console.error('Failed to load documents:', response.message)
        toast.error(t('pages:documentT.documents.loadFailed'))
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      toast.error(t('pages:documentT.documents.loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  // Get file type icon and color
  const getFileTypeIcon = (fileType: string | undefined) => {
    if (!fileType) return { icon: FileText, color: 'text-gray-500' }
    
    const type = fileType.toLowerCase()
    if (type.includes('pdf')) return { icon: FileText, color: 'text-red-500' }
    if (type.includes('word') || type.includes('docx')) return { icon: FileText, color: 'text-blue-500' }
    if (type.includes('text') || type.includes('txt')) return { icon: File, color: 'text-green-500' }
    if (type.includes('image') || type.includes('jpg') || type.includes('png')) return { icon: Image, color: 'text-purple-500' }
    if (type.includes('video') || type.includes('mp4') || type.includes('avi')) return { icon: Video, color: 'text-orange-500' }
    return { icon: FileText, color: 'text-gray-500' }
  }

  // Client-side filtering for better performance
  const applyFilters = () => {
    let filteredDocs = [...allDocuments]

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filteredDocs = filteredDocs.filter(doc => 
        doc.document_name.toLowerCase().includes(searchLower) ||
        (doc.summary && doc.summary.toLowerCase().includes(searchLower)) ||
        (doc.file_type && doc.file_type.toLowerCase().includes(searchLower))
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredDocs = filteredDocs.filter(doc => doc.status === statusFilter)
    }

    // Apply privacy filter
    if (privacyFilter !== 'all') {
      filteredDocs = filteredDocs.filter(doc => doc.privacy === privacyFilter)
    }

    // Apply file type filter
    if (fileTypeFilter !== 'all') {
      filteredDocs = filteredDocs.filter(doc => {
        if (!doc.file_type) return false
        const type = doc.file_type.toLowerCase()
        switch (fileTypeFilter) {
          case 'PDF': return type.includes('pdf')
          case 'DOCX': return type.includes('word') || type.includes('docx')
          case 'TXT': return type.includes('text') || type.includes('txt')
          case 'Image': return type.includes('image') || type.includes('jpg') || type.includes('png')
          case 'Video': return type.includes('video') || type.includes('mp4') || type.includes('avi')
          default: return true
        }
      })
    }

    setDocuments(filteredDocs)
  }

  // Enhanced status badge styling with better colors and visual indicators
  const getStatusBadge = (status: Document['status']) => {
    const statusConfig = {
      'Pending': { 
        color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', 
        icon: Clock,
        label: t('pages:documentT.status.pending'),
        dotColor: 'bg-amber-500'
      },
      'Completed': { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', 
        icon: CheckCircle,
        label: t('pages:documentT.status.completed'),
        dotColor: 'bg-emerald-500'
      },
      'Failed': { 
        color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100', 
        icon: XCircle,
        label: t('pages:documentT.status.failed'),
        dotColor: 'bg-red-500'
      },
      'Rejected': { 
        color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100', 
        icon: Ban,
        label: t('pages:documentT.status.rejected'),
        dotColor: 'bg-rose-500'
      },
      'Approved': { 
        color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100', 
        icon: CheckCircle,
        label: t('pages:documentT.status.approved'),
        dotColor: 'bg-blue-500'
      },
      'Processing': { 
        color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100', 
        icon: Loader2,
        label: t('pages:documentT.status.processing'),
        dotColor: 'bg-violet-500'
      },
      'Cancelled': { 
        color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100', 
        icon: Ban,
        label: t('pages:documentT.status.cancelled'),
        dotColor: 'bg-slate-500'
      }
    }

    const config = statusConfig[status] || statusConfig['Pending']
    const IconComponent = config.icon

    return (
      <Badge 
        variant="outline" 
        className={`${config.color} border-2 flex items-center gap-2 px-1 py-1.5 font-medium transition-colors shadow-sm w-24`}
      >
        <div className={`w-2 h-2 rounded-full ${config.dotColor} shadow-sm`} />
        <IconComponent className={`h-3 w-3 ${status === 'Processing' ? 'animate-spin' : ''}`} />
        <span className="text-sm font-medium">{config.label}</span>
      </Badge>
    )
  }

  // Handle share with lawyer
  const handleShareWithLawyer = (document: Document) => {
    setSelectedDocument(document)
    setShareDialogOpen(true)
  }

  // Handle share update
  const handleShareUpdate = (updatedDocument: any) => {
    // Update the document in both allDocuments and documents arrays
    setAllDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc._id === updatedDocument.id ? { ...doc, ...updatedDocument } : doc
      )
    )
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc._id === updatedDocument.id ? { ...doc, ...updatedDocument } : doc
      )
    )
    toast.success(t('pages:documentT.documents.shareSuccess'))
  }

  // Privacy badge with enhanced privacy levels
// Privacy badge with better layout
const getPrivacyBadge = (privacy: string | undefined, isShared: boolean) => {
  switch (privacy) {
    case 'fully_private':
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 min-w-[100px] justify-center">
          <Lock className="h-3 w-3" />
          <span className="text-xs">{t('pages:documentT.table.privacy.fullyPrivate')}</span>
        </Badge>
      )
    case 'private':
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-1 py-1 min-w-[80px] justify-center">
          <Lock className="h-3 w-3" />
          <span className="text-xs">
            {isShared 
              ? t('pages:documentT.table.privacy.sharedPrivate') 
              : t('pages:documentT.table.privacy.private')}
          </span>
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 min-w-[100px] justify-center">
          <Globe className="h-3 w-3" />
          <span className="text-xs">{t('pages:documentT.table.privacy.public')}</span>
        </Badge>
      )
  }
}

  // Handle document deletion
  const handleDelete = async (documentId: string) => {
    if (!confirm(t('pages:documentT.documents.deleteConfirm'))) return
    
    setDeletingId(documentId)
    try {
      const response = await deleteDocument(documentId)
      if (response.success) {
        toast.success(t('pages:documentT.documents.deleteSuccess'))
        loadDocuments() // Reload documents
        onDocumentUpdate?.()
      } else {
        toast.error(t('pages:documentT.documents.deleteFailed'))
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error(t('pages:documentT.documents.deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownloadSummary = async (document: Document) => {
    setDownloadingSummaryId(document._id)
    try {
      await downloadDocumentSummary(document._id, document.summary as string, document.document_name)
      toast.success(t('pages:documentT.documents.summaryDownloadSuccess'))
    } catch (error: any) {
      console.error('Error downloading document summary:', error)
      toast.error(error.message || t('pages:documentT.documents.summaryDownloadError'))
    } finally {
      setDownloadingSummaryId(null)
    }
  }

  const handleDownloadDocument = async (document: Document) => {
    setDownloadingDocumentId(document._id)
    try {
      await downloadDocument(document._id, document.document_name, document.link)
      toast.success(t('pages:documentT.documents.documentDownloadSuccess'))
    } catch (error: any) {
      console.error('Error downloading document:', error)
      toast.error(error.message || t('pages:documentT.documents.documentDownloadError'))
    } finally {
      setDownloadingDocumentId(null)
    }
  }

  // Get uploader name
  const getUploaderName = (uploadedBy: Document['uploaded_by']) => {
    if (typeof uploadedBy === 'string') return t('pages:documentT.general.unknown')
    return `${uploadedBy.first_name} ${uploadedBy.last_name}`
  }

  // Get shared with names
  const getSharedWithNames = (sharedWith: Document['shared_with']) => {
    if (!sharedWith || sharedWith.length === 0) return t('pages:documentT.general.none')
    return sharedWith.map(user => `${user.first_name} ${user.last_name}`).join(', ')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Enhanced Header with single search bar and filters - Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Skeleton height={40} />
            </div>
            
            <Skeleton width={160} height={40} />
          </div>
        </div>

        {/* Documents Table Skeleton */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Skeleton width={80} />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Skeleton width={60} />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Skeleton width={70} />
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Skeleton width={80} />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Skeleton width={90} />
                  </th>
                  <th className="relative px-6 py-3">
                    <Skeleton width={40} />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Skeleton circle width={32} height={32} />
                        <div className="min-w-0 flex-1 ml-3">
                          <Skeleton width={120} height={16} />
                          <Skeleton width={80} height={12} className="mt-1" />
                          <Skeleton width={180} height={12} className="mt-1" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Skeleton circle width={16} height={16} />
                        <Skeleton width={60} height={16} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton width={80} height={24} />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton width={100} height={24} />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton width={100} height={16} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton circle width={32} height={32} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with single search bar and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Single search and filter section */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('pages:documentT.documents.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('pages:documentT.table.headers.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('pages:documentT.table.filters.allStatuses')}</SelectItem>
              <SelectItem value="Pending">{t('pages:documentT.status.pending')}</SelectItem>
              <SelectItem value="Processing">{t('pages:documentT.status.processing')}</SelectItem>
              <SelectItem value="Completed">{t('pages:documentT.status.completed')}</SelectItem>
              <SelectItem value="Failed">{t('pages:documentT.status.failed')}</SelectItem>
              <SelectItem value="Approved">{t('pages:documentT.status.approved')}</SelectItem>
              <SelectItem value="Rejected">{t('pages:documentT.status.rejected')}</SelectItem>
              <SelectItem value="Cancelled">{t('pages:documentT.status.cancelled')}</SelectItem>
            </SelectContent>
          </Select>

        </div>
      </div>

      {/* Documents Table */}
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {allDocuments.length === 0 ? t('pages:documentT.documents.noDocuments') : t('pages:documentT.documents.noMatches')}
          </h3>
          <p className="text-muted-foreground">
            {allDocuments.length === 0 
              ? t('pages:documentT.documents.uploadPrompt')
              : t('pages:documentT.documents.adjustFilters')
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('pages:documentT.table.headers.document')}
                  </th>
                  <th className="px-8 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('pages:documentT.table.headers.type')}
                  </th>
                  <th className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('pages:documentT.table.headers.status')}
                  </th>
                  <th className="px-9 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('pages:documentT.table.headers.privacy')}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('pages:documentT.table.headers.uploaded')}
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">{t('pages:documentT.table.headers.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                    {/* Document Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {(() => {
                          const { icon: IconComponent, color } = getFileTypeIcon(doc.file_type)
                          return <IconComponent className={`h-8 w-8 ${color} mr-3`} />
                        })()}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.document_name}
                          </p>
                          {doc.file_size && (
                            <p className="text-xs text-gray-500">
                              {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                          {doc.summary && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {doc.summary.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    {/* Type Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const { icon: IconComponent, color } = getFileTypeIcon(doc.file_type)
                          return <IconComponent className={`h-4 w-4 ${color}`} />
                        })()}
                        <span className="text-sm text-gray-900">
                          {doc.file_type || t('pages:documentT.general.unknown')}
                        </span>
                      </div>
                    </td>
                    
                    {/* Status Column */}
                  <td className="px-6 py-4 min-w-[130px]">
  <div className="flex justify-start">
    {getStatusBadge(doc.status)}
  </div>
</td>

                    
                    {/* Privacy Column */}
                    <td className="px-6 py-4 min-w-[150px]">
                      {/* <div className="flex justify-start"> */}
                        {getPrivacyBadge(doc.privacy, doc.is_shared || false)}
                      {/* </div> */}
                    </td>
                    
                    {/* Uploaded Column */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(doc.created_at || doc.createdAt), { addSuffix: true })}
                      </div>
                    </td>
                    
                    {/* Actions Column */}
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              onClick={() => handleDownloadSummary(doc)}
                              className="flex items-center gap-2"
                              disabled={downloadingSummaryId === doc._id}
                            >
                              <FileText className="h-4 w-4" />
                              {downloadingSummaryId === doc._id 
                                ? t('pages:documentT.documents.downloadingSummary')
                                : t('pages:documentT.table.actions.downloadSummary')}
                            </DropdownMenuItem>

                            <DropdownMenuItem 
                              onClick={() => handleDownloadDocument(doc)}
                              className="flex items-center gap-2"
                              disabled={downloadingDocumentId === doc._id}
                            >
                              <Download className="h-4 w-4" />
                              {downloadingDocumentId === doc._id 
                                ? t('pages:documentT.documents.downloadingDocument')
                                : t('pages:documentT.table.actions.downloadDocument')}
                            </DropdownMenuItem>
                            
                            { (doc.privacy === 'private') && (
                              <DropdownMenuItem 
                                onClick={() => handleShareWithLawyer(doc)}
                                className="flex items-center gap-2"
                              >
                                <Share2 className="h-4 w-4" />
                                {t('pages:documentT.table.actions.shareDocument')}
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                              onClick={() => handleDelete(doc._id)}
                              className="flex items-center gap-2 text-red-600"
                              disabled={deletingId === doc._id}
                            >
                              <Trash2 className="h-4 w-4" />
                              {t('pages:documentT.table.actions.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Share Document Dialog */}
      {selectedDocument && (
        <ShareDocumentDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          document={{
            id: selectedDocument._id,
            document_name: selectedDocument.document_name,
            privacy: selectedDocument.privacy || 'public',
            shared_with: selectedDocument.shared_with || []
          }}
          onShareUpdate={handleShareUpdate}
        />
      )}
    </div>
  )
}