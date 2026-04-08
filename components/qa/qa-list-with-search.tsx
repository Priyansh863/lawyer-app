"use client"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useTranslation } from "@/hooks/useTranslation"
import { getQAItems, toggleBookmark, type QAQuestion } from "@/lib/api/qa-api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RefreshCw, Bookmark, MessageSquare, MoreHorizontal, Loader2, MapPin } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import QAAnswerForm from "./qa-answer-form"
import QAClientView from "./qa-client-view"
import { cn } from "@/lib/utils"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import { toast } from "react-hot-toast"
import QRCode from "qrcode"

const categories = [
  { value: "Civil / Disputes", labelKey: "pages:qa.categories.civilDisputes" },
  { value: "Criminal", labelKey: "pages:qa.categories.criminal" },
  { value: "Family / Divorce", labelKey: "pages:qa.categories.familyDivorce" },
  { value: "Inheritance", labelKey: "pages:qa.categories.inheritance" },
  { value: "Real Estate / Lease", labelKey: "pages:qa.categories.realEstateLease" },
  { value: "Labor / Employment", labelKey: "pages:qa.categories.laborEmployment" },
  { value: "Consumer / Refunds", labelKey: "pages:qa.categories.consumerRefunds" },
  { value: "Defamation / Harassment / Cybercrime", labelKey: "pages:qa.categories.defamationCybercrime" },
  { value: "Stalking / Restraining Orders", labelKey: "pages:qa.categories.stalkingRestraining" },
  { value: "Intellectual Property", labelKey: "pages:qa.categories.intellectualProperty" },
  { value: "Business / Startups", labelKey: "pages:qa.categories.businessStartups" },
  { value: "Administrative", labelKey: "pages:qa.categories.administrative" },
  { value: "Tax", labelKey: "pages:qa.categories.tax" },
  { value: "Privacy / Data", labelKey: "pages:qa.categories.privacyData" },
  { value: "Debt / Rehabilitation / Bankruptcy", labelKey: "pages:qa.categories.debtBankruptcy" },
  { value: "Immigration / Visa", labelKey: "pages:qa.categories.immigrationVisa" },
  { value: "Other", labelKey: "pages:qa.categories.other" }
]

function QuestionCard({
  question,
  currentUserId,
  onWriteAnswer,
  onOpenClientView,
  isLawyer,
  isClient,
  showAnswerPreview,
  onNotInterested,
}: {
  question: QAQuestion
  currentUserId?: string
  onWriteAnswer: () => void
  onOpenClientView: () => void
  isLawyer: boolean
  isClient: boolean
  showAnswerPreview: boolean
  onNotInterested?: (id: string) => void
}) {
  const { t } = useTranslation()
  const [isBookmarked, setIsBookmarked] = useState(question.isBookmarked || false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")

  // Sync state with prop updates
  useEffect(() => {
    setIsBookmarked(!!question.isBookmarked)
  }, [question.isBookmarked])

  const myAnswer = isLawyer
    ? question.answer?.find((a: any) => a.lawyer_id === currentUserId || a.answeredBy?._id === currentUserId)
    : undefined
  const hasAnswered = !!myAnswer
  const firstAnswer = question.answer?.[0]
  const firstAnswerText = firstAnswer?.answer
  const firstAnsweredByName = firstAnswer?.answeredBy
    ? `${firstAnswer.answeredBy.first_name} ${firstAnswer.answeredBy.last_name}`
    : firstAnswer?.lawyer_name

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setBookmarkLoading(true)
      await toggleBookmark(question._id)
      setIsBookmarked(!isBookmarked)
      toast.success(isBookmarked ? t('pages:qa.removedFromBookmarks') : t('pages:qa.bookmarkedSuccessfully'))
    } catch (error) {
      toast.error(t('pages:qa.failedToUpdateBookmark'))
    } finally {
      setBookmarkLoading(false)
    }
  }

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/qa/${question._id}`
    navigator.clipboard.writeText(url)
    toast.success(t('pages:qa.linkCopied') || "Link copied to clipboard")
  }

  const handleQRCode = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const url = `${window.location.origin}/qa/${question._id}`
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#1E293B",
          light: "#FFFFFF"
        }
      })
      setQrCodeUrl(qrDataUrl)
      setShowQRModal(true)
    } catch (err) {
      console.error("Failed to generate QR code:", err)
      toast.error(t('pages:qa.failedToGenerateQR') || "Failed to generate QR code")
    }
  }

  const handleNotInterested = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onNotInterested) {
      onNotInterested(question._id)
      toast.success(t('pages:qa.markedNotInterested') || "Marked as not interested")
    }
  }

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast.success(t('pages:qa.reportedSuccessfully') || "Reported successfully")
  }

  const maskUser = (name: string) => {
    if (!name) return "user***"
    if (name.length <= 3) return name + "***"
    return name.substring(0, 3) + "***"
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) + " — " + new Date(dateString).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })
    } catch (err) {
      return dateString
    }
  }

  const qrCodeDescription = (() => {
    const v1 = t('pages:qa.qrCodeDesc')
    if (v1 && v1 !== 'pages:qa.qrCodeDesc' && v1 !== 'qa.qrCodeDesc' && !v1.includes('qrCodeDesc')) {
      return v1
    }

    const v2 = t('qa.qrCodeDesc')
    if (v2 && v2 !== 'qa.qrCodeDesc' && v2 !== 'pages:qa.qrCodeDesc' && !v2.includes('qrCodeDesc')) {
      return v2
    }

    return "Scan this QR code to view the question on your mobile device."
  })()

  return (
    <div className="relative">
      {/* QR Code Modal - Outside main card clickable area */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent 
          className="max-w-sm rounded-2xl p-8 flex flex-col items-center" 
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-bold text-[#1E293B] dark:text-slate-100 mb-6">{t('pages:qa.qrCode') || "QR Code"}</h3>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6 w-full flex justify-center">
            {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />}
          </div>
          <p className="text-center text-slate-500 text-sm font-medium mb-6">
            {qrCodeDescription}
          </p>
          <Button 
            className="w-full h-12 rounded-xl bg-[#0F172A] text-white font-bold"
            onClick={(e) => {
              e.stopPropagation()
              setShowQRModal(false)
            }}
          >
            {t('common:close') || "Close"}
          </Button>
        </DialogContent>
      </Dialog>

      <div
        className={cn(
          "bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm p-8 flex flex-col h-full transition-all group",
          isLawyer
            ? "hover:shadow-md cursor-pointer"
            : isClient
              ? "cursor-pointer"
              : "cursor-default"
        )}
        onClick={isLawyer ? onWriteAnswer : isClient ? onOpenClientView : undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <span className="text-[#1E293B] dark:text-slate-100 font-bold text-[15px]">{maskUser(question.clientId?.first_name || 'user')}</span>
          </div>
          {isLawyer && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-600">
                  <MoreHorizontal size={24} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem className="text-sm font-medium" onClick={handleCopyLink}>{t('pages:qa.copyLink')}</DropdownMenuItem>
                <DropdownMenuItem className="text-sm font-medium" onClick={handleQRCode}>{t('pages:qa.qrCode')}</DropdownMenuItem>
                <DropdownMenuItem className="text-sm font-medium" onClick={handleNotInterested}>{t('pages:qa.notInterested')}</DropdownMenuItem>
                <DropdownMenuItem className="text-sm font-medium text-red-500" onClick={handleReport}>{t('pages:qa.report')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col space-y-4">
          <p className="text-[#1E293B] dark:text-slate-100 text-[16px] leading-relaxed font-medium line-clamp-3">
            {question.question}
          </p>

          {isClient && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1E293B] dark:text-slate-200 opacity-80">
                {question.answer?.length ? t("pages:qa.status.answered") : t("pages:qa.status.pending")}
              </span>
              {showAnswerPreview && firstAnsweredByName && (
                <span className="text-[11px] text-slate-400 dark:text-slate-300">• {firstAnsweredByName}</span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-[#1E293B] dark:text-slate-200 font-bold text-[14px] opacity-70"># {question.category}</span>

            {(isClient || isLawyer) && showAnswerPreview && (isLawyer ? myAnswer?.answer : firstAnswerText) && (
              <div className="pt-1 text-slate-600 dark:text-slate-200 text-[13px] leading-relaxed line-clamp-4 bg-slate-50/50 dark:bg-slate-800 p-3 rounded-xl border border-slate-50 dark:border-slate-700 mt-1">
                <span className="font-bold text-[#1E293B] dark:text-slate-100 block mb-1 text-[11px] uppercase tracking-wider opacity-70">
                  {isLawyer ? t('pages:qa.myAnswer') || "My Answer" : t('pages:qa.answerPreview') || "Answer Preview"}
                </span>
                {isLawyer ? myAnswer?.answer : firstAnswerText}
              </div>
            )}

            {/* Answer Attachments for Lawyer */}
            {isLawyer && showAnswerPreview && myAnswer && (myAnswer.images?.length || myAnswer.location) && (
              <div className="space-y-3 mt-2">
                {myAnswer.location && (
                  <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50/50 w-fit px-2.5 py-1 rounded-full border border-blue-100/50">
                    <MapPin size={12} className="fill-blue-600/10" />
                    <span className="text-[11px] font-bold">{myAnswer.location}</span>
                  </div>
                )}
                {myAnswer.images && myAnswer.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {myAnswer.images.map((img, i) => (
                    <div key={i} className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                        <img src={img} alt="answer attachment" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Question Images */}
            {question.images && question.images.length > 0 && (
              <div className="space-y-2 mt-2">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider">{t('pages:qa.questionImages') || "Question Attachments"}</span>
                <div className="grid grid-cols-3 gap-3">
                  {question.images.map((img, i) => (
                    <div key={i} className="aspect-square bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                      <img src={img} alt="attachment" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <span className="text-slate-400 dark:text-slate-300 text-[12px] font-medium tracking-tight">
              {question.category} / {formatDate(question.createdAt)}
            </span>
          </div>
        </div>

        {/* Footer controls only */}
        <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-50">
          {isLawyer && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "text-slate-300 hover:text-blue-600 transition-colors",
                  isBookmarked && "text-blue-600 fill-blue-600"
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  handleBookmark(e)
                }}
                disabled={bookmarkLoading}
              >
                <Bookmark className={cn("w-6 h-6", isBookmarked && "fill-current")} />
              </Button>

              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onWriteAnswer()
                }}
                className="bg-[#1E293B] hover:bg-[#0F172A] text-white gap-2 px-6 rounded-xl font-bold text-[13px] h-11 transition-all active:scale-95"
              >
                <MessageSquare size={16} />
                {hasAnswered ? t('pages:qa.checkAnswer') : t('pages:qa.writeAnswer')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function QAListWithSearch() {
  const user = useSelector((state: any) => state.auth.user)
  const accountType = user?.account_type
  const isClient = accountType === "client"
  const isLawyer = accountType === "lawyer"
  const [questions, setQuestions] = useState<QAQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<"waiting" | "my_answers" | "bookmarks" | "my_questions">(
    isClient ? "my_questions" : "waiting"
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<QAQuestion | null>(null)
  const [notInterestedIds, setNotInterestedIds] = useState<string[]>([])
  const { t } = useTranslation()

  // Load not interested IDs from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('qa_not_interested')
    if (saved) {
      try {
        setNotInterestedIds(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse not interested IDs", e)
      }
    }
  }, [])

  // Persist not interested IDs whenever they change
  useEffect(() => {
    if (notInterestedIds.length > 0) {
      localStorage.setItem('qa_not_interested', JSON.stringify(notInterestedIds))
    }
  }, [notInterestedIds])

  const refetchQuestions = async (options?: { setRefreshing?: boolean }) => {
    try {
      if (options?.setRefreshing) setRefreshing(true)
      else setLoading(true)

      const filter =
        isClient
          ? activeTab === "my_questions"
            ? "my_questions"
            : "my_answers"
          : activeTab === "waiting"
            ? "waiting"
            : activeTab === "my_answers"
              ? "my_answers"
              : activeTab === "bookmarks"
                ? "bookmarks"
                : undefined

      const questionsData = await getQAItems({
        filter,
        category: categoryFilter,
        search: searchTerm,
      })

      setQuestions(questionsData)
    } catch (err) {
      console.error("Failed to fetch questions:", err)
      toast.error(t("pages:qa.failedToLoadQuestions"))
    } finally {
      if (options?.setRefreshing) setRefreshing(false)
      else setLoading(false)
    }
  }

  useEffect(() => {
    // Keep tabs consistent when role changes (login/logout), without causing fetch loops.
    const desired = isClient ? "my_questions" : "waiting"
    setActiveTab((prev) => (prev === desired ? prev : desired))
  }, [isClient])

  useEffect(() => {
    refetchQuestions()
  }, [activeTab, categoryFilter, searchTerm, isClient])

  // Client safeguard: if a lawyer has answered, keep the question out of "My Questions"
  // and only show it under "Answers" (when backend filters already do this, this is harmless).
  // Enhanced filtering: Perform local filtering in addition to server filtering as a fallback
  const visibleQuestions = questions
    .filter(q => !notInterestedIds.includes(q._id))
    .filter(q => {
      // Role-specific safeguards
      if (isClient && activeTab === "my_questions") {
        return !(q.answer && q.answer.length > 0)
      }
      return true
    })
    .filter(q => {
      // Local Search Fallback: If search term exists, ensure it matches title, question, or category
      if (!searchTerm.trim()) return true
      const term = searchTerm.toLowerCase()
      const matchesTitle = q.title?.toLowerCase().includes(term)
      const matchesQuestion = q.question?.toLowerCase().includes(term)
      const matchesCategory = q.category?.toLowerCase().includes(term)
      const matchesAnswers = q.answer?.some(a => a.answer.toLowerCase().includes(term))
      const matchesUser = q.clientId?.first_name?.toLowerCase().includes(term) || q.clientId?.last_name?.toLowerCase().includes(term)
      
      return matchesTitle || matchesQuestion || matchesCategory || matchesAnswers || matchesUser
    })
    .filter(q => {
      // Local Category Fallback
      if (categoryFilter === "all") return true
      return q.category === categoryFilter
    })

  const tabs = isClient
    ? [
        { id: 'my_questions', label: t('pages:qa.myQuestions') },
        { id: 'my_answers', label: t('pages:qa.answers') },
      ]
    : [
        { id: 'waiting', label: t('pages:qa.waitingForAnswers') },
        { id: 'my_answers', label: t('pages:qa.myAnswers') },
        { id: 'bookmarks', label: t('pages:qa.bookmarks') },
      ]

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-700 gap-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "pb-4 text-[15px] font-bold transition-all relative",
              activeTab === tab.id ? "text-[#1E293B] dark:text-slate-100" : "text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-100"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-[#1E293B] dark:bg-slate-100 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder={t('pages:qa.search.placeholder')}
            className="pl-11 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[280px] h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-200">
            <SelectValue placeholder={t('pages:qa.selectCategory')} />
          </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              <SelectItem value="all">{t('pages:qa.allCategories')}</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {t(category.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="h-12 border-slate-200 dark:border-slate-700 px-6 gap-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#1E293B] dark:text-slate-100 font-bold"
          onClick={() => refetchQuestions({ setRefreshing: true })}
          disabled={refreshing}
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          {t('pages:qa.refresh')}
        </Button>
      </div>

      {/* Grid of Questions */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-6 h-[260px]">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton circle width={40} height={40} />
                  <Skeleton width={80} height={20} />
                </div>
                <Skeleton count={3} />
                <div className="mt-6 flex justify-between">
                  <Skeleton width={32} height={32} />
                  <Skeleton width={120} height={40} />
                </div>
              </div>
            ))}
          </div>
        ) : visibleQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Search className="text-slate-300 w-8 h-8" />
            </div>
            <p className="text-slate-400 dark:text-slate-300 font-bold tracking-tight">{t('pages:qa.noQuestionsFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleQuestions.map((q) => (
              <QuestionCard
                key={q._id}
                question={q}
                currentUserId={user?._id}
                onWriteAnswer={() => {
                  setSelectedQuestion(null)
                  setSelectedQuestionId(q._id)
                }}
                onOpenClientView={() => {
                  setSelectedQuestion(q)
                  setSelectedQuestionId(q._id)
                }}
                isLawyer={isLawyer}
                isClient={isClient}
                showAnswerPreview={activeTab === "my_answers"}
                onNotInterested={(id) => setNotInterestedIds(prev => [...prev, id])}
              />
            ))}
          </div>
        )}
      </div>

      {/* Answer Modal Overlay */}
      <Dialog
        open={!!selectedQuestionId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedQuestionId(null)
            setSelectedQuestion(null)
            refetchQuestions()
          }
        }}
      >
        <DialogContent
          hideClose
          className="max-w-3xl p-0 bg-transparent border-none shadow-none ring-0 focus-visible:outline-none focus:outline-none"
        >
          {selectedQuestionId && (
            <div className="animate-in zoom-in-95 duration-200">
              {isLawyer ? (
                <QAAnswerForm
                  questionId={selectedQuestionId}
                  onClose={() => {
                    setSelectedQuestionId(null)
                    setSelectedQuestion(null)
                    refetchQuestions({ setRefreshing: true })
                    if (isLawyer) setActiveTab("my_answers")
                  }}
                />
              ) : (
                selectedQuestion ? (
                  <QAClientView
                    question={selectedQuestion}
                    onClose={() => {
                      setSelectedQuestionId(null)
                      setSelectedQuestion(null)
                      refetchQuestions()
                    }}
                  />
                ) : null
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
