"use client";

import { useState, useRef, useEffect } from "react";
import VideoConsultationsLayout from "@/components/layouts/video-consultations-layout";
import VideoConsultationTable from "@/components/video-consultations/video-consultation-table";
import ConsultationTypeModal from "@/components/modals/consultation-type-modal";
import { Button } from "@/components/ui/button";
import { Plus, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

export default function VideoConsultationsPage() {
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
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
    <VideoConsultationsLayout>
      <div className="container mx-auto p-4 sm:p-6 mt-4">
        {/* Header with New Consultation Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Video className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              {t("pages:consultation.videoConsultations")}
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {t("pages:consultation.manageConsultations")}
            </p>
          </div>
          
          {/* New Consultation Button */}
          <Button
            onClick={() => setIsConsultationModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white gap-2 w-full sm:w-auto"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">{t("pages:consultation.newConsultation")}</span>
            <span className="xs:hidden">{t("pages:consultation.new")}</span>
          </Button>
        </div>
        
        {/* Consultation Table */}
        <div className="overflow-hidden">
          <VideoConsultationTable key={refreshTrigger} />
        </div>
      </div>

      {/* Consultation Type Modal */}
      <ConsultationTypeModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        onConsultationScheduled={handleConsultationScheduled}
      />
    </VideoConsultationsLayout>
  );
}