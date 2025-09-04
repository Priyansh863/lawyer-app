"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Camera, Users, MessageSquare, Video, Sparkles, Zap } from "lucide-react";
import ScheduleMeetingModal from "@/components/modals/schedule-meeting-modal";
import ChatUserModal from "@/components/modals/chat-user-modal";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function QuickActions() {
  const [isScheduleMeetingOpen, setIsScheduleMeetingOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleUserSelect = (user: any) => {
    toast({
      title: "Meeting Scheduled",
      description: `Meeting request sent to ${user.first_name} ${user.last_name}`,
    });
    // Navigate to video consultations to see the scheduled meeting
    router.push('/video-consultations');
  };

  const actions = [
    {
      icon: <Camera className="w-5 h-5" />,
      title: "New Post",
      description: "Share your moment",
      color: "from-primary/10 to-accent/20",
      iconColor: "text-primary",
      onClick: () => console.log("New post")
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Send Message",
      description: "Start a new chat",
      color: "from-blue-100 to-purple-100",
      iconColor: "text-blue-500",
      onClick: () => setIsChatModalOpen(true)
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "Schedule Meeting",
      description: "Book with clients/lawyers",
      color: "from-green-100 to-emerald-100", 
      iconColor: "text-green-500",
      onClick: () => setIsScheduleMeetingOpen(true)
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Create Story",
      description: "Share your day",
      color: "from-purple-100 to-pink-100",
      iconColor: "text-purple-500", 
      onClick: () => console.log("Create story")
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
              Quick Actions
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
        onSelectUser={handleUserSelect}
      />

      <ChatUserModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
      />
    </>
  );
}