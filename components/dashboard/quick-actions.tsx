"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Camera, Users, MessageSquare, Video, Sparkles, Zap } from "lucide-react";
import ScheduleMeetingModal from "@/components/modals/schedule-meeting-modal";
import SendMessageModal from "@/components/modals/send-message-modal";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

export default function QuickActions() {
  const [isScheduleMeetingOpen, setIsScheduleMeetingOpen] = useState(false);
  const [isSendMessageOpen, setIsSendMessageOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslation();

  const handleMessageSent = () => {
    toast({
      title: t("pages:common.success"),
      description: t("pages:quickActions.messageSentSuccess"),
    });
  };

  const actions = [
    {
      icon: <Camera className="w-5 h-5" />,
      title: t("pages:quickActions.newPost"),
      description: t("pages:quickActions.shareMoment"),
      color: "from-primary/10 to-accent/20",
      iconColor: "text-primary",
      onClick: () => console.log("New post")
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: t("pages:quickActions.sendMessage"),
      description: t("pages:quickActions.startChat"),
      color: "from-blue-100 to-purple-100",
      iconColor: "text-blue-500",
      onClick: () => setIsSendMessageOpen(true)
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: t("pages:quickActions.scheduleMeeting"),
      description: t("pages:quickActions.bookWithClients"),
      color: "from-green-100 to-emerald-100", 
      iconColor: "text-green-500",
      onClick: () => setIsScheduleMeetingOpen(true)
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: t("pages:quickActions.askQuestion"),
      description: t("pages:quickActions.startQA"),
      color: "from-purple-100 to-pink-100",
      iconColor: "text-purple-500", 
      onClick: () => console.log("Open QA form")
    }
  ];

  return (
    <>
      <Card className="card-korean h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/20">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {t("pages:quickActions.title")}
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className={`quick-action-btn w-full h-auto p-4 justify-start gap-4 group border-0 bg-gradient-to-r ${action.color}`}
              onClick={action.onClick}
            >
              <div className={`p-2 rounded-xl bg-white/60 backdrop-blur-sm ${action.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                {action.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                  {action.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {action.description}
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      <ScheduleMeetingModal
        isOpen={isScheduleMeetingOpen}
        onClose={() => setIsScheduleMeetingOpen(false)}
        onSelectUser={handleMessageSent}
      />

      <SendMessageModal
        isOpen={isSendMessageOpen}
        onClose={() => setIsSendMessageOpen(false)}
        onMessageSent={handleMessageSent}
      />
    </>
  );
}