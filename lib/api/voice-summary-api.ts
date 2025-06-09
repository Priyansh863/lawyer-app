import type { DocumentSummary } from "@/types/voice-summary"

/**
 * Get document summaries for TTS playback
 */
export async function getDocumentSummaries(): Promise<DocumentSummary[]> {
  // this would call an API endpoint
  // This is a mock implementation for demonstration

  const mockSummaries: DocumentSummary[] = [
    {
      id: "sum_1",
      documentName: "Contract_Agreement_2024.pdf",
      documentId: "doc_1",
      summary:
        "This contract agreement outlines the terms and conditions for legal services between the law firm and Acme Corporation. The agreement includes payment terms, scope of work, confidentiality clauses, and termination conditions. Key provisions include a retainer fee of $10,000, hourly billing at $350, and a 30-day notice period for termination.",
      wordCount: 156,
      caseTitle: "Acme Corp vs. Beta Inc.",
      caseId: "case_1",
      createdAt: "2025-02-28T10:30:00Z",
      uploadedBy: "Harold",
      status: "ready",
    },
    {
      id: "sum_2",
      documentName: "Financial_Report_Q4.xlsx",
      documentId: "doc_2",
      summary:
        "The Q4 financial report shows significant revenue growth of 23% compared to the previous quarter. Total revenue reached $2.4 million with operating expenses of $1.8 million. The report highlights strong performance in the corporate law division and recommends expansion of the litigation department.",
      wordCount: 98,
      caseTitle: "Internal Financial Review",
      caseId: "case_2",
      createdAt: "2025-02-28T14:15:00Z",
      uploadedBy: "Sarah",
      status: "ready",
    },
    {
      id: "sum_3",
      documentName: "Witness_Statement_John_Doe.docx",
      documentId: "doc_3",
      summary:
        "Witness statement from John Doe regarding the incident on January 15th. The witness confirms seeing the defendant at the location between 2:00 PM and 3:00 PM. Statement includes detailed timeline of events and corroborates the plaintiff's account of the incident.",
      wordCount: 87,
      caseTitle: "Smith vs. Johnson",
      caseId: "case_3",
      createdAt: "2025-02-27T16:45:00Z",
      uploadedBy: "Michael",
      status: "ready",
    },
    {
      id: "sum_4",
      documentName: "Legal_Precedent_Research.pdf",
      documentId: "doc_4",
      summary:
        "Comprehensive research on legal precedents for intellectual property cases. The document covers 15 relevant cases from the past 5 years, analyzing court decisions and their implications for current litigation strategy. Key findings suggest a 78% success rate for similar cases.",
      wordCount: 203,
      caseTitle: "TechStart IP Dispute",
      caseId: "case_4",
      createdAt: "2025-02-27T11:20:00Z",
      uploadedBy: "Emily",
      status: "ready",
    },
  ]

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return mockSummaries
}

/**
 * Record voice and upload (keeping for backward compatibility)
 */
export async function recordVoice(audioBlob: Blob): Promise<any> {
  // This function is now deprecated but kept for compatibility
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return {
    id: `rec_${Date.now()}`,
    title: "Voice Recording",
    createdBy: "Harold",
    createdAt: new Date().toISOString(),
    duration: "00:30",
    audioUrl: "",
    transcription: "This feature has been moved to document summaries.",
    summary: "Please use the document upload feature instead.",
  }
}

/**
 * Get voice recordings (deprecated)
 */
export async function getVoiceRecordings(): Promise<any[]> {
  return []
}

/**
 * Transcribe a recording (deprecated)
 */
export async function transcribeRecording(recordingId: string): Promise<any> {
  return {
    transcription: "Feature deprecated",
    summary: "Please use document summaries instead",
  }
}

/**
 * Download recording summary
 */
export async function downloadSummary(recordingId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const text = "This is a mock summary for document " + recordingId
  const blob = new Blob([text], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `summary_${recordingId}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Delete a recording (deprecated)
 */
export async function deleteRecording(recordingId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  console.log(`Deleted recording: ${recordingId}`)
}
