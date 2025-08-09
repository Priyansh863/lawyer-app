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
  SortDesc
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { getDocuments, deleteDocument } from '@/lib/api/documents-api'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

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
  privacy?: 'public' | 'private'
  file_size?: number
  file_type?: string
  shared_with?: {
    _id: string
    first_name: string
    last_name: string
    email: string
  }[]
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
  // Separate state for all documents and filtered documents
  const [allDocuments, setAllDocuments] = useState<Document[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Completed' | 'Failed' | 'Rejected' | 'Approved' | 'Processing' | 'Cancelled'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Get user from Redux store
  const user = useSelector((state: RootState) => state.auth.user)
  const isClient = user?.account_type === 'client'
  const isLawyer = user?.account_type === 'lawyer'

  // Load documents only when refreshTrigger changes
  useEffect(() => {
    loadDocuments()
  }, [refreshTrigger])

  // Apply filters when search term or status filter changes
  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, allDocuments])

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
        toast.error('Failed to load documents')
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      toast.error('Error loading documents')
    } finally {
      setIsLoading(false)
    }
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

    setDocuments(filteredDocs)
  }

  // Enhanced status badge styling with better colors and visual indicators
  const getStatusBadge = (status: Document['status']) => {
    const statusConfig = {
      'Pending': { 
        color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', 
        icon: Clock,
        label: 'Pending',
        dotColor: 'bg-amber-500'
      },
      'Completed': { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', 
        icon: CheckCircle,
        label: 'Completed',
        dotColor: 'bg-emerald-500'
      },
      'Failed': { 
        color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100', 
        icon: XCircle,
        label: 'Failed',
        dotColor: 'bg-red-500'
      },
      'Rejected': { 
        color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100', 
        icon: Ban,
        label: 'Rejected',
        dotColor: 'bg-rose-500'
      },
      'Approved': { 
        color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100', 
        icon: CheckCircle,
        label: 'Approved',
        dotColor: 'bg-blue-500'
      },
      'Processing': { 
        color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100', 
        icon: Loader2,
        label: 'Processing',
        dotColor: 'bg-violet-500'
      },
      'Cancelled': { 
        color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100', 
        icon: Ban,
        label: 'Cancelled',
        dotColor: 'bg-slate-500'
      }
    }

    const config = statusConfig[status] || statusConfig['Pending']
    const IconComponent = config.icon

    return (
      <Badge 
        variant="outline" 
        className={`${config.color} border-2 flex items-center gap-2 px-3 py-1.5 font-medium transition-colors shadow-sm`}
      >
        <div className={`w-2 h-2 rounded-full ${config.dotColor} shadow-sm`} />
        <IconComponent className={`h-3.5 w-3.5 ${status === 'Processing' ? 'animate-spin' : ''}`} />
        <span className="text-sm font-medium">{config.label}</span>
      </Badge>
    )
  }

  // Privacy badge
  const getPrivacyBadge = (privacy: string | undefined, isShared: boolean) => {
    if (privacy === 'private') {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1">
          <Lock className="h-3 w-3" />
          {isShared ? 'Shared' : 'Private'}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
        <Globe className="h-3 w-3" />
        Public
      </Badge>
    )
  }

  // Handle document deletion
  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    
    setDeletingId(documentId)
    try {
      const response = await deleteDocument(documentId)
      if (response.success) {
        toast.success('Document deleted successfully')
        loadDocuments() // Reload documents
        onDocumentUpdate?.()
      } else {
        toast.error('Failed to delete document')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Error deleting document')
    } finally {
      setDeletingId(null)
    }
  }

  // Get uploader name
  const getUploaderName = (uploadedBy: Document['uploaded_by']) => {
    if (typeof uploadedBy === 'string') return 'Unknown'
    return `${uploadedBy.first_name} ${uploadedBy.last_name}`
  }

  // Get shared with names
  const getSharedWithNames = (sharedWith: Document['shared_with']) => {
    if (!sharedWith || sharedWith.length === 0) return 'None'
    return sharedWith.map(user => `${user.first_name} ${user.last_name}`).join(', ')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading documents...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with single search bar and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
   
        
        {/* Single search and filter section */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results summary */}
   

      {/* Documents Table */}
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {allDocuments.length === 0 ? 'No documents uploaded yet' : 'No documents match your filters'}
          </h3>
          <p className="text-muted-foreground">
            {allDocuments.length === 0 
              ? 'Upload your first document to get started with AI analysis.'
              : 'Try adjusting your search terms or filters to find documents.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Privacy
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.document_name}
                          </p>
                          {doc.file_type && (
                            <p className="text-xs text-gray-500">{doc.file_type}</p>
                          )}
                          {doc.summary && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {doc.summary.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="px-6 py-4">
                      {getPrivacyBadge(doc.privacy, doc.is_shared || false)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {getUploaderName(doc.uploaded_by)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDistanceToNow(new Date(doc.created_at || doc.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            onClick={() => window.open(doc.link, '_blank')}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Document
                          </DropdownMenuItem>
                          
                          {isClient && doc.privacy === 'private' && (
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Share2 className="h-4 w-4" />
                              Share with Lawyer
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => handleDelete(doc._id)}
                            disabled={deletingId === doc._id}
                            className="flex items-center gap-2 text-red-600 focus:text-red-600"
                          >
                            {deletingId === doc._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
