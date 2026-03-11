'use client'

import React, { useState, useRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
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
    Search,
    Folder,
    FileText,
    Loader2
} from 'lucide-react'
import { useTranslation } from "@/hooks/useTranslation"
import { uploadDocumentEnhanced } from '@/lib/api/documents-api'
import { toast } from 'sonner'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'

interface ScannedFile {
    id: string;
    name: string;
    size: string;
    lastModified: string;
    location: string;
    file: File;
    selected: boolean;
    status?: 'App' | 'Cloud';
}

interface AddDocumentsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess: () => void;
}

export function AddDocumentsDialog({ isOpen, onClose, onUploadSuccess }: AddDocumentsDialogProps) {
    const { t } = useTranslation()
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState('name')
    const [files, setFiles] = useState<ScannedFile[]>([])
    const [uploadingMode, setUploadingMode] = useState<'cloud' | 'app' | null>(null)
    const [showAppConfirm, setShowAppConfirm] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const user = useSelector((state: RootState) => state.auth.user)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files
        if (!selectedFiles) return

        const newFiles: ScannedFile[] = Array.from(selectedFiles).map((file, index) => {
            // Try to get folder path from webkitRelativePath, fall back to '/'
            const relativePath = (file as any).webkitRelativePath || ''
            const folderPath = relativePath ? relativePath.substring(0, relativePath.lastIndexOf('/')) || '/' : '/'
            return {
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                size: (file.size / 1024).toFixed(0) + 'KB',
                lastModified: new Date(file.lastModified).toLocaleDateString(),
                location: folderPath,
                file: file,
                selected: true
            }
        })

        setFiles(prev => [...prev, ...newFiles])
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        let droppedFiles: File[] = []
        if (e.dataTransfer.items) {
            droppedFiles = Array.from(e.dataTransfer.items)
                .filter(item => item.kind === 'file')
                .map(item => item.getAsFile())
                .filter((file): file is File => file !== null)
        } else {
            droppedFiles = Array.from(e.dataTransfer.files)
        }

        if (droppedFiles.length === 0) return

        const newFiles: ScannedFile[] = droppedFiles.map((file) => {
            const relativePath = (file as any).webkitRelativePath || ''
            const folderPath = relativePath ? relativePath.substring(0, relativePath.lastIndexOf('/')) || '/' : '/'
            return {
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                size: (file.size / 1024).toFixed(0) + 'KB',
                lastModified: new Date(file.lastModified).toLocaleDateString(),
                location: folderPath,
                file: file,
                selected: true
            }
        })

        setFiles(prev => [...prev, ...newFiles])
    }

    const toggleSelect = (id: string) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f))
    }

    const removeSelected = () => {
        setFiles(prev => prev.filter(f => !f.selected))
    }

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }

    const handleUpload = async (mode: 'cloud' | 'app') => {
        const selectedFiles = files.filter(f => f.selected)
        if (selectedFiles.length === 0 || !user?._id) {
            if (!user?._id) toast.error(t('pages:documentManager.addDocumentsDialog.userSessionNotFound'))
            return
        }

        setUploadingMode(mode)
        try {
            for (const fileObj of selectedFiles) {
                const base64 = await fileToBase64(fileObj.file)

                await uploadDocumentEnhanced({
                    userId: user._id as string,
                    fileUrl: "",
                    fileName: fileObj.name,
                    privacy: 'private',
                    processWithAI: true,
                    fileSize: fileObj.file.size,
                    fileType: fileObj.file.type || 'application/pdf',
                    documentType: 'general',
                    storageType: mode === 'cloud' ? 'cloud' : 'app',
                    file_base64: base64
                })
            }
            toast.success(mode === 'cloud'
                ? t('pages:documentManager.addDocumentsDialog.uploadSuccessCloud')
                : t('pages:documentManager.addDocumentsDialog.uploadSuccessApp'))
            onUploadSuccess()
        } catch (error) {
            console.error('Upload failed:', error)
            toast.error(t('pages:documentManager.addDocumentsDialog.uploadFailed'))
        } finally {
            setUploadingMode(null)
        }
    }

    const selectedCount = files.filter(f => f.selected).length

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[1200px] w-[95vw] p-0 overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
                    <div className="bg-white p-6 md:p-8 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                                <DialogTitle className="text-[16px] font-bold text-[#1a2332]">{t('pages:documentManager.addDocumentsDialog.title')}</DialogTitle>
                                <p className="text-[#94a3b8] text-[13px] font-medium">{t('pages:documentManager.addDocumentsDialog.subtitle')}</p>
                            </div>

                            <div className="flex items-center gap-3">
                            <div className="relative w-[280px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder={t('pages:documentManager.search')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-white border border-slate-200 h-10 w-full rounded-md text-[14px] focus-visible:ring-0 shadow-none"
                                />
                            </div>

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="bg-white border border-slate-200 h-10 w-[130px] rounded text-[#1a2332] font-semibold text-[13px] focus:ring-0 shadow-none">
                                    <SelectValue placeholder="Sort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="name">{t('pages:documentManager.addDocumentsDialog.name')}</SelectItem>
                                    <SelectItem value="size">{t('pages:documentManager.addDocumentsDialog.size')}</SelectItem>
                                    <SelectItem value="date">{t('pages:documentManager.addDocumentsDialog.date')}</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-[#1a2332] hover:bg-[#2d3748] text-white flex items-center gap-2 h-10 px-4 rounded-md shadow-none font-bold text-[13px]"
                            >
                                <Folder className="h-4 w-4" />
                                {t('pages:documentManager.addDocumentsDialog.selectFolderToScan')}
                            </Button>
                            <input
                                type="file"
                                multiple
                                /* @ts-ignore - webkitdirectory is non-standard but widely supported */
                                webkitdirectory=""
                                directory=""
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            </div>
                        </div>

                        <div 
                            className={`!mt-6 h-[50vh] min-h-[400px] max-h-[600px] border-2 ${isDragging ? 'border-blue-500 bg-blue-50 border-dashed' : 'border-slate-200 bg-white border-solid'} rounded-lg overflow-hidden flex flex-col transition-colors`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            {files.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center bg-white">
                                    <p className="text-[#1a2332] font-semibold text-[16px] text-center">{t('pages:documentManager.addDocumentsDialog.selectFolderInstructions')}</p>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto">
                                    <div className="p-4 border-b border-slate-200 flex items-center gap-8 text-[13px] font-bold text-[#64748b]">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={selectedCount === files.length} readOnly className="rounded border-slate-300" />
                                            <span>{t('pages:documentManager.addDocumentsDialog.selectedCount', { count: selectedCount })}</span>
                                            <span className="text-[#cbd5e1]">|</span>
                                            <span>{t('pages:documentManager.addDocumentsDialog.duplicates', { count: 0 })}</span>
                                        </div>
                                        <div className="flex-1 text-left ml-4">{t('pages:documentManager.addDocumentsDialog.name')}</div>
                                        <div className="w-[80px] text-left">{t('pages:documentManager.addDocumentsDialog.size')}</div>
                                        <div className="w-[120px] text-left">{t('pages:documentManager.addDocumentsDialog.date')}</div>
                                        <div className="w-[40px] text-center">{t('pages:documentManager.location')}</div>
                                    </div>

                                    <div className="divide-y divide-slate-100">
                                        {files.map(file => (
                                            <div key={file.id} className="p-4 flex items-center gap-8 text-[13px] hover:bg-[#f8fafc] transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={file.selected}
                                                    onChange={() => toggleSelect(file.id)}
                                                    className="rounded border-slate-300 accent-[#1a2332]"
                                                />
                                                <div className="flex-1 flex items-center gap-3 min-w-0">
                                                    <FileText className="h-5 w-5 text-[#64748b] shrink-0" />
                                                    <span className="truncate font-medium text-[#1a2332]">{file.name}</span>
                                                    {file.status === 'App' && <span className="px-2 py-0.5 bg-[#e2e8f0] text-[#64748b] rounded-full text-[10px] font-bold">{t('pages:documentManager.badgeApp')}</span>}
                                                    {file.status === 'Cloud' && <span className="px-2 py-0.5 bg-[#e2e8f0] text-[#64748b] rounded-full text-[10px] font-bold">{t('pages:documentManager.badgeCloud')}</span>}
                                                </div>
                                                <div className="w-[80px] text-[#64748b] font-medium uppercase">{file.size}</div>
                                                <div className="w-[120px] text-[#64748b] font-medium">{file.lastModified}</div>
                                                <div className="w-[40px] flex justify-center">
                                                    <TooltipProvider delayDuration={200}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="cursor-pointer">
                                                                    <Folder className="h-4 w-4 text-[#94a3b8]" />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="bg-[#1a2332] text-white border-0 px-3 py-2 rounded text-[12px] font-medium shadow-lg">
                                                                <div className="flex items-center gap-2">
                                                                    <Folder className="h-3.5 w-3.5 text-[#94a3b8]" />
                                                                    <span>{file.location}</span>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border-t border-slate-100 p-6 flex justify-between items-center">
                        <Button
                            variant="outline"
                            onClick={removeSelected}
                            disabled={selectedCount === 0}
                            className="bg-[#f1f5f9] text-[#94a3b8] border-none hover:bg-[#e2e8f0] hover:text-[#475569] h-[40px] px-6 rounded shadow-none font-semibold text-[13px]"
                        >
                            {t('pages:documentManager.addDocumentsDialog.removeSelected')}
                        </Button>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => handleUpload('cloud')}
                                disabled={selectedCount === 0 || uploadingMode !== null}
                                className="bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#94a3b8] hover:text-[#475569] border-none h-[40px] px-6 rounded shadow-none font-semibold text-[13px] min-w-[160px]"
                            >
                                {uploadingMode === 'cloud' ? <Loader2 className="h-4 w-4 animate-spin" /> : t('pages:documentManager.addDocumentsDialog.linkUploadCloud')}
                            </Button>
                            <Button
                                onClick={() => {
                                    if (selectedCount > 0) setShowAppConfirm(true)
                                }}
                                disabled={selectedCount === 0 || uploadingMode !== null}
                                className="bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#94a3b8] hover:text-[#475569] border-none h-[40px] px-6 rounded shadow-none font-semibold text-[13px] min-w-[120px]"
                            >
                                {t('pages:documentManager.addDocumentsDialog.linkToApp')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirm Link to App Dialog */}
            <Dialog open={showAppConfirm} onOpenChange={setShowAppConfirm}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
                    <div className="p-8 space-y-5">
                        <div className="space-y-2">
                            <DialogTitle className="text-lg font-bold text-[#1a2332]">{t('pages:documentManager.addDocumentsDialog.confirmLinkAppTitle')}</DialogTitle>
                            <div className="text-[14px] text-[#64748b] leading-relaxed space-y-0.5">
                                <p>{t('pages:documentManager.addDocumentsDialog.confirmLinkAppDescription1')}</p>
                                <p>{t('pages:documentManager.addDocumentsDialog.confirmLinkAppDescription2')}</p>
                                <p>{t('pages:documentManager.addDocumentsDialog.confirmLinkAppDescription3')}</p>
                            </div>
                        </div>

                        <div className="max-h-[320px] overflow-y-auto space-y-2">
                            {files.filter(f => f.selected).map(file => (
                                <div
                                    key={file.id}
                                    className="flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-md bg-white hover:bg-[#f8fafc] transition-colors"
                                >
                                    <FileText className="h-5 w-5 text-[#64748b] shrink-0" />
                                    <span className="text-[14px] font-medium text-[#1a2332] truncate">{file.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-slate-200 px-8 py-5 flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowAppConfirm(false)}
                            className="border-slate-200 text-[#1a2332] font-bold h-11 px-6 rounded-md shadow-none"
                        >
                            {t('pages:documentManager.addDocumentsDialog.back')}
                        </Button>
                        <Button
                            onClick={() => {
                                setShowAppConfirm(false)
                                handleUpload('app')
                            }}
                            disabled={uploadingMode !== null}
                            className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold h-11 px-6 rounded-md shadow-none min-w-[140px]"
                        >
                            {uploadingMode === 'app' ? <Loader2 className="h-4 w-4 animate-spin" /> : `${t('pages:documentManager.addDocumentsDialog.linkToApp')} (${selectedCount})`}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

