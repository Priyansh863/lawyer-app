"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Search, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import type { DocumentSummary } from "@/types/voice-summary"

interface DocumentSummaryListProps {
  initialSummaries: DocumentSummary[]
}

export default function DocumentSummaryList({ initialSummaries }: DocumentSummaryListProps) {
  const [summaries, setSummaries] = useState<DocumentSummary[]>(initialSummaries)
  const [filteredSummaries, setFilteredSummaries] = useState<DocumentSummary[]>(initialSummaries)
  const [searchQuery, setSearchQuery] = useState("")
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, number>>({})
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isSimulatedPlayback, setIsSimulatedPlayback] = useState(false)

  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

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

  const handlePlaySummary = (summary: DocumentSummary) => {
    // If already playing this summary, pause it
    if (playingId === summary.id) {
      stopSimulatedPlayback()
      setPlayingId(null)
      return
    }

    // If playing another summary, stop it first
    if (playingId) {
      stopSimulatedPlayback()
      setPlayingId(null)
    }

    // Start TTS playback simulation
    setPlayingId(summary.id)
    startSimulatedTTS(summary.id, summary.summary)

    toast({
      title: "TTS Started",
      description: `Playing summary for ${summary.documentName}`,
    })
  }

  const startSimulatedTTS = (summaryId: string, text: string) => {
    // Stop any existing simulation
    stopSimulatedPlayback()

    // Set simulated playback state
    setIsSimulatedPlayback(true)

    // Reset progress
    setPlaybackProgress((prev) => ({
      ...prev,
      [summaryId]: 0,
    }))

    // Simulate TTS playback based on text length
    const estimatedDuration = Math.max(10, text.length / 10) // Rough estimate: 10 chars per second
    let progress = 0
    const updateInterval = 200 // Update every 200ms

    simulationTimerRef.current = setInterval(() => {
      progress += (100 / (estimatedDuration * 1000)) * updateInterval * playbackSpeed

      if (progress > 100) {
        stopSimulatedPlayback()
        setPlayingId(null)
        setPlaybackProgress((prev) => ({
          ...prev,
          [summaryId]: 0,
        }))
        toast({
          title: "TTS Completed",
          description: "Summary playback finished",
        })
        return
      }

      setPlaybackProgress((prev) => ({
        ...prev,
        [summaryId]: progress,
      }))
    }, updateInterval)
  }

  const stopSimulatedPlayback = () => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current)
      simulationTimerRef.current = null
    }
    setIsSimulatedPlayback(false)
  }

  const handleSliderChange = (summaryId: string, values: number[]) => {
    if (playingId === summaryId) {
      setPlaybackProgress((prev) => ({
        ...prev,
        [summaryId]: values[0],
      }))
    }
  }

  const handleSkipBackward = () => {
    if (playingId) {
      setPlaybackProgress((prev) => {
        const currentProgress = prev[playingId] || 0
        const newProgress = Math.max(0, currentProgress - 10)
        return {
          ...prev,
          [playingId]: newProgress,
        }
      })
    }
  }

  const handleSkipForward = () => {
    if (playingId) {
      setPlaybackProgress((prev) => {
        const currentProgress = prev[playingId] || 0
        const newProgress = Math.min(100, currentProgress + 10)
        return {
          ...prev,
          [playingId]: newProgress,
        }
      })
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    toast({
      title: isMuted ? "TTS Unmuted" : "TTS Muted",
      description: isMuted ? "Audio restored" : "Audio muted",
    })
  }

  const changePlaybackSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const currentIndex = speeds.indexOf(playbackSpeed)
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length]
    setPlaybackSpeed(nextSpeed)

    toast({
      title: "Playback Speed Changed",
      description: `Speed set to ${nextSpeed}x`,
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex w-full max-w-sm items-center space-x-2">
            <div className="flex-1 relative">
              <div className="relative">
                <Input
                  placeholder="Search document summaries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#F5F5F5] border-gray-200 pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Summaries List */}
      <div className="space-y-4">
        {filteredSummaries.length === 0 ? (
          <Card className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery ? "No summaries found matching your search." : "No document summaries available."}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Upload documents through AI Assistants to generate summaries for TTS playback.
            </p>
          </Card>
        ) : (
          filteredSummaries.map((summary, index) => (
            <Card key={summary.id} className={`overflow-hidden ${index % 2 === 0 ? "bg-gray-50" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{summary.documentName}</div>
                    {summary.caseTitle && (
                      <div className="text-sm text-blue-600 truncate">Case: {summary.caseTitle}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Generated: {formatDate(summary.createdAt, false)} • {summary.wordCount} words
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full flex-shrink-0"
                    onClick={() => handlePlaySummary(summary)}
                  >
                    {playingId === summary.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>

                {/* TTS Controls */}
                {playingId === summary.id && (
                  <div className="space-y-3 mt-4 p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-8">0:00</span>
                      <Slider
                        value={[playbackProgress[summary.id] || 0]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(values) => handleSliderChange(summary.id, values)}
                        className="flex-1"
                      />
                      <span className="text-xs text-gray-500 w-12">
                        {Math.ceil(((100 - (playbackProgress[summary.id] || 0)) / 100) * (summary.wordCount / 150))}:00
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" onClick={handleSkipBackward}>
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={toggleMute}>
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={changePlaybackSpeed}>
                        {playbackSpeed}x
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleSkipForward}>
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Summary Preview */}
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-700 line-clamp-3">{summary.summary}</div>
                  {summary.summary.length > 200 && (
                    <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-1">
                      Read full summary
                    </Button>
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
