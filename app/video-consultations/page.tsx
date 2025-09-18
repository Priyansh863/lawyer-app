"use client";

import { useState, useRef } from "react";
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
      <div className="container mx-auto p-6">
        {/* Header with New Consultation Button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Video className="w-6 h-6 text-primary" />
              {t("pages:consultation.videoConsultations")}
            </h1>
            <p className="text-gray-600 mt-1">
              {t("pages:consultation.manageConsultations")}
            </p>
          </div>
          
          {/* New Consultation Button on the right side */}
          <Button
            onClick={() => setIsConsultationModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("pages:consultation.newConsultation")}
          </Button>
        </div>
        
        <VideoConsultationTable key={refreshTrigger} />
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