interface VideoConsultation {
  id: string
  clientName: string
  scheduledTime: string
  status: "pending" | "rejected" | "approved"
  transcriptAccess: string
  videoLink?: string
  hasTranscript?: boolean
}

/**
 * Get video consultations
 */
export async function getVideoConsultations(): Promise<VideoConsultation[]> {
  //this would call an API endpoint
  // This is a mock implementation for demonstration

  // Mock data
  const mockConsultations: VideoConsultation[] = [
    {
      id: "1",
      clientName: "John Doe",
      scheduledTime: "2025-03-24T09:30:00Z",
      status: "pending",
      transcriptAccess: "Lorem Ipsum",
      videoLink: "https://meet.example.com/consultation-1",
    },
    {
      id: "2",
      clientName: "John Doe",
      scheduledTime: "2025-03-24T09:30:00Z",
      status: "rejected",
      transcriptAccess: "Lorem Ipsum",
    },
    {
      id: "3",
      clientName: "John Doe",
      scheduledTime: "2025-03-24T09:30:00Z",
      status: "approved",
      transcriptAccess: "Lorem Ipsum",
      videoLink: "https://meet.example.com/consultation-3",
      hasTranscript: true,
    },
    {
      id: "4",
      clientName: "John Doe",
      scheduledTime: "2025-03-24T09:30:00Z",
      status: "approved",
      transcriptAccess: "Lorem Ipsum",
      videoLink: "https://meet.example.com/consultation-4",
      hasTranscript: true,
    },
    {
      id: "5",
      clientName: "John Doe",
      scheduledTime: "2025-03-24T09:30:00Z",
      status: "approved",
      transcriptAccess: "Lorem Ipsum",
    },
    {
      id: "6",
      clientName: "John Doe",
      scheduledTime: "2025-03-24T09:30:00Z",
      status: "approved",
      transcriptAccess: "Lorem Ipsum",
      videoLink: "https://meet.example.com/consultation-6",
    },
  ]

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return mockConsultations
}

/**
 * Schedule a video consultation
 */
export async function scheduleVideoConsultation(data: {
  clientId: string
  scheduledTime: string
}): Promise<VideoConsultation> {
  // this would call an API endpoint
  // This is a mock implementation for demonstration

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Return mock created consultation
  return {
    id: `consultation_${Date.now()}`,
    clientName: "John Doe",
    scheduledTime: data.scheduledTime,
    status: "pending",
    transcriptAccess: "Not available yet",
  }
}

/**
 * Reschedule a video consultation
 */
export async function rescheduleVideoConsultation(
  consultationId: string,
  newScheduledTime: string,
): Promise<VideoConsultation> {
  // this would call an API endpoint
  // This is a mock implementation for demonstration

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Return mock updated consultation
  return {
    id: consultationId,
    clientName: "John Doe",
    scheduledTime: newScheduledTime,
    status: "pending",
    transcriptAccess: "Not available yet",
  }
}

/**
 * Cancel a video consultation
 */
export async function cancelVideoConsultation(consultationId: string): Promise<void> {
  // this would call an API endpoint
  // This is a mock implementation for demonstration

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  //  this would update the consultation in the database
  console.log(`Cancelled consultation: ${consultationId}`)
}
