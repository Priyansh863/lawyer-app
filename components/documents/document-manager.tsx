'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
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
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Search,
    Folder,
    FileText,
    MoreHorizontal,
    Eye,
    Mic,
    CloudUpload,
    Trash2,
    FolderOpen,
    Play,
    Pause,
    Square,
    Volume2,
    Briefcase,
} from 'lucide-react'
import { useTranslation } from "@/hooks/useTranslation"
import { getDocuments, updateDocumentStorageType, removeFromCloud, removeFromApp, buildRemoveAppPayload, bulkDeleteDocuments, bulkAssignCaseToDocuments, deleteDocument, downloadDocument, createFolder, getDocumentViewUrl, type Document, type RemoveFromAppResponse } from '@/lib/api/documents-api'
import { getCases } from '@/lib/api/cases-api'
import type { Case } from '@/types/case'
import { uploadFileOnS3 } from '@/lib/helpers/fileupload'
import { toast } from 'sonner'
import { AddDocumentsDialog } from './add-documents-dialog'
import SecureLinkGenerator from './secure-link-generator'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { getClientsAndLawyers } from '@/lib/api/users-api'

export default function DocumentManager() {
    const { t } = useTranslation()
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState('newest')
    const [isAddDocumentsOpen, setIsAddDocumentsOpen] = useState(false)
    const [documents, setDocuments] = useState<Document[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [clients, setClients] = useState<any[]>([])
    const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
    const [openFolder, setOpenFolder] = useState<string | null>(null)

    // Confirmation dialogs
    const [removeCloudDialog, setRemoveCloudDialog] = useState<{ open: boolean; doc: Document | null }>({ open: false, doc: null })
    const [removeAppDialog, setRemoveAppDialog] = useState<{ open: boolean; doc: Document | null }>({ open: false, doc: null })

    // AI Audio Summary dialog
    const [audioSummaryDialog, setAudioSummaryDialog] = useState<{ open: boolean; doc: Document | null }>({ open: false, doc: null })
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [selectedLang, setSelectedLang] = useState('en-US')

    // Create Folder dialog
    const [isAddFolderOpen, setIsAddFolderOpen] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [isCreatingFolder, setIsCreatingFolder] = useState(false)

    // Rename Folder dialog
    const [renameFolderDialog, setRenameFolderDialog] = useState<{ open: boolean; doc: Document | null }>({ open: false, doc: null })
    const [renameFolderName, setRenameFolderName] = useState('')
    const [isRenamingFolder, setIsRenamingFolder] = useState(false)

    // Remove Folder dialog
    const [removeFolderDialog, setRemoveFolderDialog] = useState<{ open: boolean; doc: Document | null }>({ open: false, doc: null })

    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)

    // Assign Case dialog
    const [assignCaseOpen, setAssignCaseOpen] = useState(false)
    const [isAssigningCase, setIsAssigningCase] = useState(false)
    const [assignCaseQuery, setAssignCaseQuery] = useState('')
    const [cases, setCases] = useState<Case[]>([])
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
    const [isLoadingCases, setIsLoadingCases] = useState(false)

    const languages = [
        { value: 'en-US', label: 'English' },
        { value: 'ko-KR', label: '한국어' },
        { value: 'ja-JP', label: '日本語' },
        { value: 'zh-CN', label: '中文' },
    ]

    const user = useSelector((state: RootState) => state.auth.user)

    useEffect(() => {
        loadDocuments()
        if (user?.account_type === 'lawyer') {
            fetchClients()
        }
    }, [user])

    // If user clicked "Open Folder" from a case dialog, pre-open that folder here.
    useEffect(() => {
        try {
            const folder = localStorage.getItem("documentManagerOpenFolder")
            if (folder) {
                setOpenFolder(folder)
                localStorage.removeItem("documentManagerOpenFolder")
            }
        } catch {
            // ignore
        }
        // run once on mount
    }, [])

    const loadCases = async (query = '') => {
        setIsLoadingCases(true)
        try {
            const res = await getCases({ query, limit: 100 })
            if (res.success) {
                setCases(res.cases || [])
            }
        } catch (error) {
            console.error('Error fetching cases', error)
        } finally {
            setIsLoadingCases(false)
        }
    }

    useEffect(() => {
        if (assignCaseOpen) {
            loadCases(assignCaseQuery)
        }
    }, [assignCaseOpen, assignCaseQuery])

    // Keep summary dialog data fresh while it's open (AI summary can complete asynchronously).
    useEffect(() => {
        if (!audioSummaryDialog.open || !audioSummaryDialog.doc?._id) return

        let isMounted = true
        const currentDocId = audioSummaryDialog.doc._id

        const refreshSummaryDoc = async () => {
            try {
                const response = await getDocuments()
                if (!isMounted || !response.success || !response.documents) return

                setDocuments(response.documents)
                const latestDoc = response.documents.find((d) => d._id === currentDocId)
                if (latestDoc) {
                    setAudioSummaryDialog((prev) => {
                        if (!prev.open || prev.doc?._id !== currentDocId) return prev
                        return { open: true, doc: latestDoc }
                    })
                }
            } catch (error) {
                // Keep current UI state; silent refresh failure should not disrupt user.
            }
        }

        // Fetch immediately, then poll until the dialog closes.
        refreshSummaryDoc()
        const interval = setInterval(refreshSummaryDoc, 5000)

        return () => {
            isMounted = false
            clearInterval(interval)
        }
    }, [audioSummaryDialog.open, audioSummaryDialog.doc?._id])

    const hasSummaryText = (doc?: Document | null) => {
        return !!doc?.summary?.trim()
    }

    const isSummaryProcessing = (doc?: Document | null) => {
        return !hasSummaryText(doc) && (doc?.status || '').toLowerCase() === 'pending'
    }

    const loadDocuments = async () => {
        setIsLoading(true)
        try {
            const response = await getDocuments()
            if (response.success && response.documents) {
                setDocuments(response.documents)
            }
        } catch (error) {
            console.error('Error loading documents:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchClients = async () => {
        try {
            const res = await getClientsAndLawyers()
            setClients(res.clients)
        } catch (error) {
            console.error('Error fetching clients:', error)
        }
    }

    const formatFileSize = (bytes: number | undefined) => {
        if (!bytes) return ''
        const kb = bytes / 1024
        if (kb < 1024) return kb.toFixed(0) + 'KB'
        return (kb / 1024).toFixed(1) + 'MB'
    }

    const formatLastModified = (dateString: string | undefined) => {
        if (!dateString) return ''
        try {
            const date = new Date(dateString)
            const now = new Date()
            const diffMs = now.getTime() - date.getTime()
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
            const diffMonths = Math.floor(diffDays / 30)

            if (diffHours < 1) return t('pages:documentManager.justNow')
            if (diffHours < 24) return t('pages:documentManager.hoursAgo', { hours: diffHours })
            if (diffDays < 30) return t('pages:documentManager.daysAgo', { days: diffDays })
            if (diffMonths < 12) return t('pages:documentManager.monthsAgo', { months: diffMonths })
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' – ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })
        } catch (e) {
            return ''
        }
    }

    const normalizePath = (value: string) => value.replace(/\\/g, '/').replace(/\/+$/, '')
    const isFolderDocument = (doc: Document) => {
        const fileType = (doc.file_type || '').toLowerCase()
        if (fileType === 'folder') return true
        // Backend normalization may omit file_type for folders; infer from shape.
        const hasNoLink = !doc.link || doc.link === '#'
        const loc = (doc.storage_location || '').toString().trim()
        return hasNoLink && !!loc && loc === doc.document_name
    }

    const filteredDocs = documents
        .filter(doc => doc.document_name.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(doc => {
            const loc = normalizePath((doc.storage_location || '').toString())
            const isFolderDoc = isFolderDocument(doc)

            if (!openFolder) {
                // Root list should not include files that are inside folders.
                // Show folders and root-level docs only.
                if (isFolderDoc) return true
                return !loc || loc === '/'
            }

            if (!loc) return false
            const currentFolder = normalizePath(openFolder)

            // Prevent a folder from showing itself when opened.
            if (isFolderDoc && loc === currentFolder) return false

            return loc === currentFolder || loc.startsWith(`${currentFolder}/`)
        })
        .sort((a, b) => {
        if (sortBy === 'name') return a.document_name.localeCompare(b.document_name)
        if (sortBy === 'newest') return new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime()
        if (sortBy === 'oldest') return new Date(a.created_at || a.createdAt).getTime() - new Date(b.created_at || b.createdAt).getTime()
        return 0
    })

    const toggleSelectAll = () => {
        if (selectedDocs.size === filteredDocs.length) {
            setSelectedDocs(new Set())
        } else {
            setSelectedDocs(new Set(filteredDocs.map(d => d._id)))
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedDocs(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const selectedNonFolderIds = () =>
        [...selectedDocs].filter((id) => {
            const d = documents.find((x) => x._id === id)
            return !!d && !isFolderDocument(d)
        })

    const handleBulkDeleteConfirmed = async () => {
        const ids = selectedNonFolderIds()
        if (ids.length === 0) {
            toast.error(t('pages:documentManager.bulkDeleteNone'))
            setBulkDeleteOpen(false)
            return
        }
        setIsBulkDeleting(true)
        try {
            const res = await bulkDeleteDocuments(ids)
            if (!res.success) {
                toast.error(res.message || t('pages:documentManager.bulkDeleteFailed'))
                return
            }
            const deleted = res.deleted ?? res.deletedCount ?? ids.length
            const skipped = res.skipped ?? res.skippedCount ?? 0
            if (skipped > 0) {
                toast.warning(t('pages:documentManager.bulkDeletePartial', { count: deleted, total: deleted + skipped }))
            } else {
                toast.success(t('pages:documentManager.bulkDeleteSuccess', { count: deleted }))
            }
            setSelectedDocs(new Set())
            loadDocuments()
        } finally {
            setIsBulkDeleting(false)
            setBulkDeleteOpen(false)
        }
    }

    const handleBulkAssignCaseConfirmed = async () => {
        const ids = selectedNonFolderIds()
        if (ids.length === 0 || !selectedCaseId) {
            toast.error(t('pages:documentManager.bulkAssignNone', 'Please select documents and a case'))
            return
        }
        setIsAssigningCase(true)
        try {
            const res = await bulkAssignCaseToDocuments(ids, selectedCaseId)
            if (!res.success) {
                toast.error(res.message || t('pages:documentManager.bulkAssignFailed', 'Failed to assign case'))
                return
            }
            toast.success(t('pages:documentManager.bulkAssignSuccess', 'Case assigned successfully'))
            setSelectedDocs(new Set())
            setAssignCaseOpen(false)
            setSelectedCaseId(null)
            loadDocuments()
        } catch (error) {
            toast.error(t('pages:documentManager.bulkAssignFailed', 'Failed to assign case'))
        } finally {
            setIsAssigningCase(false)
        }
    }

    // Get single storage badge text: PC / Cloud / PC + Cloud
    const getStorageBadge = (doc: Document) => {
        const st = doc.storage_type || 'app'
        const label =
            st === 'app_cloud'
                ? t('pages:documentManager.badgePCCloud')
                : st === 'cloud'
                    ? t('pages:documentManager.badgeCloud')
                    : t('pages:documentManager.badgePC')

        const color =
            st === 'app_cloud'
                ? 'bg-[#2563eb]'
                : st === 'cloud'
                    ? 'bg-[#0ea5e9]'
                    : 'bg-[#22c55e]'

        return (
            <span className={`px-3.5 py-1 ${color} text-white rounded-full text-[11px] font-extrabold leading-none shadow-sm`}>
                {label}
            </span>
        )
    }

    // Action handlers
    const handleViewDocument = async (doc: Document) => {
        const rawLink = (doc.link || '').trim()
        try {
            // Use the centralized utility to resolve the best view URL
            const resolved = await getDocumentViewUrl(doc._id, rawLink)
            if (resolved) {
                const opened = window.open(resolved, '_blank', 'noopener,noreferrer')
                if (!opened) {
                    toast.error(t('pages:documentManager.popupBlocked', 'Popup blocked. Please allow popups to view documents.'))
                }
            } else {
                toast.info(t('pages:documentManager.toastInfoView'))
            }
        } catch (error) {
            console.error('Error opening document:', error)
            toast.error(t('pages:documentManager.toastInfoView'))
        }
    }

    const handleUploadToCloud = async (doc: Document) => {
        try {
            // Update storage type to app_cloud
            const res = await updateDocumentStorageType(doc._id, 'app_cloud', doc.link)
            if (res.success) {
                toast.success(t('pages:documentManager.toastSuccessUploadCloud'))
                loadDocuments()
            } else {
                toast.error(res.message || t('pages:documentManager.toastErrorUploadCloud'))
            }
        } catch (error) {
            toast.error(t('pages:documentManager.toastErrorUploadCloud'))
        }
    }

    const handleRemoveFromCloud = async () => {
        const doc = removeCloudDialog.doc
        if (!doc) return
        try {
            const hasApp = doc.storage_type === 'app' || doc.storage_type === 'app_cloud' || !doc.storage_type
            const hasCloud = doc.storage_type === 'cloud' || doc.storage_type === 'app_cloud'
            const res = hasCloud && !hasApp
                ? await deleteDocument(doc._id) // cloud-only: remove from list entirely
                : await updateDocumentStorageType(doc._id, 'app') // app+cloud: keep only PC
            if (res.success) {
                toast.success(t('pages:documentManager.toastRemovedCloud'))
                loadDocuments()
            } else {
                toast.error(res.message || t('pages:documentManager.toastRemoveCloudFailed'))
            }
        } catch (error) {
            toast.error(t('pages:documentManager.toastRemoveCloudFailed'))
        }
        setRemoveCloudDialog({ open: false, doc: null })
    }

    const handleRemoveFromApp = async () => {
        const doc = removeAppDialog.doc
        if (!doc) return
        try {
            const hasCloud = doc.storage_type === 'cloud' || doc.storage_type === 'app_cloud'
            if (hasCloud) {
                const res = await updateDocumentStorageType(doc._id, 'cloud')
                if (!res.success) {
                    toast.error(res.message || t('pages:documentManager.toastRemoveAppFailed'))
                    setRemoveAppDialog({ open: false, doc: null })
                    return
                }
                const pc = (await removeFromApp(
                    doc._id,
                    buildRemoveAppPayload({ ...doc, storage_type: 'cloud' })
                )) as RemoveFromAppResponse
                if (!pc.success) {
                    toast.warning(t('pages:documentManager.pcDeletePending'))
                } else if (pc.alreadyQueued) {
                    toast.success(t('pages:documentManager.pcDeleteAlreadyQueued'))
                } else {
                    toast.success(t('pages:documentManager.toastRemovedApp'))
                }
                loadDocuments()
            } else {
                try {
                    await deleteDocument(doc._id)
                } catch {
                    toast.error(t('pages:documentManager.toastRemoveAppFailed'))
                    setRemoveAppDialog({ open: false, doc: null })
                    return
                }
                await removeFromApp(doc._id)
                toast.success(t('pages:documentManager.toastRemovedApp'))
                loadDocuments()
            }
        } catch (error) {
            toast.error(t('pages:documentManager.toastRemoveAppFailed'))
        }
        setRemoveAppDialog({ open: false, doc: null })
    }

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            toast.error(t('pages:documentManager.enterFolderName'))
            return
        }
        
        const userId = user?._id || ''
        if (!userId) {
            toast.error(t('pages:commona.error'))
            return
        }

        setIsCreatingFolder(true)
        try {
            const res = await createFolder(newFolderName.trim(), userId)
            if (res.success) {
                toast.success(t('pages:documentManager.folderCreated'))
                setIsAddFolderOpen(false)
                setNewFolderName('')
                loadDocuments()
                setOpenFolder(null)
            } else {
                toast.error(res.message || t('pages:documentManager.folderCreateError'))
            }
        } catch (error) {
            toast.error(t('pages:documentManager.folderCreateError'))
        } finally {
            setIsCreatingFolder(false)
        }
    }

    const handleRenameFolder = async () => {
        // We'll stub this out for now until the backend exposes an update endpoint
        toast.info("Rename logic would be called here")
        setRenameFolderDialog({ open: false, doc: null })
    }

    const handleDeleteFolder = async () => {
        const doc = removeFolderDialog.doc
        if (!doc) return
        try {
            const res = await deleteDocument(doc._id)
            if (res.success) {
                toast.success(t('pages:documentManager.toastRemovedCloud'))
                loadDocuments()
            } else {
                toast.error(res.message || t('pages:documentManager.toastRemoveCloudFailed'))
            }
        } catch (error) {
            toast.error(t('pages:documentManager.toastRemoveCloudFailed'))
        }
        setRemoveFolderDialog({ open: false, doc: null })
    }

    return (
        <div className="flex flex-col w-full max-w-[1400px] mx-auto font-sans">
            {/* Page Title */}
            <h1 className="text-[22px] font-bold text-[#1e293b] dark:text-slate-100 mb-6">{t('pages:documentManager.title')}</h1>

            {openFolder && (
                <div className="flex items-center justify-between mb-4">
                    <div className="text-[13px] font-semibold text-slate-600">
                        {t('pages:documentManager.location')}: <span className="font-bold text-slate-800">{openFolder}</span>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setOpenFolder(null)}
                        className="bg-[#f1f5f9] hover:bg-[#e2e8f0] border-none text-[#1e293b] font-semibold h-[36px] px-4 rounded-md shadow-none text-[13px]"
                    >
                        Back to All
                    </Button>
                </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <input
                        type="checkbox"
                        checked={selectedDocs.size === filteredDocs.length && filteredDocs.length > 0}
                        onChange={toggleSelectAll}
                        className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 transition-colors cursor-pointer"
                    />
                    <span className="text-[15px] font-medium text-[#1e293b] dark:text-slate-100">{t('pages:documentManager.selected')} {selectedDocs.size}</span>
                    {selectedDocs.size > 0 && (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 font-semibold border-slate-300 ml-2"
                                onClick={() => setAssignCaseOpen(true)}
                            >
                                <Briefcase className="h-4 w-4 mr-1.5" />
                                {t('pages:documentManager.assignCase', 'Assign Case')}
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="h-9 font-semibold ml-2"
                                onClick={() => setBulkDeleteOpen(true)}
                                disabled={isBulkDeleting}
                            >
                                <Trash2 className="h-4 w-4 mr-1.5" />
                                {t('pages:documentManager.bulkDeleteSelected')}
                            </Button>
                        </>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[200px] sm:flex-none sm:w-[300px]">
                        <Input
                            placeholder={t('pages:documentManager.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border-[#cbd5e1] border focus-visible:ring-1 focus-visible:ring-slate-300 h-[44px] w-full text-[14px] rounded-md px-4 placeholder:text-slate-400"
                        />
                    </div>

                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="bg-white dark:bg-slate-900 border-[#cbd5e1] dark:border-slate-700 border h-[44px] w-[130px] px-4 text-[#1e293b] dark:text-slate-100 font-medium text-[14px] rounded-md focus:ring-0 shadow-none">
                            <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200">
                            <SelectItem value="newest">{t('pages:documentManager.newest')}</SelectItem>
                            <SelectItem value="oldest">{t('pages:documentManager.oldest')}</SelectItem>
                            <SelectItem value="name">{t('pages:documentManager.name')}</SelectItem>
                        </SelectContent>
                    </Select>

                    {user?.account_type === 'lawyer' && (
                        <SecureLinkGenerator clients={clients} customTrigger={
                            <Button variant="outline" className="bg-[#e2e8f0] dark:bg-slate-700 hover:bg-[#cbd5e1] dark:hover:bg-slate-600 border-none text-[#1e293b] dark:text-slate-100 font-semibold h-[44px] px-6 rounded-md shadow-none text-[14px]">
                                {t('pages:documentManager.generateLink')}
                            </Button>
                        } />
                    )}

                    <Button 
                        variant="outline" 
                        onClick={() => setIsAddFolderOpen(true)}
                        className="bg-[#e2e8f0] dark:bg-slate-700 hover:bg-[#cbd5e1] dark:hover:bg-slate-600 border-none text-[#1e293b] dark:text-slate-100 font-semibold h-[44px] px-6 rounded-md shadow-none text-[14px]">
                        {t('pages:documentManager.addFolder')}
                    </Button>

                    <Button
                        onClick={() => setIsAddDocumentsOpen(true)}
                        className="bg-[#1e293b] hover:bg-slate-800 text-white flex items-center gap-2 h-[44px] px-6 rounded-md shadow-none font-semibold text-[14px]"
                    >
                        <Folder className="h-5 w-5" />
                        {t('pages:documentManager.addDocuments')}
                    </Button>
                </div>
            </div>

            {/* Documents List */}
            <div className="flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center p-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a2332]"></div>
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="flex items-center justify-center p-20">
                        <p className="text-[#1a2332] font-bold text-base">
                            {t('pages:documentManager.noDocumentsFound')}
                        </p>
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto pb-4">
                        <div className="min-w-[950px]">
                            {/* Custom Headers */}
                        <div className="grid grid-cols-[60px_1.5fr_1fr_1.2fr_1.2fr_100px_80px] px-6 py-3 bg-[#f1f5f9] border border-[#e2e8f0] rounded-md text-[13px] font-bold text-[#475569] mb-4">
                            <div></div>
                            <div className="flex items-center">{t('pages:documentManager.name')}</div>
                            <div className="flex items-center justify-end pr-8">{t('pages:documentManager.fileSize')}</div>
                            <div className="flex items-center justify-center">{t('pages:documentManager.lastModified')}</div>
                            <div className="flex items-center justify-center">{t('pages:documentManager.status')}</div>
                            <div className="flex items-center justify-center">{t('pages:documentManager.location')}</div>
                            <div className="flex items-center justify-center">{t('pages:documentManager.action')}</div>
                        </div>

                        {/* Document Rows as Cards */}
                        <div className="flex flex-col gap-2">
                            {filteredDocs.map((doc) => {
                                const st = doc.storage_type || 'app'
                                const hasApp = st === 'app' || st === 'app_cloud'
                                const hasCloud = st === 'cloud' || st === 'app_cloud'
                                const isFolder = isFolderDocument(doc)

                                return (
                                    <div
                                        key={doc._id}
                                        className="grid grid-cols-[60px_1.5fr_1fr_1.2fr_1.2fr_100px_80px] items-center px-6 py-2.5 bg-white border border-[#e2e8f0] rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-[#cbd5e1] transition-all"
                                    >
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedDocs.has(doc._id)}
                                                onChange={() => toggleSelect(doc._id)}
                                                className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 transition-colors cursor-pointer"
                                            />
                                        </div>

                                        <div className="flex items-center gap-4 pr-4 overflow-hidden">
                                            {isFolder ? (
                                                <Folder className="h-5 w-5 text-amber-500 fill-amber-500" />
                                            ) : (
                                                <FileText className="h-5 w-5 text-slate-400" />
                                            )}
                                            {isFolder ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenFolder(doc.storage_location || doc.document_name)}
                                                    className="text-[15px] font-bold text-slate-800 truncate text-left hover:underline"
                                                    title={doc.document_name}
                                                >
                                                    {doc.document_name}
                                                </button>
                                            ) : (
                                                <span className="text-[15px] font-bold text-slate-800 truncate">
                                                    {doc.document_name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-right pr-8 text-[14px] font-bold text-slate-800">
                                            {!isFolder && formatFileSize(doc.file_size)}
                                        </div>

                                        <div className="text-center text-[14px] font-medium text-slate-500">
                                            {formatLastModified(doc.created_at || doc.createdAt)}
                                        </div>

                                        <div className="flex justify-center gap-2 flex-wrap items-center">
                                            {!isFolder && getStorageBadge(doc)}
                                        </div>

                                        <div className="flex justify-center">
                                            {!isFolder && (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="p-1 cursor-pointer">
                                                                <Folder className="h-6 w-6 text-slate-300 hover:text-slate-500" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="bg-slate-900 text-white border-0 px-3 py-2 rounded text-[12px] font-medium shadow-lg">
                                                            <span>{doc.storage_location || doc.link || 'Local storage'}</span>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>

                                        <div className="flex justify-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-50">
                                                        <MoreHorizontal className="h-6 w-6 text-slate-600" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-52 bg-white border border-slate-200 shadow-xl rounded-lg p-1">
                                                    {isFolder ? (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setRenameFolderName(doc.document_name)
                                                                    setRenameFolderDialog({ open: true, doc })
                                                                }}
                                                                className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold cursor-pointer rounded-md hover:bg-slate-50"
                                                            >
                                                                {t('pages:documentManager.renameFolder')}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => setRemoveFolderDialog({ open: true, doc })}
                                                                className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#ef4444] cursor-pointer rounded-md hover:bg-red-50"
                                                            >
                                                                {t('pages:documentManager.removeFolder')}
                                                            </DropdownMenuItem>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => handleViewDocument(doc)}
                                                                className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold cursor-pointer rounded-md hover:bg-slate-50"
                                                            >
                                                                <Eye className="h-4 w-4 text-slate-500" />
                                                                {t('pages:documentManager.viewDocument')}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => setAudioSummaryDialog({ open: true, doc })}
                                                                className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold cursor-pointer rounded-md hover:bg-slate-50"
                                                            >
                                                                <Mic className="h-4 w-4 text-slate-500" />
                                                                {t('pages:documentManager.aiAudioSummary')}
                                                            </DropdownMenuItem>
        
                                                            {/* If app-only, show "Upload to Cloud" */}
                                                            {hasApp && !hasCloud && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleUploadToCloud(doc)}
                                                                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#0ea5e9] cursor-pointer rounded-md hover:bg-sky-50"
                                                                >
                                                                    <CloudUpload className="h-4 w-4" />
                                                                    {t('pages:documentManager.uploadToCloud')}
                                                                </DropdownMenuItem>
                                                            )}
        
                                                            {/* If has cloud, show delete cloud */}
                                                            {hasCloud && (
                                                                <DropdownMenuItem
                                                                    onClick={() => setRemoveCloudDialog({ open: true, doc })}
                                                                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#ef4444] cursor-pointer rounded-md hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    {t('pages:documentManager.removeFromCloud')}
                                                                </DropdownMenuItem>
                                                            )}
        
                                                            {/* If has app, show delete PC */}
                                                            {hasApp && (
                                                                <DropdownMenuItem
                                                                    onClick={() => setRemoveAppDialog({ open: true, doc })}
                                                                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#ef4444] cursor-pointer rounded-md hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    {t('pages:documentManager.removeFromApp')}
                                                                </DropdownMenuItem>
                                                            )}
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Remove from Cloud Confirmation Dialog */}
            <Dialog open={removeCloudDialog.open} onOpenChange={(open) => setRemoveCloudDialog({ open, doc: open ? removeCloudDialog.doc : null })}>
                <DialogContent className="sm:max-w-[420px] rounded-md border border-slate-200 bg-white shadow-xl p-8">
                    <DialogHeader className="text-center space-y-2">
                        <DialogTitle className="text-lg font-bold text-[#1a2332] text-center">{t('pages:documentManager.removeCloudTitle')}</DialogTitle>
                        <DialogDescription className="text-[14px] text-[#64748b] text-center">
                            {removeCloudDialog.doc?.storage_type === 'app_cloud'
                                ? t('pages:documentManager.removeCloudDescriptionKeepPC')
                                : t('pages:documentManager.removeCloudDescriptionOnlyCloud')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-center gap-3 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setRemoveCloudDialog({ open: false, doc: null })}
                            className="border-slate-200 text-[#64748b] font-bold h-10 px-6 rounded-md shadow-none"
                        >
                            {t('pages:documentManager.cancel')}
                        </Button>
                        <Button
                            onClick={handleRemoveFromCloud}
                            className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold h-10 px-6 rounded-md shadow-none"
                        >
                            {t('pages:documentManager.remove')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove from App Confirmation Dialog */}
            <Dialog open={removeAppDialog.open} onOpenChange={(open) => setRemoveAppDialog({ open, doc: open ? removeAppDialog.doc : null })}>
                <DialogContent className="sm:max-w-[420px] rounded-md border border-slate-200 bg-white shadow-xl p-8">
                    <DialogHeader className="text-center space-y-2">
                        <DialogTitle className="text-lg font-bold text-[#1a2332] text-center">{t('pages:documentManager.removeAppTitle')}</DialogTitle>
                        <DialogDescription className="text-[14px] text-[#64748b] text-center">
                            {removeAppDialog.doc?.storage_type === 'app_cloud'
                                ? t('pages:documentManager.removeAppDescriptionKeepCloud')
                                : t('pages:documentManager.removeAppDescriptionOnlyPC')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-center gap-3 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setRemoveAppDialog({ open: false, doc: null })}
                            className="border-slate-200 text-[#64748b] font-bold h-10 px-6 rounded-md shadow-none"
                        >
                            {t('pages:documentManager.cancel')}
                        </Button>
                        <Button
                            onClick={handleRemoveFromApp}
                            className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold h-10 px-6 rounded-md shadow-none"
                        >
                            {t('pages:documentManager.remove')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <DialogContent className="sm:max-w-[420px] rounded-md border border-slate-200 bg-white shadow-xl p-8">
                    <DialogHeader className="text-center space-y-2">
                        <DialogTitle className="text-lg font-bold text-[#1a2332] text-center">
                            {t('pages:documentManager.bulkDeleteTitle')}
                        </DialogTitle>
                        <DialogDescription className="text-[14px] text-[#64748b] text-center">
                            {t('pages:documentManager.bulkDeleteDescription', { count: selectedNonFolderIds().length })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-center gap-3 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setBulkDeleteOpen(false)}
                            className="border-slate-200 text-[#64748b] font-bold h-10 px-6 rounded-md shadow-none"
                            disabled={isBulkDeleting}
                        >
                            {t('pages:documentManager.cancel')}
                        </Button>
                        <Button
                            onClick={handleBulkDeleteConfirmed}
                            className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold h-10 px-6 rounded-md shadow-none"
                            disabled={isBulkDeleting}
                        >
                            {isBulkDeleting ? t('pages:documentManager.bulkDeleteWorking') : t('pages:documentManager.remove')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Documents Dialog */}
            <AddDocumentsDialog
                isOpen={isAddDocumentsOpen}
                onClose={() => setIsAddDocumentsOpen(false)}
                onUploadSuccess={() => {
                    setIsAddDocumentsOpen(false);
                    loadDocuments();
                }}
                targetFolder={openFolder}
            />

            {/* Add Folder Dialog */}
            <Dialog open={isAddFolderOpen} onOpenChange={setIsAddFolderOpen}>
                <DialogContent className="sm:max-w-[420px] rounded-md border border-slate-200 bg-white shadow-xl p-8">
                    <DialogHeader className="text-left space-y-2">
                        <DialogTitle className="text-lg font-bold text-[#1a2332] text-center">
                            {t('pages:documentManager.addFolder')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <Input
                            placeholder={t('pages:documentManager.folderName')}
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateFolder()
                            }}
                            className="bg-white border-[#cbd5e1] focus-visible:ring-1 focus-visible:ring-slate-300 h-[44px] w-full text-[14px] rounded-md px-4 placeholder:text-slate-400"
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="flex justify-center gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAddFolderOpen(false)
                                setNewFolderName('')
                            }}
                            className="border-slate-200 text-[#64748b] font-bold h-10 px-6 rounded-md shadow-none"
                            disabled={isCreatingFolder}
                        >
                            {t('pages:documentManager.cancel')}
                        </Button>
                        <Button
                            onClick={handleCreateFolder}
                            className="bg-[#1e293b] hover:bg-slate-800 text-white font-bold h-10 px-6 rounded-md shadow-none flex items-center justify-center"
                            disabled={isCreatingFolder}
                        >
                            {isCreatingFolder ? (
                                <div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-white animate-spin"></div>
                            ) : (
                                t('pages:documentManager.save') || 'Save'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Folder Dialog */}
            <Dialog open={renameFolderDialog.open} onOpenChange={(open) => setRenameFolderDialog({ open, doc: open ? renameFolderDialog.doc : null })}>
                <DialogContent className="sm:max-w-[420px] rounded-md border border-slate-200 bg-white shadow-xl p-8">
                    <DialogHeader className="text-left space-y-2">
                        <DialogTitle className="text-lg font-bold text-[#1a2332] text-center">
                            {t('pages:documentManager.renameFolder')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <Input
                            placeholder={t('pages:documentManager.folderName')}
                            value={renameFolderName}
                            onChange={(e) => setRenameFolderName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameFolder()
                            }}
                            className="bg-white border-[#cbd5e1] focus-visible:ring-1 focus-visible:ring-slate-300 h-[44px] w-full text-[14px] rounded-md px-4 placeholder:text-slate-400"
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="flex justify-center gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRenameFolderDialog({ open: false, doc: null })
                                setRenameFolderName('')
                            }}
                            className="border-slate-200 text-[#64748b] font-bold h-10 px-6 rounded-md shadow-none"
                            disabled={isRenamingFolder}
                        >
                            {t('pages:documentManager.cancel')}
                        </Button>
                        <Button
                            onClick={handleRenameFolder}
                            className="bg-[#1e293b] hover:bg-slate-800 text-white font-bold h-10 px-6 rounded-md shadow-none flex items-center justify-center"
                            disabled={isRenamingFolder}
                        >
                            {isRenamingFolder ? (
                                <div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-white animate-spin"></div>
                            ) : (
                                t('pages:documentManager.save') || 'Save'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Folder Dialog */}
            <Dialog open={removeFolderDialog.open} onOpenChange={(open) => setRemoveFolderDialog({ open, doc: open ? removeFolderDialog.doc : null })}>
                <DialogContent className="sm:max-w-[420px] rounded-md border border-slate-200 bg-white shadow-xl p-8">
                    <DialogHeader className="text-center space-y-2">
                        <DialogTitle className="text-lg font-bold text-[#1a2332] text-center">{t('pages:documentManager.removeFolder')}</DialogTitle>
                        <DialogDescription className="text-[14px] text-[#64748b] text-center">
                            Are you sure you want to remove this folder?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-center gap-3 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setRemoveFolderDialog({ open: false, doc: null })}
                            className="border-slate-200 text-[#64748b] font-bold h-10 px-6 rounded-md shadow-none"
                        >
                            {t('pages:documentManager.cancel')}
                        </Button>
                        <Button
                            onClick={handleDeleteFolder}
                            className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold h-10 px-6 rounded-md shadow-none"
                        >
                            {t('pages:documentManager.remove')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AI Audio Summary Dialog */}
            <Dialog
                open={audioSummaryDialog.open}
                onOpenChange={(open) => {
                    if (!open) {
                        // Stop any active speech when closing
                        speechSynthesis.cancel()
                        setIsSpeaking(false)
                        setIsPaused(false)
                    }
                    setAudioSummaryDialog({ open, doc: open ? audioSummaryDialog.doc : null })
                }}
            >
                <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
                    <div className="p-8 space-y-5">
                        <DialogHeader className="space-y-2">
                            <DialogTitle className="text-lg font-bold text-[#1a2332] flex items-center gap-2">
                                <Volume2 className="h-5 w-5 text-[#0ea5e9]" />
                                {t('pages:documentManager.aiAudioSummary')}
                            </DialogTitle>
                            <DialogDescription className="text-[14px] text-[#64748b]">
                                {t('pages:documentManager.listenToAiSummary')}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Document Name */}
                        <div className="flex items-center gap-3 p-4 bg-[#f8fafc] rounded-lg border border-slate-100">
                            <FileText className="h-5 w-5 text-[#64748b] shrink-0" />
                            <span className="text-[14px] font-medium text-[#1a2332] truncate">
                                {audioSummaryDialog.doc?.document_name}
                            </span>
                        </div>

                        {/* Summary Text */}
                        <div className="max-h-[200px] overflow-y-auto p-4 bg-[#f8fafc] rounded-lg border border-slate-100">
                            <p className="text-[13px] leading-relaxed text-[#475569]">
                                {hasSummaryText(audioSummaryDialog.doc)
                                    ? audioSummaryDialog.doc?.summary
                                    : isSummaryProcessing(audioSummaryDialog.doc)
                                        ? t('pages:documentManager.summaryProcessing', 'AI summary is still processing. Please wait a moment and reopen, or keep this dialog open to auto-refresh.')
                                        : t('pages:documentManager.noSummaryAvailable')}
                            </p>
                        </div>

                        {/* Language Selector */}
                        <div className="flex items-center gap-3">
                            <span className="text-[13px] font-medium text-[#64748b]">{t('pages:documentManager.language')}:</span>
                            <Select value={selectedLang} onValueChange={setSelectedLang}>
                                <SelectTrigger className="w-[140px] h-9 text-[13px] border-slate-200 focus:ring-0 shadow-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {languages.map(lang => (
                                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Playback Indicator */}
                        {isSpeaking && (
                            <div className="flex items-center gap-2 px-4 py-3 bg-[#f0f9ff] border border-[#bae6fd] rounded-lg">
                                <div className="flex items-center gap-1">
                                    <div className="w-1 h-4 bg-[#0ea5e9] rounded-full animate-pulse" />
                                    <div className="w-1 h-6 bg-[#0ea5e9] rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-1 h-3 bg-[#0ea5e9] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                    <div className="w-1 h-5 bg-[#0ea5e9] rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                                    <div className="w-1 h-4 bg-[#0ea5e9] rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                                </div>
                                <span className="text-[13px] font-medium text-[#0ea5e9] ml-2">
                                    {isPaused ? t('pages:documentManager.paused') : t('pages:documentManager.playing')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Controls Footer */}
                    <div className="border-t border-slate-200 px-8 py-5 flex justify-center gap-3">
                        {isSummaryProcessing(audioSummaryDialog.doc) ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-[12px] font-medium text-amber-700">
                                    {t('pages:documentManager.summaryProcessingShort', 'Summary is processing...')}
                                </span>
                            </div>
                        ) : null}
                        {!isSpeaking && !isPaused ? (
                            <Button
                                onClick={() => {
                                    const doc = audioSummaryDialog.doc
                                    if (!doc) return
                                    if (!hasSummaryText(doc)) {
                                        toast.error(t('pages:documentManager.noSummaryAvailable'))
                                        return
                                    }
                                    const text = doc.summary as string
                                    if ('speechSynthesis' in window) {
                                        speechSynthesis.cancel()
                                        const utterance = new SpeechSynthesisUtterance(text)
                                        utterance.lang = selectedLang
                                        utterance.rate = 0.9
                                        utterance.pitch = 1
                                        utterance.onstart = () => { setIsSpeaking(true); setIsPaused(false) }
                                        utterance.onend = () => { setIsSpeaking(false); setIsPaused(false) }
                                        utterance.onerror = () => { setIsSpeaking(false); setIsPaused(false) }
                                        speechSynthesis.speak(utterance)
                                    } else {
                                        toast.error(t('pages:commona.error'))
                                    }
                                }}
                                disabled={!hasSummaryText(audioSummaryDialog.doc)}
                                className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold h-11 px-8 rounded-md shadow-none flex items-center gap-2"
                            >
                                <Play className="h-4 w-4" />
                                {t('pages:documentManager.playSummary')}
                            </Button>
                        ) : (
                            <>
                                {isPaused ? (
                                    <Button
                                        onClick={() => { speechSynthesis.resume(); setIsPaused(false) }}
                                        className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold h-11 px-6 rounded-md shadow-none flex items-center gap-2"
                                    >
                                        <Play className="h-4 w-4" />
                                        {t('pages:documentManager.resume')}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => { speechSynthesis.pause(); setIsPaused(true) }}
                                        variant="outline"
                                        className="border-slate-200 text-[#1a2332] font-bold h-11 px-6 rounded-md shadow-none flex items-center gap-2"
                                    >
                                        <Pause className="h-4 w-4" />
                                        {t('pages:documentManager.pause')}
                                    </Button>
                                )}
                                <Button
                                    onClick={() => {
                                        speechSynthesis.cancel()
                                        setIsSpeaking(false)
                                        setIsPaused(false)
                                    }}
                                    variant="outline"
                                    className="border-[#ef4444] text-[#ef4444] font-bold h-11 px-6 rounded-md shadow-none flex items-center gap-2"
                                >
                                    <Square className="h-4 w-4" />
                                    {t('pages:documentManager.stop')}
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Assign Case Dialog */}
            <Dialog open={assignCaseOpen} onOpenChange={(open) => {
                setAssignCaseOpen(open)
                if (!open) {
                    setSelectedCaseId(null)
                    setAssignCaseQuery('')
                }
            }}>
                <DialogContent className="sm:max-w-[480px] rounded-md border border-slate-200 bg-white shadow-xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-[#1a2332]">{t('pages:documentManager.assignCase', 'Assign to Case')}</DialogTitle>
                        <DialogDescription className="text-[14px] text-[#64748b]">
                            {t('pages:documentManager.assignCaseDescription', 'Select a case to link with the selected documents.')}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-4">
                        <Input 
                            placeholder={t('pages:documentManager.searchCase', 'Search cases...')}
                            value={assignCaseQuery}
                            onChange={(e) => setAssignCaseQuery(e.target.value)}
                            className="mb-4"
                        />

                        <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-2">
                            {isLoadingCases ? (
                                <div className="p-4 text-center text-sm text-slate-500">{t('pages:common.loading', 'Loading...')}</div>
                            ) : cases.length === 0 ? (
                                <div className="p-4 text-center text-sm text-slate-500">{t('pages:common.noResults', 'No cases found.')}</div>
                            ) : (
                                cases.map(c => (
                                    <div 
                                        key={c._id} 
                                        onClick={() => setSelectedCaseId(c._id)}
                                        className={`p-3 rounded-md cursor-pointer border hover:border-slate-400 transition-colors ${selectedCaseId === c._id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                                    >
                                        <div className="font-bold text-[14px] text-slate-800">{c.title || c.case_number || 'Unnamed Case'}</div>
                                        {c.case_number && <div className="text-xs text-slate-500">{c.case_number}</div>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <DialogFooter className="mt-6 flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setAssignCaseOpen(false)}
                            className="border-slate-200 text-[#64748b] font-bold h-10 px-6 rounded-md"
                            disabled={isAssigningCase}
                        >
                            {t('pages:documentManager.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={handleBulkAssignCaseConfirmed}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-md"
                            disabled={isAssigningCase || !selectedCaseId}
                        >
                            {isAssigningCase ? t('pages:common.saving', 'Saving...') : t('pages:documentManager.assignCase', 'Assign Case')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
