"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Mic, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDuration, formatDate } from "@/lib/utils"
import { recordVoice, downloadSummary } from "@/lib/api/voice-summary-api"
import type { VoiceRecording } from "@/types/voice-summary"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [isSimulatedPlayback, setIsSimulatedPlayback] = useState(false)

  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Initialize TTS availability for each recording
  useEffect(() => {
    const initialTtsState: Record<string, boolean> = {}
    recordings.forEach((recording) => {
      // Simulate checking if summary is stored locally
      initialTtsState[recording.id] = recording.id !== "rec_3" // Disable TTS for rec_3 to simulate local storage
    })
    setTtsEnabled(initialTtsState)
  }, [recordings])

  // Create audio element on mount
  useEffect(() => {
    // Create a hidden audio element that we'll control programmatically
    const audioElement = document.createElement("audio")
    audioElement.style.display = "none"
    document.body.appendChild(audioElement)
    audioElementRef.current = audioElement

    // Clean up on unmount
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop()
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause()
        document.body.removeChild(audioElementRef.current)
      }
    }
  }, [])

  // Set up audio event listeners
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
        return {
          ...prev,
          [playingId]: 0,
        }
      })
    }

    const handleError = (e: Event) => {
      console.error("Audio playback error:", e)

      // If we have a playing ID, switch to simulated playback
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
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const audioChunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        // Create audio blob
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" })

        // Reset recording state
        setIsRecording(false)
        setRecordingTime(0)

        try {
          // Upload recording and get transcription
          const result = await recordVoice(audioBlob)

          // Add new recording to the list
          setRecordings((prev) => [result, ...prev])

          // Enable TTS for the new recording
          setTtsEnabled((prev) => ({
            ...prev,
            [result.id]: true,
          }))

          toast({
            title: "Recording saved",
            description: "Your voice recording has been saved and transcribed.",
          })
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to save recording",
            variant: "destructive",
          })
        }
      }

      // Start recording
      mediaRecorder.start()
      setIsRecording(true)

      // Start timer
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

      // Stop all tracks in the stream
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())

      // Clear timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }

  const handlePlayRecording = (recording: VoiceRecording) => {
    // If already playing this recording, pause it
    if (playingId === recording.id) {
      if (isSimulatedPlayback) {
        stopSimulatedPlayback()
      } else if (audioElementRef.current) {
        audioElementRef.current.pause()
      }
      setPlayingId(null)
      return
    }

    // If playing another recording, stop it first
    if (playingId) {
      if (isSimulatedPlayback) {
        stopSimulatedPlayback()
      } else if (audioElementRef.current) {
        audioElementRef.current.pause()
      }
      setPlayingId(null)
    }

    // Start playback
    setPlayingId(recording.id)

    // Always use simulated playback for demo purposes
    // In a real app, you would try to play the actual audio first
    startSimulatedPlayback(recording.id)
  }

  const startSimulatedPlayback = (recordingId: string) => {
    // Stop any existing simulation
    stopSimulatedPlayback()

    // Set simulated playback state
    setIsSimulatedPlayback(true)

    // Reset progress
    setPlaybackProgress((prev) => ({
      ...prev,
      [recordingId]: 0,
    }))

    // Simulate a 30-second playback
    let progress = 0
    simulationTimerRef.current = setInterval(() => {
      progress += 0.5

      if (progress > 100) {
        stopSimulatedPlayback()
        setPlayingId(null)
        setPlaybackProgress((prev) => ({
          ...prev,
          [recordingId]: 0,
        }))
        return
      }

      setPlaybackProgress((prev) => ({
        ...prev,
        [recordingId]: progress,
      }))
    }, 150) // Update every 150ms for a total of 30 seconds
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
      // For simulated playback, just update the progress
      setPlaybackProgress((prev) => ({
        ...prev,
        [recordingId]: values[0],
      }))
    } else if (audioElementRef.current && playingId === recordingId) {
      // For real audio playback
      if (
        audioElementRef.current.duration &&
        isFinite(audioElementRef.current.duration) &&
        audioElementRef.current.duration > 0
      ) {
        const newTime = (values[0] / 100) * audioElementRef.current.duration
        if (isFinite(newTime)) {
          audioElementRef.current.currentTime = newTime
        }
      }

      // Also update the progress state
      setPlaybackProgress((prev) => ({
        ...prev,
        [recordingId]: values[0],
      }))
    }
  }

  const handleSkipBackward = () => {
    if (isSimulatedPlayback && playingId) {
      // For simulated playback, just update the progress
      setPlaybackProgress((prev) => {
        const currentProgress = prev[playingId] || 0
        const newProgress = Math.max(0, currentProgress - 10)
        return {
          ...prev,
          [playingId]: newProgress,
        }
      })
    } else if (audioElementRef.current && playingId) {
      // For real audio playback
      if (isFinite(audioElementRef.current.duration) && audioElementRef.current.duration > 0) {
        const newTime = Math.max(0, audioElementRef.current.currentTime - 10)
        audioElementRef.current.currentTime = newTime
      }
    }
  }

  const handleSkipForward = () => {
    if (isSimulatedPlayback && playingId) {
      // For simulated playback, just update the progress
      setPlaybackProgress((prev) => {
        const currentProgress = prev[playingId] || 0
        const newProgress = Math.min(100, currentProgress + 10)
        return {
          ...prev,
          [playingId]: newProgress,
        }
      })
    } else if (audioElementRef.current && playingId) {
      // For real audio playback
      if (isFinite(audioElementRef.current.duration) && audioElementRef.current.duration > 0) {
        const newTime = Math.min(audioElementRef.current.duration, audioElementRef.current.currentTime + 10)
        audioElementRef.current.currentTime = newTime
      }
    }
  }

  const toggleMute = () => {
    if (audioElementRef.current) {
      audioElementRef.current.muted = !isMuted
    }
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
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the summary.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left side - Recording UI */}
      <Card className="p-4 flex flex-col items-center justify-center">
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold mb-2">The quick way to escape from reading text</h2>
          <p className="text-gray-500">Record your voice and get an instant summary</p>
        </div>

        <div className="relative mb-4 -mt-2">
          <div
            className={`w-40 h-40 rounded-full flex items-center justify-center border-4 ${
              isRecording ? "border-red-500 animate-pulse" : "border-gray-200"
            }`}
          >
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

      {/* Right side - Recordings list */}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSkipBackward}
                      disabled={!ttsEnabled[recording.id]}
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={toggleMute} disabled={!ttsEnabled[recording.id]}>
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSkipForward}
                      disabled={!ttsEnabled[recording.id]}
                    >
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

                <div className="flex justify-end mt-2">
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
      </div>
    </div>
  )
}
