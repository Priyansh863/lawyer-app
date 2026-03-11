"use client"

import { useEffect, useState, useCallback } from "react"
import { useSelector } from "react-redux"
import { useTranslation } from "@/hooks/useTranslation"
import { getQAItems, toggleBookmark, type QAQuestion } from "@/lib/api/qa-api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RefreshCw, Bookmark, MessageSquare, MoreHorizontal, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import QAAnswerForm from "./qa-answer-form"
import { cn } from "@/lib/utils"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

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

function QuestionCard({ question, currentUserId, onRefresh, onWriteAnswer }: { question: QAQuestion, currentUserId: string, onRefresh: () => void, onWriteAnswer: () => void }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [isBookmarked, setIsBookmarked] = useState(question.isBookmarked || false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)

  // Sync state with prop updates
  useEffect(() => {
    setIsBookmarked(!!question.isBookmarked)
  }, [question.isBookmarked])

  const myAnswer = question.answer?.find((a: any) =>
    a.lawyer_id === currentUserId ||
    a.answeredBy?._id === currentUserId
  )
  const hasAnswered = !!myAnswer
  const lawyerDisplayName = myAnswer?.answeredBy
    ? `${myAnswer.answeredBy.first_name} ${myAnswer.answeredBy.last_name}`
    : "dasom kim"

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

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 flex flex-col h-full hover:shadow-md transition-all group cursor-pointer"
      onClick={onWriteAnswer}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200" />
          <span className="text-[#1E293B] font-bold text-[15px]">{maskUser(question.clientId?.first_name || 'user')}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-600">
              <MoreHorizontal size={24} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem className="text-sm font-medium">{t('pages:qa.copyLink')}</DropdownMenuItem>
            <DropdownMenuItem className="text-sm font-medium">{t('pages:qa.qrCode')}</DropdownMenuItem>
            <DropdownMenuItem className="text-sm font-medium">{t('pages:qa.notInterested')}</DropdownMenuItem>
            <DropdownMenuItem className="text-sm font-medium text-red-500">{t('pages:qa.report')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col space-y-4">
        <p className="text-[#1E293B] text-[16px] leading-relaxed font-medium line-clamp-3">
          {question.question}
        </p>

        <div className="flex flex-col gap-2">
          <span className="text-[#1E293B] font-bold text-[14px] opacity-60"># {question.category}</span>

          {/* Images only if they exist */}
          {question.images && question.images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 my-2">
              {question.images.map((img, i) => (
                <div key={i} className="aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                  <img src={img} alt="attachment" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <span className="text-slate-400 text-[12px] font-medium tracking-tight">
            {question.category} / {formatDate(question.createdAt)}
          </span>
        </div>
      </div>

      {/* Footer controls only */}
      <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-50">
        <Button
          variant="ghost"
          size="icon"
          className={cn("text-slate-300 hover:text-blue-600 transition-colors", isBookmarked && "text-blue-600 fill-blue-600")}
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
      </div>
    </div>
  )
}

export default function QAListWithSearch() {
  const user = useSelector((state: any) => state.auth.user)
  const [questions, setQuestions] = useState<QAQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'waiting' | 'my' | 'bookmarks'>('waiting')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const { t } = useTranslation()

  const fetchQuestions = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      console.log(`🔍 Fetching questions for tab: ${activeTab}`)
      const questionsData = await getQAItems({
        status: activeTab === 'waiting' ? 'pending' : undefined,
        filter: activeTab === 'my' ? 'my_answers' : activeTab === 'bookmarks' ? 'bookmarks' : undefined,
        category: categoryFilter,
        search: searchTerm
      })
      console.log(`✅ Loaded ${questionsData.length} questions for ${activeTab}:`, questionsData)

      setQuestions(questionsData)
    } catch (err) {
      console.error("Failed to fetch questions:", err)
      toast.error(t('pages:qa.failedToLoadQuestions'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeTab, categoryFilter, searchTerm])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const tabs = [
    { id: 'waiting', label: t('pages:qa.waitingForAnswers') },
    { id: 'my', label: t('pages:qa.myAnswers') },
    { id: 'bookmarks', label: t('pages:qa.bookmarks') }
  ]

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div className="flex items-center border-b border-slate-200 gap-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "pb-4 text-[15px] font-bold transition-all relative",
              activeTab === tab.id ? "text-[#1E293B]" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-[#1E293B] rounded-t-full" />
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
            className="pl-11 h-12 bg-white border-slate-200 rounded-xl focus:ring-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[280px] h-12 bg-white border-slate-200 rounded-xl font-bold text-slate-600">
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
          className="h-12 border-slate-200 px-6 gap-2 rounded-xl bg-white hover:bg-slate-50 text-[#1E293B] font-bold"
          onClick={() => fetchQuestions(true)}
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
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white border border-dashed border-slate-200 rounded-2xl">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Search className="text-slate-300 w-8 h-8" />
            </div>
            <p className="text-slate-400 font-bold tracking-tight">{t('pages:qa.noQuestionsFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {questions.map((q) => (
              <QuestionCard
                key={q._id}
                question={q}
                currentUserId={user?._id}
                onRefresh={fetchQuestions}
                onWriteAnswer={() => setSelectedQuestionId(q._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Answer Modal Overlay */}
      <Dialog open={!!selectedQuestionId} onOpenChange={(open) => !open && setSelectedQuestionId(null)}>
        <DialogContent className="max-w-3xl p-0 bg-transparent border-none shadow-none ring-0 focus-visible:outline-none focus:outline-none [&>button]:hidden">
          {selectedQuestionId && (
            <div className="animate-in zoom-in-95 duration-200">
              <QAAnswerForm
                questionId={selectedQuestionId}
                onClose={() => {
                  setSelectedQuestionId(null)
                  fetchQuestions()
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
