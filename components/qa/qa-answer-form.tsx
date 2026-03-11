"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { useTranslation } from "@/hooks/useTranslation"
import { getQAItem, answerQuestion, type QAQuestion } from "@/lib/api/qa-api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Image as ImageIcon, MapPin, Loader2, X, CheckCircle2, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "react-hot-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function QAAnswerForm({
  questionId,
  onClose,
}: {
  questionId: string
  onClose?: () => void
}) {
  const router = useRouter()
  const user = useSelector((state: any) => state.auth.user)
  const [qaItem, setQaItem] = useState<QAQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answer, setAnswer] = useState("")
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [locationName, setLocationName] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isPosted, setIsPosted] = useState(false)
  const [hasAlreadyAnswered, setHasAlreadyAnswered] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  const MAX_CHARS = 500

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true)
        const item = await getQAItem(questionId)
        if (item) {
          setQaItem(item)
          // Pre-load my answer if I've already answered this question
          const myAnswer = item.answer?.find((a: any) =>
            a.lawyer_id === user?._id || a.answeredBy?._id === user?._id
          )
          if (myAnswer) {
            setAnswer(myAnswer.answer)
            setHasAlreadyAnswered(true)
          }
        }
      } catch (err) {
        console.error("Failed to load question:", err)
        toast.error(t('pages:qa.failedToLoadQuestion'))
      } finally {
        setLoading(false)
      }
    }
    fetchQuestion()
  }, [questionId, user?._id])

  const handleImageClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImages(prev => [...prev, reader.result as string].slice(0, 5))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      toast.error(t('pages:qa.geoNotSupported'))
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocationName(`${t('pages:qa.currentLocation')} (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`)
        setIsLocating(false)
        toast.success(t('pages:qa.locationDetected'))
      },
      (error) => {
        setIsLocating(false)
        toast.error(t('pages:qa.failedToGetLocation'))
      }
    )
  }

  const handleCancel = () => {
    if (answer.trim().length > 0 || selectedImages.length > 0 || locationName) {
      setShowDiscardModal(true)
    } else if (onClose) {
      onClose()
    } else {
      router.back()
    }
  }

  const handleSubmit = async () => {
    if (answer.trim().length < 10) {
      toast.error(t('pages:qa.answerMinLength'))
      return
    }

    try {
      setSubmitting(true)
      await answerQuestion(questionId, answer, selectedImages, locationName || undefined)
      setIsPosted(true)
      setTimeout(() => {
        if (onClose) onClose()
        else router.push("/qa")
      }, 3000)
    } catch (err) {
      console.error("Failed to save answer:", err)
      toast.error(t('pages:qa.failedToSubmitAnswer'))
    } finally {
      setSubmitting(false)
    }
  }

  const maskUser = (name: string) => {
    if (!name) return "user***"
    if (name.length <= 3) return name + "***"
    return name.substring(0, 3) + "***"
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString)
        .toLocaleString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .replace(/\. /g, "-")
        .replace(/\. /g, "")
        .replace(/-(\d{2}:\d{2})/, ", $1")
        .replace(/\.$/, "")
    } catch (err) {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-4" />
        <p className="text-slate-500 font-medium">{t('pages:qa.loadingQuestion')}</p>
      </div>
    )
  }

  if (!qaItem) return null

  return (
    <div className="relative">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col h-full">
        {/* Header with question context */}
        <div className="p-8 pb-4 relative">
          <button
            onClick={handleCancel}
            className="absolute right-6 top-6 text-slate-300 hover:text-slate-600 transition-colors z-10"
          >
            <X size={24} />
          </button>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <span className="text-[#1E293B] font-bold text-[15px]">
                {maskUser(qaItem.clientId?.first_name || "user")}
              </span>
            </div>
            <button className="text-slate-300">
              <MoreHorizontal size={24} />
            </button>
          </div>

          <div className="space-y-4 pr-8">
            <p className="text-[#1E293B] text-[16px] leading-relaxed font-medium">
              {qaItem.question}
            </p>

            {/* Images only if they exist */}
            {qaItem.images && qaItem.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 my-4">
                {qaItem.images.map((img, i) => (
                  <div key={i} className="aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                    <img src={img} alt="attachment" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-0.5">
              <span className="text-[#1E293B] font-bold text-[14px]"># {qaItem.category}</span>
              <span className="text-slate-400 text-[12px] font-medium tracking-tight">
                {qaItem.category} / {formatDate(qaItem.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Answer Area */}
        <div className="p-8 pt-4 flex flex-col space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <span className="text-[#1E293B] font-bold text-[15px]">
              {user?.first_name} {user?.last_name}
            </span>
          </div>

          <div className="relative">
            <Textarea
              placeholder={t('pages:qa.answerPlaceholder')}
              value={answer}
              onChange={(e) => setAnswer(e.target.value.slice(0, MAX_CHARS))}
              readOnly={hasAlreadyAnswered}
              className={cn(
                "min-h-[160px] border-none focus-visible:ring-0 p-0 text-[16px] text-[#1E293B] leading-relaxed resize-none scrollbar-hide placeholder:text-slate-300",
                hasAlreadyAnswered && "cursor-default select-none"
              )}
            />
          </div>

          {/* Previews Area */}
          {(selectedImages.length > 0 || locationName) && (
            <div className="flex flex-col gap-4 py-2">
              {locationName && (
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full w-fit border border-slate-100 animate-in fade-in slide-in-from-left-2 duration-300">
                  <MapPin size={14} className="text-blue-500 fill-blue-500/10" />
                  <span className="text-[12px] text-[#1E293B] font-bold">{locationName}</span>
                  <button onClick={() => setLocationName(null)} className="text-slate-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              )}

              {selectedImages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {selectedImages.map((img, idx) => (
                    <div key={idx} className="relative group shrink-0 animate-in zoom-in-95 duration-200">
                      <img src={img} alt="preview" className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-sm" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-white rounded-full shadow-md text-slate-400 hover:text-red-500 border border-slate-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-4">
            <div className="flex items-center gap-6">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept="image/*"
              />
              <button
                onClick={handleImageClick}
                disabled={hasAlreadyAnswered}
                className={cn(
                  "flex items-center gap-1.5 transition-colors font-bold text-[13px]",
                  hasAlreadyAnswered ? "text-slate-300 cursor-default" : "text-slate-400 hover:text-[#1E293B]"
                )}
              >
                <ImageIcon size={20} className="stroke-[1.5px]" />
                {t('pages:qa.addImages')}
              </button>
              <button
                onClick={handleLocationClick}
                disabled={isLocating || hasAlreadyAnswered}
                className={cn(
                  "flex items-center gap-1.5 transition-colors font-bold text-[13px]",
                  (isLocating || hasAlreadyAnswered) ? "text-slate-300 cursor-default opacity-50" : "text-slate-400 hover:text-[#1E293B]"
                )}
              >
                {isLocating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={20} className="stroke-[1.5px]" />}
                {t('pages:qa.location')}
              </button>
            </div>

            <div className="flex items-center gap-6">
              <span
                className={cn(
                  "text-[13px] font-bold",
                  answer.length >= MAX_CHARS ? "text-red-500" : "text-slate-400 font-medium",
                  hasAlreadyAnswered && "opacity-0"
                )}
              >
                {answer.length}/{MAX_CHARS}
              </span>

              <Button
                onClick={handleSubmit}
                disabled={submitting || hasAlreadyAnswered || (answer.trim().length < 10 && !isPosted)}
                className={cn(
                  "bg-[#0F172A] hover:bg-[#1E293B] text-white px-10 rounded-lg font-bold text-[15px] h-12 shadow-sm transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-300",
                  (isPosted || hasAlreadyAnswered) && "bg-slate-100 text-slate-300 cursor-default opacity-100 hover:bg-slate-100"
                )}
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  t('pages:qa.submitAnswer')
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Success Toast Overlay */}
        {isPosted && (
          <div className="fixed bottom-8 right-8 bg-white border border-slate-100 shadow-2xl rounded-xl px-6 py-4 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-500 z-[100]">
            <div className="w-6 h-6 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-[#1E293B] font-bold text-[14px]">{t('pages:qa.postedSuccessfully')}</span>
          </div>
        )}

        {/* Discard Modal */}
        <Dialog open={showDiscardModal} onOpenChange={setShowDiscardModal}>
          <DialogContent className="max-w-[340px] rounded-2xl p-8 gap-6 z-[110]">
            <DialogHeader>
              <DialogTitle className="text-center text-[#1E293B] font-bold text-xl">{t('pages:qa.discardDraftTitle')}</DialogTitle>
              <DialogDescription className="text-center text-slate-500 font-medium">
                {t('pages:qa.discardDraftDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl bg-slate-100 border-none text-[#1E293B] font-bold hover:bg-slate-200"
                onClick={() => {
                  setShowDiscardModal(false)
                  if (onClose) onClose()
                  else router.back()
                }}
              >
                {t('pages:qa.discardDraft')}
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl bg-[#0F172A] text-white font-bold hover:bg-black"
                onClick={() => setShowDiscardModal(false)}
              >
                {t('pages:qa.keepWriting')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
