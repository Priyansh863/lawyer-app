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
} from 'lucide-react'
import { useTranslation } from "@/hooks/useTranslation"
import { getDocuments, updateDocumentStorageType, removeFromCloud, deleteDocument, downloadDocument, createFolder, type Document } from '@/lib/api/documents-api'
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

    const filteredDocs = documents.filter(doc =>
        doc.document_name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
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

    // Get storage type badge(s) for a document
    const getStorageBadges = (doc: Document) => {
        const st = doc.storage_type || 'cloud'
        const badges = []

        if (st === 'app' || st === 'app_cloud') {
            badges.push(
                <span key="app" className="px-3.5 py-1 bg-[#22c55e] text-white rounded-full text-[11px] font-extrabold leading-none shadow-sm">{t('pages:documentManager.badgeApp')}</span>
            )
        }
        if (st === 'cloud' || st === 'app_cloud') {
            badges.push(
                <span key="cloud" className="px-3.5 py-1 bg-[#0ea5e9] text-white rounded-full text-[11px] font-extrabold leading-none shadow-sm">{t('pages:documentManager.badgeCloud')}</span>
            )
        }
        // Fallback for old docs without storage_type
        if (badges.length === 0) {
            badges.push(
                <span key="app" className="px-3.5 py-1 bg-[#22c55e] text-white rounded-full text-[11px] font-extrabold leading-none shadow-sm">{t('pages:documentManager.badgeApp')}</span>
            )
        }
        return badges
    }

    // Action handlers
    const handleViewDocument = (doc: Document) => {
        if (doc.link && doc.link !== '#') {
            window.open(doc.link, '_blank')
        } else {
            toast.info(t('pages:documentManager.toastInfoView'))
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
            const newType = doc.storage_type === 'app_cloud' ? 'app' : 'app'
            const res = await updateDocumentStorageType(doc._id, newType)
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
            const newType = doc.storage_type === 'app_cloud' ? 'cloud' : 'cloud'
            const res = await updateDocumentStorageType(doc._id, newType)
            if (res.success) {
                toast.success(t('pages:documentManager.toastRemovedApp'))
                loadDocuments()
            } else {
                toast.error(res.message || t('pages:documentManager.toastRemoveAppFailed'))
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
            <h1 className="text-[22px] font-bold text-[#1e293b] mb-6">{t('pages:documentManager.title')}</h1>

            {/* Action Bar */}
            <div className="flex flex-row items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <input
                        type="checkbox"
                        checked={selectedDocs.size === filteredDocs.length && filteredDocs.length > 0}
                        onChange={toggleSelectAll}
                        className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 transition-colors cursor-pointer"
                    />
                    <span className="text-[15px] font-medium text-[#1e293b]">{t('pages:documentManager.selected')} {selectedDocs.size}</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-[300px]">
                        <Input
                            placeholder={t('pages:documentManager.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border-[#cbd5e1] border focus-visible:ring-1 focus-visible:ring-slate-300 h-[44px] w-full text-[14px] rounded-md px-4 placeholder:text-slate-400"
                        />
                    </div>

                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="bg-white border-[#cbd5e1] border h-[44px] w-[130px] px-4 text-[#1e293b] font-medium text-[14px] rounded-md focus:ring-0 shadow-none">
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
                            <Button variant="outline" className="bg-[#e2e8f0] hover:bg-[#cbd5e1] border-none text-[#1e293b] font-semibold h-[44px] px-6 rounded-md shadow-none text-[14px]">
                                {t('pages:documentManager.generateLink')}
                            </Button>
                        } />
                    )}

                    <Button 
                        variant="outline" 
                        onClick={() => setIsAddFolderOpen(true)}
                        className="bg-[#e2e8f0] hover:bg-[#cbd5e1] border-none text-[#1e293b] font-semibold h-[44px] px-6 rounded-md shadow-none text-[14px]">
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
                    <div className="w-full">
                        {/* Custom Headers */}
                        <div className="grid grid-cols-[60px_1.5fr_1fr_1.2fr_1.2fr_100px_80px] px-6 py-3 bg-[#f1f5f9] border border-[#e2e8f0] rounded-md text-[13px] font-bold text-[#475569] mb-4">
                            <div className="flex items-center">{t('pages:documentManager.name')}</div>
                            <div></div>
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
                                // Logic to detect folders (proxy)
                                const isFolder = !doc.file_size || doc.file_size === 0 || doc.document_name.toLowerCase().includes('files');

                                return (
                                    <div
                                        key={doc._id}
                                        className="grid grid-cols-[60px_1.5fr_1fr_1.2fr_1.2fr_100px_80px] items-center px-6 py-2.5 bg-white border border-[#e2e8f0] rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-[#cbd5e1] transition-all"
                                    >
                                        <div className="flex items-center">
                                            {isFolder ? (
                                                <div className="h-4 w-4 rounded-[3px] border border-slate-200 bg-slate-100 flex items-center justify-center cursor-not-allowed">
                                                    <div className="w-2 h-[2px] bg-slate-300 rounded-full" />
                                                </div>
                                            ) : (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDocs.has(doc._id)}
                                                    onChange={() => toggleSelect(doc._id)}
                                                    className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 transition-colors cursor-pointer"
                                                />
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 pr-4 overflow-hidden">
                                            {isFolder ? (
                                                <Folder className="h-5 w-5 text-amber-500 fill-amber-500" />
                                            ) : (
                                                <FileText className="h-5 w-5 text-slate-400" />
                                            )}
                                            <span className="text-[15px] font-bold text-slate-800 truncate">
                                                {doc.document_name}
                                            </span>
                                        </div>

                                        <div className="text-right pr-8 text-[14px] font-bold text-slate-800">
                                            {!isFolder && formatFileSize(doc.file_size)}
                                        </div>

                                        <div className="text-center text-[14px] font-medium text-slate-500">
                                            {formatLastModified(doc.created_at || doc.createdAt)}
                                        </div>

                                        <div className="flex justify-center gap-2">
                                            {!isFolder && getStorageBadges(doc)}
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
        
                                                            {/* If has cloud, show "Remove from Cloud" */}
                                                            {hasCloud && (
                                                                <DropdownMenuItem
                                                                    onClick={() => setRemoveCloudDialog({ open: true, doc })}
                                                                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#ef4444] cursor-pointer rounded-md hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    {t('pages:documentManager.removeFromCloud')}
                                                                </DropdownMenuItem>
                                                            )}
        
                                                            {/* If has app and cloud, show "Remove from App" */}
                                                            {hasApp && hasCloud && (
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
                )}
            </div>

            {/* Remove from Cloud Confirmation Dialog */}
            <Dialog open={removeCloudDialog.open} onOpenChange={(open) => setRemoveCloudDialog({ open, doc: open ? removeCloudDialog.doc : null })}>
                <DialogContent className="sm:max-w-[420px] rounded-md border border-slate-200 bg-white shadow-xl p-8">
                    <DialogHeader className="text-center space-y-2">
                        <DialogTitle className="text-lg font-bold text-[#1a2332] text-center">{t('pages:documentManager.removeCloudTitle')}</DialogTitle>
                        <DialogDescription className="text-[14px] text-[#64748b] text-center">
                            {t('pages:documentManager.removeCloudDescription')}
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
                            {t('pages:documentManager.removeAppDescription')}
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

            {/* Add Documents Dialog */}
            <AddDocumentsDialog
                isOpen={isAddDocumentsOpen}
                onClose={() => setIsAddDocumentsOpen(false)}
                onUploadSuccess={() => {
                    setIsAddDocumentsOpen(false);
                    loadDocuments();
                }}
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
                                {audioSummaryDialog.doc?.summary || t('pages:documentManager.noSummaryAvailable')}
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
                        {!isSpeaking && !isPaused ? (
                            <Button
                                onClick={() => {
                                    const doc = audioSummaryDialog.doc
                                    if (!doc) return
                                    const text = doc.summary || t('pages:documentManager.noSummaryAvailable')
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
        </div >
    )
}
