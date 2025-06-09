export interface VoiceRecording {
  id: string
  title: string
  createdBy: string
  createdAt: string
  duration: string
  audioUrl: string
  transcription?: string
  summary?: string
}

export interface DocumentSummary {
  id: string
  documentName: string
  documentId: string
  summary: string
  wordCount: number
  caseTitle?: string
  caseId?: string
  createdAt: string
  uploadedBy: string
  status: "ready" | "processing" | "error"
}

export interface Document {
  id: string
  name: string
  type: string
  size: number
  status: "processed" | "processing" | "failed" | "pending"
  caseTitle?: string
  caseId?: string
  uploadedBy: string
  uploadedAt: string
  url?: string
}

// Schema for voice recording
export const voiceRecordingSchema = {
  title: {
    label: "Title",
    type: "text",
    required: true,
    validation: {
      maxLength: 100,
    },
  },
  audioFile: {
    label: "Audio File",
    type: "file",
    required: true,
    validation: {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ["audio/wav", "audio/mp3", "audio/mpeg", "audio/webm"],
    },
  },
}

// Field mapping for API requests
export const voiceRecordingApiMapping = {
  record: {
    title: "title",
    audioFile: "audio_file",
  },
  transcribe: {
    recordingId: "recording_id",
    language: "language",
  },
}
