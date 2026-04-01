"use client"

import React, { useState, useEffect, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    X,
    FolderOpen,
    Eye,
    PlayCircle,
    MoreHorizontal,
    Upload,
    Loader2,
    Volume2,
    Play,
    Pause,
    Square,
} from "lucide-react"
import type { Case, CaseStatus, CaseType, CourtType } from "@/types/case"
import { caseTypeConfig, courtTypeConfig } from "@/types/case"
import { updateCase, deleteCase, casesApi } from "@/lib/api/cases-api"
const { getCaseById } = casesApi
import { uploadDocumentEnhanced, getCaseDocuments } from "@/lib/api/documents-api"
import { cn } from "@/lib/utils"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { toast } from "sonner"
import { useTranslation } from "@/hooks/useTranslation"
import { uploadUniversalFile } from "@/lib/helpers/fileupload"

interface CaseDetailsDialogProps {
    caseData: Case | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onCaseUpdated?: (updatedCase: Case) => void
    onCaseDeleted?: (caseId: string) => void
}

export default function CaseDetailsDialog({ caseData, open, onOpenChange, onCaseUpdated, onCaseDeleted }: CaseDetailsDialogProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isUploadingDoc, setIsUploadingDoc] = useState(false)
    const [isLoadingDocs, setIsLoadingDocs] = useState(false)
    const [caseDocuments, setCaseDocuments] = useState<any[]>([])
    const docFileInputRef = useRef<HTMLInputElement>(null)
    const user = useSelector((state: RootState) => state.auth.user)
    const { t } = useTranslation()

    // AI Voice Summary states
    const [voiceSummaryDoc, setVoiceSummaryDoc] = useState<any | null>(null)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [selectedLang, setSelectedLang] = useState('en-US')

    const languages = [
        { value: 'en-US', label: 'English' },
        { value: 'ko-KR', label: '한국어' },
        { value: 'ja-JP', label: '日本語' },
        { value: 'zh-CN', label: '中文' },
    ]

    // Editable fields
    const [caseType, setCaseType] = useState<string>('')
    const [courtType, setCourtType] = useState<string>('')
    const [status, setStatus] = useState<string>('')
    const [priority, setPriority] = useState<string>('medium')
    const [estDuration, setEstDuration] = useState<string>('')
    const [notes, setNotes] = useState<string>('')

    // Load full case details from API
    const loadCaseDetails = async (id: string) => {
        try {
            const result = await getCaseById(id)
            if (result.success && result.case) {
                const fullCase = result.case as any
                setCaseType(fullCase.case_type || '')
                setCourtType(fullCase.court_type || fullCase.court_name || '')
                setStatus(fullCase.status || fullCase.case_status || '')
                setPriority(fullCase.priority || fullCase.case_priority || 'medium')
                setEstDuration(fullCase.est_duration || fullCase.expected_duration || '')
                setNotes(fullCase.notes || '')
            }
        } catch (error) {
            console.error('Error loading case details:', error)
        }
    }

    // Load case documents from API
    const loadCaseDocuments = async (id: string) => {
        setIsLoadingDocs(true)
        try {
            const result = await getCaseDocuments(id)
            if (result.success && result.documents) {
                setCaseDocuments(result.documents)
            } else {
                // Fallback to caseData.files
                setCaseDocuments(caseData?.files || [])
            }
        } catch (error) {
            console.error('Error loading case documents:', error)
            setCaseDocuments(caseData?.files || [])
        } finally {
            setIsLoadingDocs(false)
        }
    }

    // Initialize form when caseData changes or dialog opens
    useEffect(() => {
        if (caseData && open) {
            // Extract values with various possible field names from backend
            const rawCase = caseData as any
            
            setCaseType(rawCase.case_type || '')
            setCourtType(rawCase.court_type || rawCase.court_name || '')
            setStatus(rawCase.status || rawCase.case_status || '')
            setPriority(rawCase.priority || rawCase.case_priority || 'medium')
            setEstDuration(rawCase.est_duration || rawCase.expected_duration || '')
            setNotes(rawCase.notes || '')
            setIsEditing(false)
            setShowDeleteConfirm(false)

            // Fetch details and documents from API
            const id = caseData._id || caseData.id
            if (id) {
                loadCaseDetails(id)
                loadCaseDocuments(id)
            } else {
                setCaseDocuments(caseData.files || [])
            }
        }
    }, [caseData, open])

    if (!caseData) return null

    const caseId = caseData._id || caseData.id

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).replace(/\./g, '.').trim();
        } catch (e) {
            return dateString;
        }
    };

    const getStatusColor = (s: string) => {
        if (s === 'in_progress') return 'bg-emerald-500'
        if (s === 'pending') return 'bg-orange-500'
        if (s === 'full_win' || s === 'partial_win') return 'bg-blue-500'
        if (s === 'full_loss' || s === 'partial_loss') return 'bg-red-500'
        return 'bg-slate-400'
    }

    const getPriorityColor = (p: string) => {
        if (p === 'urgent') return 'bg-red-500'
        if (p === 'high') return 'bg-orange-500'
        return 'bg-slate-400'
    }

    const handleSave = async () => {
        if (!caseId) return
        setIsSaving(true)
        try {
            const result = await updateCase(caseId, {
                case_type: caseType as CaseType,
                court_type: courtType as CourtType,
                status: status as CaseStatus,
                priority,
                est_duration: estDuration,
                notes,
            })
            toast.success(t('pages:caseDetails.buttons.caseUpdatedSuccess'))
            setIsEditing(false)
            if (onCaseUpdated && result.case) {
                onCaseUpdated(result.case)
            }
        } catch (error) {
            console.error('Error updating case:', error)
            toast.error(t('pages:caseDetails.buttons.caseUpdateFailed'))
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!caseId) return
        setIsDeleting(true)
        try {
            await deleteCase(caseId)
            toast.success(t('pages:caseDetails.buttons.caseDeletedSuccess'))
            onOpenChange(false)
            if (onCaseDeleted) {
                onCaseDeleted(caseId)
            }
        } catch (error) {
            console.error('Error deleting case:', error)
            toast.error(t('pages:caseDetails.buttons.caseDeleteFailed'))
        } finally {
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    const clientName = caseData.client_id && typeof caseData.client_id === 'object'
        ? `${caseData.client_id.first_name} ${caseData.client_id.last_name || ''}`.trim()
        : 'N/A'
    const clientEmail = (caseData.client_id && typeof caseData.client_id === 'object' && 'email' in caseData.client_id)
        ? (caseData.client_id.email || 'N/A') : 'N/A'
    const clientPhone = (caseData.client_id && typeof caseData.client_id === 'object' && 'phone' in caseData.client_id)
        ? (caseData.client_id.phone || 'N/A') : 'N/A'

    // Handle document upload to case
    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0 || !user?._id) return

        setIsUploadingDoc(true)
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const fileUrl = await uploadUniversalFile(user._id as string, file)

                const result = await uploadDocumentEnhanced({
                    userId: user._id as string,
                    fileUrl: fileUrl,
                    fileName: file.name,
                    privacy: 'private',
                    processWithAI: true,
                    fileSize: file.size,
                    fileType: file.type || 'application/pdf',
                    documentType: 'case_related',
                    caseId: caseId,
                    storageType: 'cloud',
                })

                // Add to local documents list immediately
                if (result.success && result.document) {
                    setCaseDocuments(prev => [...prev, result.document])
                } else {
                    // Add mock entry so user sees it in table
                    setCaseDocuments(prev => [...prev, {
                        document_name: file.name,
                        link: fileUrl,
                        storage_type: 'cloud',
                        privacy: 'private',
                        created_at: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    }])
                }
            }
            toast.success(t('pages:caseDetails.buttons.docUploadSuccess'))
            // Re-fetch documents from API to get full data
            if (caseId) {
                await loadCaseDocuments(caseId)
            }
        } catch (error) {
            console.error('Upload failed:', error)
            toast.error(t('pages:caseDetails.buttons.docUploadFailed'))
        } finally {
            setIsUploadingDoc(false)
            // Reset file input
            if (docFileInputRef.current) docFileInputRef.current.value = ''
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="max-w-[75vw] max-h-[96vh] overflow-y-auto p-0 border-none shadow-2xl left-[56%] translate-x-[-50%]"
                    onInteractOutside={(e) => e.preventDefault()}
                    onPointerDownOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader className="p-6 pb-2 flex flex-row items-center justify-between sticky top-0 bg-white z-10">
                        <DialogTitle className="text-2xl font-bold text-[#0F172A]">{t('pages:caseDetails.Ctitle')}</DialogTitle>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                                <X className="h-6 w-6" />
                            </Button>
                        </DialogClose>
                    </DialogHeader>

                    <div className="p-8 space-y-8">
                        {/* Case Title Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-[#0F172A]">
                                    {t('pages:caseDetails.caseTitle')} : <span className="font-medium text-slate-700">{caseData.title}</span>
                                </h3>
                                {(caseData as any).case_identifier && (
                                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-mono">
                                        {(caseData as any).case_identifier}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
                                {caseData.description || t('pages:caseDetails.noDescription')}
                            </p>
                        </div>

                        {/* Case Information Section */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-[#0F172A]">{t('pages:caseDetails.caseInfo')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-500 font-medium">{t('pages:caseDetails.caseNumber')}</label>
                                    <Input 
                                        value={(caseData as any).case_identifier || caseData.case_number} 
                                        readOnly 
                                        className="bg-[#f8f9fa] border-slate-200 h-10 text-sm font-medium" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-500 font-medium">{t('pages:caseDetails.caseType')}</label>
                                    {isEditing ? (
                                        <Select value={caseType} onValueChange={setCaseType}>
                                            <SelectTrigger className="bg-white border-slate-300 h-10 text-sm font-medium">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(caseTypeConfig).map(([key, val]) => (
                                                    <SelectItem key={key} value={key}>{t(`common:caseTypes.${key}`)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input value={t(`common:caseTypes.${caseType}`) || caseType} readOnly className="bg-[#f8f9fa] border-slate-200 h-10 text-sm font-medium" />
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-500 font-medium">{t('pages:caseDetails.court')}</label>
                                    {isEditing ? (
                                        <Select value={courtType} onValueChange={setCourtType}>
                                            <SelectTrigger className="bg-white border-slate-300 h-10 text-sm font-medium">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(courtTypeConfig).map(([key, val]) => (
                                                    <SelectItem key={key} value={key}>{t(`common:courtTypes.${key}`)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input value={t(`common:courtTypes.${courtType}`) || courtType} readOnly className="bg-[#f8f9fa] border-slate-200 h-10 text-sm font-medium" />
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-500 font-medium">{t('pages:caseDetails.caseStatus')}</label>
                                    {isEditing ? (
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger className="bg-white border-slate-300 h-10 text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("w-2 h-2 rounded-full", getStatusColor(status))} />
                                                    <SelectValue />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">{t('pages:cases.status.pending')}</SelectItem>
                                                <SelectItem value="in_progress">{t('pages:cases.status.inProgress')}</SelectItem>
                                                <SelectItem value="full_win">{t('pages:cases.status.fullWin')}</SelectItem>
                                                <SelectItem value="full_loss">{t('pages:cases.status.fullLoss')}</SelectItem>
                                                <SelectItem value="partial_win">{t('pages:cases.status.partialWin')}</SelectItem>
                                                <SelectItem value="partial_loss">{t('pages:cases.status.partialLoss')}</SelectItem>
                                                <SelectItem value="dismissal">{t('pages:cases.status.dismissal')}</SelectItem>
                                                <SelectItem value="rejection">{t('pages:cases.status.rejection')}</SelectItem>
                                                <SelectItem value="withdrawal">{t('pages:cases.status.withdrawal')}</SelectItem>
                                                <SelectItem value="mediation">{t('pages:cases.status.mediation')}</SelectItem>
                                                <SelectItem value="settlement">{t('pages:cases.status.settlement')}</SelectItem>
                                                <SelectItem value="closure">{t('pages:cases.status.closure')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-[#f8f9fa] border border-slate-200 rounded-md h-10 px-3">
                                            <div className={cn("w-2 h-2 rounded-full", getStatusColor(status))} />
                                            <span className="text-sm font-medium">
                                                {t(`pages:cases.status.${status.replace(/_([a-z])/g, (g) => g[1].toUpperCase())}`) || status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-500 font-medium">{t('pages:caseDetails.priority')}</label>
                                    {isEditing ? (
                                        <Select value={priority} onValueChange={setPriority}>
                                            <SelectTrigger className="bg-white border-slate-300 h-10 text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("w-2 h-2 rounded-full", getPriorityColor(priority))} />
                                                    <SelectValue />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="urgent">{t('pages:casesD.priority.urgent')}</SelectItem>
                                                <SelectItem value="high">{t('pages:casesD.priority.high')}</SelectItem>
                                                <SelectItem value="normal">{t('pages:casesD.priority.medium')}</SelectItem>
                                                <SelectItem value="low">{t('pages:casesD.priority.low')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-[#f8f9fa] border border-slate-200 rounded-md h-10 px-3">
                                            <div className={cn("w-2 h-2 rounded-full", getPriorityColor(priority))} />
                                            <span className="text-sm font-medium">{t(`pages:casesD.priority.${priority}`) || priority}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-500 font-medium">{t('pages:caseDetails.estDuration')}</label>
                                    <Input
                                        value={estDuration}
                                        onChange={(e) => setEstDuration(e.target.value)}
                                        readOnly={!isEditing}
                                        placeholder="e.g. 3 Months"
                                        className={cn(
                                            "h-10 text-sm font-medium border-slate-200",
                                            isEditing ? "bg-white border-slate-300" : "bg-[#f8f9fa]"
                                        )}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs text-slate-500 font-medium">{t('pages:caseDetails.notes')}</label>
                                <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    readOnly={!isEditing}
                                    placeholder={t('pages:caseDetails.notes')}
                                    className={cn(
                                        "min-h-[120px] text-sm resize-none border-slate-200",
                                        isEditing ? "bg-white border-slate-300" : "bg-[#f8f9fa]"
                                    )}
                                />
                            </div>
                        </div>

                        {/* Basic Information Section */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-[#0F172A]">{t('pages:caseDetails.basicInfo')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-500 font-medium">{t('pages:caseDetails.client')}</label>
                                    <Input value={clientName} readOnly className="bg-[#f8f9fa] border-slate-200 h-10 text-sm font-medium" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-500 font-medium">{t('pages:caseDetails.email')}</label>
                                    <Input value={clientEmail} readOnly className="bg-[#f8f9fa] border-slate-200 h-10 text-sm font-medium" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-500 font-medium">{t('pages:caseDetails.contact')}</label>
                                    <Input value={clientPhone} readOnly className="bg-[#f8f9fa] border-slate-200 h-10 text-sm font-medium" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-500 font-medium">{t('pages:caseDetails.createdAt')}</label>
                                    <Input value={formatDate(caseData.created_at || caseData.createdAt)} readOnly className="bg-[#f8f9fa] border-slate-200 h-10 text-sm font-medium" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-500 font-medium">{t('pages:caseDetails.lastUpdated')}</label>
                                    <Input value={formatDate(caseData.updated_at || caseData.updatedAt)} readOnly className="bg-[#f8f9fa] border-slate-200 h-10 text-sm font-medium" />
                                </div>
                            </div>
                        </div>

                        {/* Case Documents Section */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-[#0F172A]">{t('pages:caseDetails.documents')}</h4>
                            <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                                <Table>
                                    <TableHeader className="bg-[#f8f9fa]">
                                        <TableRow className="border-b border-slate-200">
                                            <TableHead className="text-[11px] font-bold text-[#0F172A] py-2">{t('pages:caseDetails.docTable.title')}</TableHead>
                                            <TableHead className="text-[11px] font-bold text-[#0F172A] py-2 text-center">{t('pages:caseDetails.docTable.storedOn')}</TableHead>
                                            <TableHead className="text-[11px] font-bold text-[#0F172A] py-2 text-center">{t('pages:caseDetails.docTable.openFolder')}</TableHead>
                                            <TableHead className="text-[11px] font-bold text-[#0F172A] py-2 text-center">{t('pages:caseDetails.docTable.view')}</TableHead>
                                            <TableHead className="text-[11px] font-bold text-[#0F172A] py-2 text-center">{t('pages:caseDetails.docTable.aiVoiceSummary')}</TableHead>
                                            <TableHead className="text-[11px] font-bold text-[#0F172A] py-2 text-center">{t('pages:caseDetails.docTable.visibility')}</TableHead>
                                            <TableHead className="text-[11px] font-bold text-[#0F172A] py-2 text-center">{t('pages:caseDetails.docTable.lastModified')}</TableHead>
                                            <TableHead className="text-[11px] font-bold text-[#0F172A] py-2 text-center">{t('pages:caseDetails.docTable.actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingDocs ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-10">
                                                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        {t('pages:caseDetails.loadingDocs')}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (!caseDocuments || caseDocuments.length === 0) ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-10 text-xs text-slate-400">
                                                    {t('pages:caseDetails.noDocs')}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            caseDocuments.map((file, idx) => {
                                                const storedOn = file.storage_type || 'cloud'
                                                const isPC = storedOn === 'app' || storedOn === 'app_cloud'
                                                const isCloud = storedOn === 'cloud' || storedOn === 'app_cloud'
                                                return (
                                                    <TableRow key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                                        <TableCell className="text-[11px] font-medium text-[#0F172A] py-2 max-w-[250px] truncate">{file.name || file.document_name || "Untitled Document"}</TableCell>
                                                        <TableCell className="text-center py-2">
                                                            {isPC && <Badge className="bg-emerald-600 hover:bg-emerald-700 text-[9px] h-5 mr-1">{t('pages:documentManager.badgeApp')}</Badge>}
                                                            {isCloud && <Badge className="bg-sky-500 hover:bg-sky-600 text-[9px] h-5">{t('pages:documentManager.badgeCloud')}</Badge>}
                                                        </TableCell>
                                                        <TableCell className="text-center py-2">
                                                            <FolderOpen className="h-4 w-4 mx-auto text-slate-500 cursor-pointer hover:text-slate-700 transition-colors" />
                                                        </TableCell>
                                                        <TableCell className="text-center py-2">
                                                            <Eye className="h-4 w-4 mx-auto text-slate-500 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => {
                                                                const url = file.link || file.url
                                                                if (url) window.open(url, '_blank')
                                                            }} />
                                                        </TableCell>
                                                        <TableCell className="text-center py-2">
                                                            <PlayCircle
                                                                className="h-4 w-4 mx-auto text-slate-500 cursor-pointer hover:text-emerald-600 transition-colors"
                                                                onClick={() => setVoiceSummaryDoc(file)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-center py-2">
                                                            <Badge variant="outline" className={cn(
                                                                "text-[9px] h-5",
                                                                file.privacy === 'public'
                                                                    ? "border-emerald-400 text-emerald-600 bg-emerald-50"
                                                                    : "border-slate-400 text-slate-500"
                                                            )}>
                                                                {file.privacy === 'public' ? t('pages:caseDetails.visibility.public') : file.shared_with?.length ? t('pages:caseDetails.visibility.shared') : t('pages:caseDetails.visibility.private')}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center text-[11px] text-slate-500 py-2">{formatDate(file.updatedAt || file.lastModified || file.created_at)}</TableCell>
                                                        <TableCell className="text-center py-2">
                                                            <DropdownMenu modal={false}>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-44 bg-white border border-slate-200 shadow-lg z-[200]">
                                                                    <DropdownMenuItem className="text-[12px] cursor-pointer">{t('pages:caseDetails.docTable.download')}</DropdownMenuItem>
                                                                    <DropdownMenuItem className="text-[12px] cursor-pointer" onClick={() => setVoiceSummaryDoc(file)}>{t('pages:caseDetails.docTable.summary')}</DropdownMenuItem>
                                                                    <DropdownMenuItem className="text-[12px] cursor-pointer">{t('pages:caseDetails.docTable.removeCloud')}</DropdownMenuItem>
                                                                    <DropdownMenuItem className="text-[12px] cursor-pointer">{t('pages:caseDetails.docTable.disconnectPC')}</DropdownMenuItem>
                                                                    <DropdownMenuItem className="text-[12px] text-red-500 cursor-pointer">{t('pages:caseDetails.docTable.delete')}</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <input
                                type="file"
                                ref={docFileInputRef}
                                className="hidden"
                                multiple
                                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                                onChange={handleDocUpload}
                            />
                            <Button
                                variant="outline"
                                onClick={() => docFileInputRef.current?.click()}
                                disabled={isUploadingDoc}
                                className="w-full border-dashed border-slate-300 bg-slate-50/30 text-slate-500 hover:bg-slate-50 flex items-center gap-2 h-10 rounded-lg transition-colors"
                            >
                                {isUploadingDoc ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> {t('pages:caseDetails.buttons.uploading')}</>
                                ) : (
                                    <><Upload className="h-4 w-4" /> {t('pages:caseDetails.buttons.upload')}</>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-100 flex items-center justify-between sticky bottom-0 bg-white z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        {showDeleteConfirm ? (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-red-600 font-medium">{t('pages:caseDetails.deleteConfirm.areYouSure')}</span>
                                <Button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    variant="destructive"
                                    className="bg-red-600 hover:bg-red-700 px-6 rounded-lg shadow-sm"
                                >
                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('pages:caseDetails.deleteConfirm.yesDelete')}
                                </Button>
                                <Button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    variant="ghost"
                                    className="text-slate-600"
                                >
                                    {t('pages:caseDetails.deleteConfirm.no')}
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={() => setShowDeleteConfirm(true)}
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700 px-8 rounded-lg shadow-sm"
                            >
                                {t('pages:caseDetails.buttons.delete')}
                            </Button>
                        )}
                        <div className="flex gap-3">
                            {isEditing ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            // Reset values
                                            setCaseType(caseData.case_type || '')
                                            setCourtType(caseData.court_type || '')
                                            setStatus(caseData.status || '')
                                            setPriority((caseData as any).priority || 'normal')
                                            setEstDuration((caseData as any).est_duration || '')
                                            setNotes((caseData as any).notes || '')
                                            setIsEditing(false)
                                        }}
                                        className="px-8 rounded-lg text-slate-600 hover:bg-slate-50"
                                    >
                                        {t('pages:caseDetails.buttons.cancel')}
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-8 rounded-lg shadow-sm min-w-[120px]"
                                    >
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('pages:caseDetails.buttons.save')}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="px-8 rounded-lg text-slate-600 hover:bg-slate-50">{t('pages:caseDetails.buttons.cancel')}</Button>
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-8 rounded-lg shadow-sm"
                                    >
                                        {t('pages:caseDetails.buttons.edit')}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* AI Voice Summary Dialog */}
            <Dialog
                open={!!voiceSummaryDoc}
                onOpenChange={(open) => {
                    if (!open) {
                        speechSynthesis.cancel()
                        setIsSpeaking(false)
                        setIsPaused(false)
                        setVoiceSummaryDoc(null)
                    }
                }}
            >
                <DialogContent
                    className="sm:max-w-[520px] p-0 overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl z-[200]"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <div className="p-8 space-y-5">
                        <DialogHeader className="space-y-2">
                            <DialogTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                                <Volume2 className="h-5 w-5 text-[#0ea5e9]" />
                                {t('pages:caseDetails.voiceSummary.title')}
                            </DialogTitle>
                        </DialogHeader>

                        {/* Document Name */}
                        <div className="flex items-center gap-3 p-4 bg-[#f8fafc] rounded-lg border border-slate-100">
                            <Eye className="h-5 w-5 text-[#64748b] shrink-0" />
                            <span className="text-[14px] font-medium text-[#1a2332] truncate">
                                {voiceSummaryDoc?.document_name || voiceSummaryDoc?.name}
                            </span>
                        </div>

                        {/* Summary Text */}
                        <div className="max-h-[200px] overflow-y-auto p-4 bg-[#f8fafc] rounded-lg border border-slate-100">
                            <p className="text-[13px] leading-relaxed text-[#475569]">
                                {voiceSummaryDoc?.summary || t('pages:caseDetails.voiceSummary.noSummary')}
                            </p>
                        </div>

                        {/* Language Selector */}
                        <div className="flex items-center gap-3">
                            <span className="text-[13px] font-medium text-[#64748b]">{t('pages:caseDetails.voiceSummary.language')}:</span>
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
                                    {isPaused ? t('pages:caseDetails.voiceSummary.paused') : t('pages:caseDetails.voiceSummary.playing')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="border-t border-slate-200 px-8 py-5 flex justify-center gap-3">
                        {!isSpeaking && !isPaused ? (
                            <Button
                                onClick={() => {
                                    const text = voiceSummaryDoc?.summary || t('pages:caseDetails.voiceSummary.noSummary')
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
                                {t('pages:caseDetails.voiceSummary.playSummary')}
                            </Button>
                        ) : (
                            <>
                                {isPaused ? (
                                    <Button
                                        onClick={() => { speechSynthesis.resume(); setIsPaused(false) }}
                                        className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold h-11 px-6 rounded-md shadow-none flex items-center gap-2"
                                    >
                                        <Play className="h-4 w-4" />
                                        {t('pages:caseDetails.voiceSummary.resume')}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => { speechSynthesis.pause(); setIsPaused(true) }}
                                        variant="outline"
                                        className="border-slate-200 text-[#1a2332] font-bold h-11 px-6 rounded-md shadow-none flex items-center gap-2"
                                    >
                                        <Pause className="h-4 w-4" />
                                        {t('pages:caseDetails.voiceSummary.paused')}
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
                                    {t('pages:caseDetails.voiceSummary.stop')}
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
