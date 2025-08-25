"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Play, Pause, Search, FileText, Loader2, Volume2, Square } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { getDocumentSummaries } from "@/lib/api/voice-summary-api"
import type { DocumentSummary } from "@/types/voice-summary"
import { useTranslation } from "@/hooks/useTranslation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

interface DocumentSummaryListProps {
  initialSummaries: DocumentSummary[]
}

export default function DocumentSummaryList({ initialSummaries }: DocumentSummaryListProps) {
  const [summaries, setSummaries] = useState<DocumentSummary[]>(initialSummaries)
  const [filteredSummaries, setFilteredSummaries] = useState<DocumentSummary[]>(initialSummaries)
  const [searchQuery, setSearchQuery] = useState("")
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedLang, setSelectedLang] = useState("en-US")
  const { toast } = useToast()
  const { t } = useTranslation()

  const languages = [
    { value: "en-US", label: "English" },
    { value: "ko-KR", label: "한국어" },
    { value: "ja-JP", label: "日本語" },
    { value: "zh-CN", label: "中文" }
  ]

  // Fetch documents from backend on component mount
  useEffect(() => {
    const fetchDocuments = async () => {
      if (initialSummaries.length === 0) {
        setIsLoading(true)
        try {
          const fetchedSummaries = await getDocumentSummaries()
          setSummaries(fetchedSummaries)
          setFilteredSummaries(fetchedSummaries)
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to load document summaries",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchDocuments()
  }, [initialSummaries.length, toast])

  // Filter summaries based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSummaries(summaries)
    } else {
      const filtered = summaries.filter(
        (summary) =>
          summary.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          summary.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          summary.caseTitle?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredSummaries(filtered)
    }
  }, [searchQuery, summaries])

  // Handle play/pause summary with multi-language support
  const handlePlaySummary = (summary: DocumentSummary) => {
    if (playingId === summary.id) {
      // If already playing this summary, handle pause/resume/stop
      if (isSpeaking && !isPaused) {
        handlePause()
      } else if (isPaused) {
        handleResume()
      } else {
        handleStop()
      }
      return
    }

    // Start playing new summary
    handleStop() // Stop any current playback
    setPlayingId(summary.id)
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(summary.summary)
      utterance.lang = selectedLang
      utterance.rate = 0.9
      utterance.pitch = 1
      
      utterance.onstart = () => {
        setIsSpeaking(true)
        setIsPaused(false)
      }
      
      utterance.onend = () => {
        setIsSpeaking(false)
        setIsPaused(false)
        setPlayingId(null)
      }
      
      speechSynthesis.speak(utterance)
      
      toast({
        title: "Playing Summary",
        description: `Now playing: ${summary.documentName}`,
      })
    } else {
      toast({
        title: "Error",
        description: "Speech synthesis not supported in this browser.",
        variant: "destructive",
      })
    }
  }

  const handlePause = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause()
      setIsPaused(true)
    }
  }

  const handleResume = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume()
      setIsPaused(false)
    }
  }

  const handleStop = () => {
    speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
    setPlayingId(null)
  }

  // Skeleton loading component
  const SummarySkeleton = () => (
    <Card className="overflow-hidden mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Skeleton width={200} height={24} className="mb-2" />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
              <Skeleton width={120} height={16} />
              <Skeleton width={20} height={16} />
              <Skeleton width={120} height={16} />
              <Skeleton width={20} height={16} />
              <Skeleton width={80} height={16} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton width={80} height={36} />
          </div>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 mb-4">
          <Skeleton count={3} height={16} className="mb-2" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton width={100} height={24} />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Voice Summary Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t("pages:voiceSummary.title")}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t("pages:voiceSummary.description")}</p>
      </div>

      {/* Search Bar and Language Selector */}
      <div className="flex items-center space-x-2 mt-4 md:mt-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
             placeholder={t("pages:voiceSummary.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
         <span className="text-sm font-medium">{t("pages:voiceSummary.languageLabel")}:</span>
          <Select value={selectedLang} onValueChange={setSelectedLang}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Global TTS Controls */}
      {playingId && (
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4" />
            <span className="text-sm">{t("pages:voiceSummary.playingLanguage", {
                lang: languages.find(l => l.value === selectedLang)?.label
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isSpeaking ? (
              <Button size="sm" onClick={() => {
                const summary = summaries.find(s => s.id === playingId)
                if (summary) handlePlaySummary(summary)
              }}>
                <Play className="w-4 h-4 mr-1" /> {t("pages:voiceSummary.play")}
              </Button>
            ) : isPaused ? (
              <Button size="sm" onClick={handleResume}>
                <Play className="w-4 h-4 mr-1" /> {t("pages:voiceSummary.resume")}
              </Button>
            ) : (
              <Button size="sm" onClick={handlePause}>
                <Pause className="w-4 h-4 mr-1" /> {t("pages:voiceSummary.pause")}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleStop}>
              <Square className="w-4 h-4 mr-1" />{t("pages:voiceSummary.stop")}
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <SummarySkeleton key={index} />
          ))}
        </div>
      )}

      {/* Document Summaries List */}
      <div className="relative flex-1 overflow-y-auto pr-2 md:grid md:gap-4 md:overflow-y-visible">
        {filteredSummaries.length === 0 && !isLoading ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
             <p>{t("pages:voiceSummary.noDocumentSummariesFound")}</p>
            </CardContent>
          </Card>
        ) : (
          filteredSummaries.map((summary) => (
            <Card key={summary.id} className="overflow-hidden mb-4">
              <CardContent className="p-6">
               
                <div className="flex items-start justify-between mb-4">
             
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{summary.documentName}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground mb-3">
                      <span>Case: {summary.caseTitle}</span>
                      <span>•</span>
                      <span>Uploaded: {formatDate(summary.createdAt)}</span>
                      <span>•</span>
                      <span>{summary.wordCount} words</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
        
                    <Button
                      variant={playingId === summary.id ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handlePlaySummary(summary)}
                      disabled={summary.status === "Rejected"}
                      title={summary.status === "Rejected" ? "Voice playback not available for rejected documents" : "Play voice summary"}
                    >
                      {playingId === summary.id ? (
                        isPaused ? (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Resume
                          </>
                        ) : isSpeaking ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            {t("pages:voiceSummary.play")}
                          </>
                        )
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          {t("pages:voiceSummary.play")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {/* Summary Text */}
                <div className="bg-muted/30 rounded-lg p-4 mb-4">
                  {summary.status === "Rejected" ? (
                    <p className="text-sm leading-relaxed text-red-600">
                     {t("pages:voiceSummary.rejectedMessage")}
                    </p>
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {summary.summary || `Document status: ${summary.status} - Summary available for voice playback.`}
                    </p>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        summary.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : summary.status === "error"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {summary.status === "Completed" ? t("pages:voiceSummary.statusCompleted") : summary.status === "error" ? t("pages:voiceSummary.statusFailed") : t("pages:voiceSummary.statusProcessing")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}