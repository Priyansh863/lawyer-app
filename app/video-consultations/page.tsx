"use client";

import { useState, useRef, useEffect } from "react";
import ClientLayout from "@/components/layouts/client-layout";
import VideoConsultationTable from "@/components/video-consultations/video-consultation-table";
import ConsultationTypeModal from "@/components/modals/consultation-type-modal";
import { Button } from "@/components/ui/button";
import { Plus, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

export default function VideoConsultationsPage() {
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Check URL parameters to auto-open modal
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('openModal') === 'true') {
        setIsConsultationModalOpen(true);
      }
    }
  }, []);

  const handleConsultationScheduled = () => {
    toast({
      title: t("pages:commonp.success"),
      description: t("pages:consultation.requestSentSuccess"),
    });
    // Trigger a refresh of the consultation table
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <ClientLayout fullWidth>
      <div className="pt-1 pb-4 px-2 max-w-[1700px] mx-auto">
        <div className="flex flex-col space-y-6">
          {/* Header Section */}
          <div className="flex justify-between items-center px-1">
            <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">
              {t("pages:consultation.videoConsultations")}
            </h1>
          </div>

          {/* Consultation Table */}
          <div className="overflow-hidden">
            <VideoConsultationTable
              key={refreshTrigger}
              onNewConsultation={() => setIsConsultationModalOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Consultation Type Modal */}
      <ConsultationTypeModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        onConsultationScheduled={handleConsultationScheduled}
      />
    </ClientLayout>
  );
}