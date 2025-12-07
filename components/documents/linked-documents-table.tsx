'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  FileText, 
  MoreVertical, 
  ExternalLink,
  Search,
  Loader2,
  FolderOpen,
  HardDrive,
  File,
  Image,
  Video,
  Download,
  RefreshCw,
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from "@/hooks/useTranslation"
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

interface LinkedDocument {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  folderName: string
  lastModified: string
  uploadedAt: string
  isMetadataOnly: boolean
  localPath?: string
  downloadUrl: string | null
}

interface LinkedDocumentsTableProps {
  refreshTrigger?: number
}

export default function LinkedDocumentsTable({ refreshTrigger }: LinkedDocumentsTableProps) {
  const { t } = useTranslation()
  const [documents, setDocuments] = useState<LinkedDocument[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<LinkedDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openingFileId, setOpeningFileId] = useState<string | null>(null)

  const user = useSelector((state: RootState) => state.auth?.user)
  const userId = user?._id || 'test-user-123'

  useEffect(() => {
    loadDocuments()
  }, [refreshTrigger, userId])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, documents])

  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/linked-documents?userId=${userId}`)
      const result = await response.json()

      if (result.success && result.data) {
        // Show all documents (both uploaded and metadata-only)
        const sortedDocs = result.data.sort((a: LinkedDocument, b: LinkedDocument) => {
          const dateA = new Date(a.uploadedAt)
          const dateB = new Date(b.uploadedAt)
          return dateB.getTime() - dateA.getTime()
        })
        setDocuments(sortedDocs)
      } else {
        console.error('Failed to load linked documents:', result.message)
        toast.error('Failed to load linked documents')
      }
    } catch (error) {
      console.error('Error loading linked documents:', error)
      toast.error('Error loading linked documents. Make sure the backend server is running on http://localhost:5000')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...documents]

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(doc => 
        doc.fileName.toLowerCase().includes(searchLower) ||
        doc.folderName.toLowerCase().includes(searchLower) ||
        doc.fileType.toLowerCase().includes(searchLower)
      )
    }

    setFilteredDocuments(filtered)
  }

  const getFileTypeIcon = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (type.includes('pdf')) return { icon: FileText, color: 'text-red-500' }
    if (type.includes('word') || type.includes('docx')) return { icon: FileText, color: 'text-blue-500' }
    if (type.includes('text') || type.includes('txt')) return { icon: File, color: 'text-green-500' }
    if (type.includes('image') || type.includes('jpg') || type.includes('png')) return { icon: Image, color: 'text-purple-500' }
    if (type.includes('video') || type.includes('mp4') || type.includes('avi')) return { icon: Video, color: 'text-orange-500' }
    return { icon: FileText, color: 'text-gray-500' }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const handleOpenFile = async (doc: LinkedDocument) => {
    setOpeningFileId(doc.id)
    try {
      const response = await fetch('/api/linked-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ docId: doc.id }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Opening file: ${doc.fileName}`)
        // In production, this would trigger the Electron app to open the file
        console.log('File path:', result.data.localPath)
      } else {
        toast.error(`Failed to open file: ${result.message}`)
      }
    } catch (error) {
      console.error('Error opening file:', error)
      toast.error('Error opening file. Please try again.')
    } finally {
      setOpeningFileId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Skeleton height={40} width={300} />
            <Skeleton height={40} width={120} />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg border shadow-sm">
              <Skeleton height={40} width={60} />
              <Skeleton height={20} width={120} className="mt-2" />
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <th key={i} className="px-6 py-3">
                      <Skeleton width={80} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <td key={j} className="px-6 py-4">
                        <Skeleton width={100} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const stats = {
    total: documents.length,
    totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
    recentlyAdded: documents.filter(doc => {
      const uploadDate = new Date(doc.uploadedAt)
      const daysDiff = (Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysDiff <= 7
    }).length,
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Refresh */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('linkedDocuments.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={loadDocuments}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t('linkedDocuments.refresh')}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
              <div className="text-sm text-blue-700 mt-1">{t('linkedDocuments.totalLinkedFiles')}</div>
            </div>
            <HardDrive className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-900">
                {formatFileSize(stats.totalSize)}
              </div>
              <div className="text-sm text-green-700 mt-1">{t('linkedDocuments.totalSize')}</div>
            </div>
            <FolderOpen className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-purple-900">{stats.recentlyAdded}</div>
              <div className="text-sm text-purple-700 mt-1">{t('linkedDocuments.addedThisWeek')}</div>
            </div>
            <FileText className="h-10 w-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Documents Table */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <HardDrive className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {documents.length === 0 ? t('linkedDocuments.noLinkedDocuments') : t('linkedDocuments.noMatchesFound')}
          </h3>
          <p className="text-muted-foreground mb-4">
            {documents.length === 0 
              ? t('linkedDocuments.linkFilesMessage')
              : t('linkedDocuments.adjustSearchMessage')}
          </p>
          {documents.length === 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>{t('linkedDocuments.tipTitle')}</strong> {t('linkedDocuments.tipMessage')}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('linkedDocuments.fileName')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('linkedDocuments.folder')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('linkedDocuments.type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('linkedDocuments.size')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('linkedDocuments.lastModified')}
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">{t('linkedDocuments.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => {
                  const { icon: IconComponent, color } = getFileTypeIcon(doc.fileType)
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      {/* File Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <IconComponent className={`h-8 w-8 ${color} mr-3 flex-shrink-0`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.fileName}
                            </p>
                            {doc.isMetadataOnly ? (
                              <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200">
                                <HardDrive className="h-3 w-3 mr-1" />
                                {t('linkedDocuments.metadataOnly')}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
                                <Download className="h-3 w-3 mr-1" />
                                {t('linkedDocuments.uploaded')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Folder */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate" title={doc.folderName}>
                          <FolderOpen className="h-4 w-4 inline mr-1 text-gray-400" />
                          {doc.folderName || 'N/A'}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {doc.fileType.toUpperCase()}
                        </Badge>
                      </td>

                      {/* Size */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {formatFileSize(doc.fileSize)}
                        </span>
                      </td>

                      {/* Last Modified */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 whitespace-nowrap">
                          {formatDistanceToNow(new Date(doc.lastModified), { addSuffix: true })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          {doc.isMetadataOnly ? (
                            <Button
                              onClick={() => handleOpenFile(doc)}
                              disabled={openingFileId === doc.id}
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              {openingFileId === doc.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  {t('linkedDocuments.opening')}
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="h-4 w-4" />
                                  {t('linkedDocuments.openFile')}
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => window.open(doc.downloadUrl || '', '_blank')}
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              {t('linkedDocuments.download')}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
