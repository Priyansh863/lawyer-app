import VideoConsultationsLayout from "@/components/layouts/video-consultations-layout"
import VideoConsultationTable from "@/components/video-consultations/video-consultation-table"

export default function VideoConsultationsPage() {
  return (
    <VideoConsultationsLayout>
      <div className="container mx-auto p-6">
        {/* <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Meeting Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your scheduled meetings, connect to video calls, and track meeting status.
          </p>
        </div> */}
        
        <VideoConsultationTable />
      </div>
    </VideoConsultationsLayout>
  )
}
