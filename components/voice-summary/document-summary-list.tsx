"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Play, Pause, Search, FileText, Loader2, Volume2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { getDocumentSummaries } from "@/lib/api/voice-summary-api"
import type { DocumentSummary } from "@/types/voice-summary"
import { useSpeech } from "react-text-to-speech"

interface DocumentSummaryListProps {
  initialSummaries: DocumentSummary[]
}

export default function DocumentSummaryList({ initialSummaries }: DocumentSummaryListProps) {
  const [summaries, setSummaries] = useState<DocumentSummary[]>(initialSummaries)
  const [filteredSummaries, setFilteredSummaries] = useState<DocumentSummary[]>(initialSummaries)
  const [searchQuery, setSearchQuery] = useState("")
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentSummary, setCurrentSummary] = useState<DocumentSummary | null>(null)

  const { toast } = useToast()

  // Initialize TTS for the current summary
  const {
    Text,
    speechStatus,
    isInQueue,
    start: startSpeech,
    pause: pauseSpeech,
    stop: stopSpeech,
  } = useSpeech({
    text: currentSummary?.summary || '',
    volume: 0.8,
    rate: 1.0,
    pitch: 1.0,
    lang: 'en-US'
  })

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

  // Handle play/pause summary
  const handlePlaySummary = (summary: DocumentSummary) => {
    if (playingId === summary.id) {
      // If already playing this summary, pause it
      if (speechStatus === 'started') {
        pauseSpeech()
      } else {
        stopSpeech()
        setPlayingId(null)
        setCurrentSummary(null)
      }
      return
    }

    // Start playing new summary
    setPlayingId(summary.id)
    setCurrentSummary(summary)
    
    // Start speech after setting the summary
    setTimeout(() => {
      startSpeech()
    }, 100)
    
    toast({
      title: "Playing Summary",
      description: `Now playing: ${summary.documentName}`,
    })
  }

  // Stop all playback
  const stopPlayback = () => {
    stopSpeech()
    setPlayingId(null)
    setCurrentSummary(null)
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search document summaries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading document summaries...</span>
        </div>
      )}

      {/* Document Summaries List */}
      <div className="grid gap-4">
        {filteredSummaries.length === 0 && !isLoading ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No document summaries found</p>
            </CardContent>
          </Card>
        ) : (
          filteredSummaries.map((summary) => (
            <Card key={summary.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{summary.documentName}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                      <span>Case: {summary.caseTitle}</span>
                      <span>•</span>
                      <span>Uploaded: {formatDate(summary.createdAt)}</span>
                      <span>•</span>
                      <span>By: {summary.uploadedBy}</span>
                      <span>•</span>
                      <span>{summary.wordCount} words</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={playingId === summary.id ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handlePlaySummary(summary)}
                      disabled={summary.status !== 'ready'}
                    >
                      {playingId === summary.id ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Play
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Summary Text */}
                <div className="bg-muted/30 rounded-lg p-4 mb-4">
                  <p className="text-sm leading-relaxed">{summary.summary}</p>
                </div>

                {/* TTS Element (hidden but functional) */}
                {playingId === summary.id && currentSummary && (
                  <div className="hidden">
                    <Text />
                  </div>
                )}

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        summary.status === 'ready'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {summary.status === 'ready' ? 'Ready' : 'Processing'}
                    </span>
                  </div>
                  
                  {playingId === summary.id && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Volume2 className="h-4 w-4" />
                      <span>Playing audio...</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={stopPlayback}
                        className="text-xs"
                      >
                        Stop
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
