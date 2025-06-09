import VideoConsultationsLayout from "@/components/layouts/video-consultations-layout"
import VideoConsultationsHeader from "@/components/video-consultations/video-consultations-header"
import VideoConsultationTable from "@/components/video-consultations/video-consultation-table"
import { getVideoConsultations } from "@/lib/api/video-consultations-api"

export default async function VideoConsultationsPage() {
  // In a real app, this would use server-side data fetching
  const consultations = await getVideoConsultations()

  return (
    <VideoConsultationsLayout>
      <div className="flex flex-col gap-6">
        <VideoConsultationsHeader />
        <VideoConsultationTable initialConsultations={consultations} />
      </div>
    </VideoConsultationsLayout>
  )
}
