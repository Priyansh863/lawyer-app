"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Mic, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDuration, formatDate } from "@/lib/utils"
import { recordVoice, downloadSummary } from "@/lib/api/voice-summary-api"
import type { VoiceRecording } from "@/types/voice-summary"
import { Alert, AlertDescription } from "@/components/ui/alert"
import TextToSpeech from "react-text-to-speech"
import { downloadDocumentSummary } from "@/lib/api/documents-api"
import { FileText, Download } from "lucide-react"

interface VoiceSummaryContentProps {
  initialRecordings: VoiceRecording[]
}

export default function VoiceSummaryContent({ initialRecordings }: VoiceSummaryContentProps) {
  const [recordings, setRecordings] = useState<VoiceRecording[]>(initialRecordings)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, number>>({})
  const [isMuted, setIsMuted] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState<Record<string, boolean>>({})
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloadingDocument, setIsDownloadingDocument] = useState(false)
  const [isSimulatedPlayback, setIsSimulatedPlayback] = useState(false)

  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    preloadVoices
    const initialTtsState: Record<string, boolean> = {}
    recordings.forEach((recording) => {
      initialTtsState[recording.id] = recording.id !== "rec_3"
    })
    setTtsEnabled(initialTtsState)
  }, [recordings])

  const preloadVoices = () => {
    return new Promise<void>((resolve) => {
      let voices = speechSynthesis.getVoices()
      if (voices.length !== 0) {
        resolve()
      } else {
        speechSynthesis.onvoiceschanged = () => {
          voices = speechSynthesis.getVoices()
          resolve()
        }
      }
    })
  }

  useEffect(() => {
    const audioElement = document.createElement("audio")
    audioElement.style.display = "none"
    document.body.appendChild(audioElement)
    audioElementRef.current = audioElement

    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop()
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause()
        document.body.removeChild(audioElementRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const audioElement = audioElementRef.current
    if (!audioElement) return

    const handleTimeUpdate = () => {
      if (playingId && audioElement.duration && isFinite(audioElement.duration) && audioElement.duration > 0) {
        const progress = (audioElement.currentTime / audioElement.duration) * 100
        setPlaybackProgress((prev) => ({
          ...prev,
          [playingId]: progress,
        }))
      }
    }

    const handleEnded = () => {
      setPlayingId(null)
      setIsSimulatedPlayback(false)
      setPlaybackProgress((prev) => {
        if (!playingId) return prev
        return { ...prev, [playingId]: 0 }
      })
    }

    const handleError = (e: Event) => {
      console.error("Audio playback error:", e)
      if (playingId) {
        toast({
          title: "Playback error",
          description: "Using simulated playback instead.",
        })
        startSimulatedPlayback(playingId)
      }
    }

    audioElement.addEventListener("timeupdate", handleTimeUpdate)
    audioElement.addEventListener("ended", handleEnded)
    audioElement.addEventListener("error", handleError)

    return () => {
      audioElement.removeEventListener("timeupdate", handleTimeUpdate)
      audioElement.removeEventListener("ended", handleEnded)
      audioElement.removeEventListener("error", handleError)
    }
  }, [playingId, toast])

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const audioChunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" })
        setIsRecording(false)
        setRecordingTime(0)

        try {
          const result = await recordVoice(audioBlob)
          setRecordings((prev) => [result, ...prev])
          setTtsEnabled((prev) => ({ ...prev, [result.id]: true }))

          toast({
            title: "Recording saved",
            description: "Your voice recording has been saved and transcribed.",
          })
        } catch {
          toast({
            title: "Error",
            description: "Failed to save recording",
            variant: "destructive",
          })
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone.",
      })
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record audio.",
        variant: "destructive",
      })
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }

  const handlePlayRecording = (recording: VoiceRecording) => {
    if (playingId === recording.id) {
      if (isSimulatedPlayback) {
        stopSimulatedPlayback()
      } else if (audioElementRef.current) {
        audioElementRef.current.pause()
      }
      setPlayingId(null)
      return
    }

    if (playingId) {
      if (isSimulatedPlayback) {
        stopSimulatedPlayback()
      } else if (audioElementRef.current) {
        audioElementRef.current.pause()
      }
      setPlayingId(null)
    }

    setPlayingId(recording.id)
    startSimulatedPlayback(recording.id)
  }

  const startSimulatedPlayback = (recordingId: string) => {
    stopSimulatedPlayback()
    setIsSimulatedPlayback(true)
    setPlaybackProgress((prev) => ({ ...prev, [recordingId]: 0 }))

    let progress = 0
    simulationTimerRef.current = setInterval(() => {
      progress += 0.5
      if (progress > 100) {
        stopSimulatedPlayback()
        setPlayingId(null)
        setPlaybackProgress((prev) => ({ ...prev, [recordingId]: 0 }))
        return
      }
      setPlaybackProgress((prev) => ({ ...prev, [recordingId]: progress }))
    }, 150)
  }

  const stopSimulatedPlayback = () => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current)
      simulationTimerRef.current = null
    }
    setIsSimulatedPlayback(false)
  }

  const handleSliderChange = (recordingId: string, values: number[]) => {
    if (isSimulatedPlayback && playingId === recordingId) {
      setPlaybackProgress((prev) => ({ ...prev, [recordingId]: values[0] }))
    } else if (audioElementRef.current && playingId === recordingId) {
      if (audioElementRef.current.duration && isFinite(audioElementRef.current.duration) && audioElementRef.current.duration > 0) {
        const newTime = (values[0] / 100) * audioElementRef.current.duration
        if (isFinite(newTime)) audioElementRef.current.currentTime = newTime
      }
      setPlaybackProgress((prev) => ({ ...prev, [recordingId]: values[0] }))
    }
  }

  const handleSkipBackward = () => {
    if (isSimulatedPlayback && playingId) {
      setPlaybackProgress((prev) => {
        const currentProgress = prev[playingId] || 0
        return { ...prev, [playingId]: Math.max(0, currentProgress - 10) }
      })
    } else if (audioElementRef.current && playingId) {
      audioElementRef.current.currentTime = Math.max(0, audioElementRef.current.currentTime - 10)
    }
  }

  const handleSkipForward = () => {
    if (isSimulatedPlayback && playingId) {
      setPlaybackProgress((prev) => {
        const currentProgress = prev[playingId] || 0
        return { ...prev, [playingId]: Math.min(100, currentProgress + 10) }
      })
    } else if (audioElementRef.current && playingId) {
      audioElementRef.current.currentTime = Math.min(audioElementRef.current.duration, audioElementRef.current.currentTime + 10)
    }
  }

  const toggleMute = () => {
    if (audioElementRef.current) audioElementRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleDownloadSummary = async (recordingId: string) => {
    setIsDownloading(true)
    try {
      await downloadSummary(recordingId)
      toast({
        title: "Summary downloaded",
        description: "The summary has been downloaded successfully.",
      })
    } catch {
      toast({
        title: "Download failed",
        description: "Failed to download the summary.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadDocumentSummary = async (documentId: string, documentName: string) => {
    setIsDownloadingDocument(true)
    try {
      await downloadDocumentSummary(documentId, documentName)
      toast({
        title: "Document summary downloaded",
        description: "The document summary has been downloaded as a text file.",
      })
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download document summary.",
        variant: "destructive",
      })
    } finally {
      setIsDownloadingDocument(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left side */}
      <Card className="p-4 flex flex-col items-center justify-center">
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold mb-2">The quick way to escape from reading text</h2>
          <p className="text-gray-500">Record your voice and get an instant summary</p>
        </div>

        <div className="relative mb-4 -mt-2">
          <div className={`w-40 h-40 rounded-full flex items-center justify-center border-4 ${isRecording ? "border-red-500 animate-pulse" : "border-gray-200"}`}>
            <Mic className={`h-16 w-16 ${isRecording ? "text-red-500" : "text-gray-700"}`} />
          </div>
          {isRecording && (
            <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {formatDuration(recordingTime)}
            </div>
          )}
        </div>

        <Button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          className={isRecording ? "bg-red-500 hover:bg-red-600" : "bg-[#0f0921] hover:bg-[#0f0921]/90"}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>
      </Card>

      {/* Right side */}
      <div className="space-y-4">
        {recordings.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-500">No recordings yet. Start recording to see your summaries here.</p>
          </Card>
        ) : (
          recordings.map((recording) => (
            <Card key={recording.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handlePlayRecording(recording)}
                  >
                    {playingId === recording.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <div className="flex-1">
                    <div className="font-medium">{recording.title}</div>
                    <div className="text-xs text-gray-500">
                      By {recording.createdBy} • {formatDate(recording.createdAt, false)}
                    </div>
                  </div>
                  <div className="text-sm">{recording.duration}</div>
                </div>

                <div className="pl-11 mb-2">
                  <Slider
                    value={[playbackProgress[recording.id] || 0]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(values) => handleSliderChange(recording.id, values)}
                    disabled={playingId !== recording.id}
                  />
                </div>

                {playingId === recording.id && (
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Button variant="ghost" size="icon" onClick={handleSkipBackward} disabled={!ttsEnabled[recording.id]}>
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={toggleMute} disabled={!ttsEnabled[recording.id]}>
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleSkipForward} disabled={!ttsEnabled[recording.id]}>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {!ttsEnabled[recording.id] && (
                  <Alert variant="destructive" className="mt-2 py-2">
                    <AlertDescription className="text-xs">
                      TTS playback not available - summary stored locally on lawyer's PC
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end mt-2 gap-2">
                  {ttsEnabled[recording.id] && recording.summary && (
                    <TextToSpeech
                      text={recording.summary}
                      rate={1}
                      pitch={1}
                      volume={1}
                    >
                   
                    </TextToSpeech>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadSummary(recording.id)}
                    disabled={isDownloading}
                  >
                    {isDownloading ? "Downloading..." : "View Summary"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        
        {/* Document Summaries Section */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Document Summaries</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Download AI-generated summaries of your uploaded documents as text files.
            </p>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Download className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 mb-4">
                  Document summaries can be downloaded from the Documents page
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/documents'}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Go to Documents
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
