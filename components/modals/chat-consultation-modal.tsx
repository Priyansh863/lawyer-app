"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  Mail,
  Briefcase,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Users,
  DollarSign,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRelatedUsers } from "@/lib/api/users-api";
import { createOrGetChat } from "@/lib/api/simple-chat-api";
import { useToast } from "@/hooks/use-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useTranslation } from "@/hooks/useTranslation";

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  account_type: "client" | "lawyer";
  pratice_area?: string;
  experience?: string;
  is_active: number;
  profile_image?: string;
  chat_rate?: number;
}

interface ConsultationTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsultationScheduled?: (user: User) => void;
  onChatStarted?: (chatId: string, user: User) => void;
}

type ModalStep = 'consultationType' | 'userSelection' | 'startingChat';
type ConsultationType = 'free' | 'paid';

export default function ConsultationTypeModal({
  isOpen,
  onClose,
  onConsultationScheduled,
  onChatStarted,
}: ConsultationTypeModalProps) {
  const [currentStep, setCurrentStep] = useState<ModalStep>('consultationType');
  const [consultationType, setConsultationType] = useState<ConsultationType | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [startingChat, setStartingChat] = useState(false);
  const [useBaseRate, setUseBaseRate] = useState(true);
  const [customRate, setCustomRate] = useState("");
  const [baseChatRate, setBaseChatRate] = useState<number>(0);

  const { toast } = useToast();
  const profile = useSelector((state: RootState) => state.auth.user);
  const { t } = useTranslation();

  // Fetch current chat rate from settings
  const fetchBaseChatRate = async () => {
    try {
      if (!profile?._id) return;

      const userStr = localStorage.getItem("user");
      const token = userStr ? JSON.parse(userStr).token : null;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/charges/charges/${profile._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBaseChatRate(data.user.chat_rate || 0);
      }
    } catch (error) {
      console.error('Error fetching base chat rate:', error);
    }
  };

  // Reset modal state when opening/closing
  useEffect(() => {
    if (isOpen) {
      if (profile?.account_type === 'lawyer') {
        fetchBaseChatRate();
      }
      // For clients, skip consultation type selection and go directly to paid consultation
      if (profile?.account_type === 'client') {
        setConsultationType('paid');
        setCurrentStep('userSelection');
      } else {
        // For lawyers, start with consultation type selection
        setCurrentStep('consultationType');
        setConsultationType(null);
      }
      setSelectedUser(null);
      setSearchQuery("");
      setStartingChat(false);
    }
  }, [isOpen, profile]);

  // Fetch users when modal opens
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getRelatedUsers();
      setUsers(response.users || []);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      toast({
        title: t("pages:consultation.error") || "Error",
        description: error.message || t("pages:consultation.failedToFetchUsers"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentStep === 'userSelection') {
      fetchUsers();
    }
  }, [isOpen, currentStep]);

  // Filter users based on current user type, consultation type, and search query
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Show appropriate user types based on who's logged in and consultation type
    if (profile?.account_type === 'lawyer') {
      // Lawyers can chat with clients for both free and paid consultations
      filtered = filtered.filter(user => user.account_type === 'client');
    } else if (profile?.account_type === 'client') {
      // Clients can only do paid consultations with lawyers
      filtered = filtered.filter(user => user.account_type === 'lawyer');
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        `${user.first_name} ${user.last_name} ${user.email} ${user.pratice_area || ''}`.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [searchQuery, users, profile, consultationType]);

  const handleConsultationTypeSelect = (type: ConsultationType) => {
    setConsultationType(type);
    setCurrentStep('userSelection');
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleStartChat = async () => {
    if (!selectedUser) return;

    try {
      setStartingChat(true);
      setCurrentStep('startingChat');

      // Create or get existing chat
      const chatResponse = await createOrGetChat(selectedUser._id);

      console.log("Chat Response:", chatResponse);

      if (chatResponse?._id) {
        // Call callback with user info (keeping same interface as original)
        if (onConsultationScheduled) {
          onConsultationScheduled(selectedUser);
        }

        // Call callback to open chat modal if provided
        if (onChatStarted) {
          onChatStarted(chatResponse._id, selectedUser);
        }

        // Show success message first
        toast({
          title: t("pages:consultation.success") || "Success",
          description: t("pages:consultation.chatStarted") || `Chat started with ${selectedUser.first_name} ${selectedUser.last_name}`,
        });

        // Reset state and close modal after a short delay to ensure callbacks complete
        setTimeout(() => {
          setStartingChat(false);
          setCurrentStep('userSelection');
          setSelectedUser(null);
          onClose();
        }, 300);
        return;
      } else {
        throw new Error(chatResponse.message || 'Failed to start chat');
      }
    } catch (error: any) {
      console.error("Failed to start chat:", error);
      toast({
        title: t("pages:consultation.error") || "Error",
        description: error.message || t("pages:consultation.failedToStartChat"),
        variant: "destructive",
      });
      setCurrentStep('userSelection');
      setStartingChat(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'startingChat') {
      setCurrentStep('userSelection');
      setSelectedUser(null);
    } else if (currentStep === 'userSelection') {
      // Only show consultation type step for lawyers
      if (profile?.account_type === 'lawyer') {
        setCurrentStep('consultationType');
        setConsultationType(null);
      }
    }
  };

  const renderConsultationTypeStep = () => (
    <div className="space-y-10 py-4 pt-1 px-2">
      <div className="text-left">
        <h3 className="text-[20px] font-bold text-[#0F172A] tracking-tight">
          {t("pages:consultation.selectConsultationType") || "Select Consultation Type"}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Free Consultation Option */}
        <div
          className={cn(
            "p-8 rounded-[12px] cursor-pointer transition-all duration-300 flex flex-col items-center text-center justify-between min-h-[220px] border-2",
            consultationType === 'free' || !consultationType
              ? "bg-[#0F172A] border-[#0F172A] text-white shadow-xl shadow-slate-200"
              : "bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] hover:border-slate-300"
          )}
          onClick={() => setConsultationType('free')}
        >
          <div className="space-y-1">
            <h4 className="font-bold text-[18px]">
              {t("pages:consultation.freeConsultation") || "Free Consultation"}
            </h4>
            <p className={cn(
              "text-[13px] font-medium leading-relaxed",
              consultationType === 'free' || !consultationType ? "text-slate-300" : "text-[#1E293B]"
            )}>
              {t("pages:consultation.freeConsultationDescription") || "Get free legal advice"}
            </p>
          </div>

          <div className="mt-8">
            {consultationType === 'free' || !consultationType ? (
              <div className="h-8 w-8 bg-[#22C55E] rounded-full flex items-center justify-center">
                <Check className="h-5 w-5 text-white stroke-[4]" />
              </div>
            ) : (
              <div className="h-8 w-8 bg-[#CBD5E1] rounded-full" />
            )}
          </div>
        </div>

        {/* Paid Consultation Option */}
        <div
          className={cn(
            "p-8 rounded-[12px] cursor-pointer transition-all duration-300 flex flex-col items-center text-center justify-between min-h-[220px] border-2",
            consultationType === 'paid'
              ? "bg-[#0F172A] border-[#0F172A] text-white shadow-xl shadow-slate-200"
              : "bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] hover:border-slate-300"
          )}
          onClick={() => setConsultationType('paid')}
        >
          <div className="space-y-1">
            <h4 className="font-bold text-[18px]">
              {t("pages:consultation.paidConsultation") || "Paid Consultation"}
            </h4>
            <p className={cn(
              "text-[13px] font-medium leading-relaxed",
              consultationType === 'paid' ? "text-slate-300" : "text-[#1E293B]"
            )}>
              {t("pages:consultation.paidConsultationDescription") || "Expert Legal Services"}
            </p>
          </div>

          <div className="mt-8">
            {consultationType === 'paid' ? (
              <div className="h-8 w-8 bg-[#22C55E] rounded-full flex items-center justify-center">
                <Check className="h-5 w-5 text-white stroke-[4]" />
              </div>
            ) : (
              <div className="h-8 w-8 bg-[#CBD5E1] rounded-full" />
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        {consultationType && (
          <Button
            onClick={() => handleConsultationTypeSelect(consultationType)}
            className="bg-[#0F172A] hover:bg-slate-800 text-white rounded-md px-10 h-12 font-bold transition-all"
          >
            {t("pages:common.continue") || "Continue"}
          </Button>
        )}
      </div>
    </div>
  );

  const renderUserSelectionStep = () => (
    <div className="space-y-4 py-1 px-1 flex flex-col min-h-[580px]">
      <div className="text-left mb-4">
        <h3 className="text-[20px] font-bold text-[#0F172A] tracking-tight">
          {consultationType === 'free'
            ? t("pages:consultation.freeChatConsultation") || 'Free Chat Consultation'
            : t("pages:consultation.paidChatConsultation") || 'Paid Chat Consultation'}
        </h3>
      </div>

      <div className="flex-1 flex flex-col space-y-4">
        {/* Search Field */}
        <div className="relative">
          <Input
            placeholder={t("pages:consultation.searchClient") || "Search Client"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 bg-white border-slate-200 rounded-md focus-visible:ring-0 focus-visible:border-slate-400 placeholder:text-slate-500 font-medium pl-4"
          />
        </div>

        {/* Rate Selection for Paid Consultation */}
        {consultationType === 'paid' && (
          <div className="bg-[#F1F1F1] p-6 rounded-lg border-none space-y-4">
            <div className="flex items-center justify-between group cursor-pointer" onClick={() => setUseBaseRate(true)}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                  useBaseRate ? "bg-[#0F172A] border-[#0F172A]" : "bg-white border-slate-300"
                )}>
                  {useBaseRate && <Check className="h-3 w-3 text-white stroke-[3.5]" />}
                </div>
                <span className="text-[15px] font-bold text-[#0F172A]">{t("pages:consultation.useBaseRate") || "Use Base Rate"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  value={baseChatRate.toString()}
                  disabled
                  className="h-9 w-24 text-center bg-white border-none font-bold text-[#0F172A]"
                />
                <span className="text-[13px] text-[#0F172A] font-bold">{t("pages:consultation.tokensPerMinuteShort") || "tokens/min"}</span>
              </div>
            </div>

            <div className="flex items-center justify-between group cursor-pointer" onClick={() => setUseBaseRate(false)}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                  !useBaseRate ? "bg-[#0F172A] border-[#0F172A]" : "bg-white border-slate-300"
                )}>
                  {!useBaseRate && <Check className="h-3 w-3 text-white stroke-[3.5]" />}
                </div>
                <span className="text-[15px] font-bold text-[#0F172A]">{t("pages:consultation.useCustomRate") || "Use Custom Rate"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  placeholder=""
                  className="h-9 w-24 text-center bg-white border-none font-bold text-[#0F172A]"
                />
                <span className="text-[13px] text-[#0F172A] font-bold">{t("pages:consultation.tokensPerMinuteShort") || "tokens/min"}</span>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#0F172A] mb-3" />
            <p className="text-slate-500 font-medium text-xs">{t("pages:consultation.searchingClients") || "Searching clients..."}</p>
          </div>
        ) : (
          <div className={cn(
            "overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent flex-1",
            consultationType === 'free' ? "max-h-[420px]" : "max-h-[260px]"
          )}>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-10 bg-[#F1F1F1] rounded-xl border border-dashed border-slate-200">
                <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 font-medium text-xs">
                  {searchQuery ? t("pages:consultation.noClientsFound") || "No clients found" : t("pages:consultation.noClientsAvailable") || "No clients available"}
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUser?._id === user._id;
                return (
                  <div
                    key={user._id}
                    className={cn(
                      "p-5 rounded-lg border-2 cursor-pointer transition-all duration-200 flex items-center gap-4",
                      isSelected
                        ? "bg-[#E5E5E5] border-[#0F172A] shadow-sm"
                        : "bg-[#F1F1F1] border-transparent hover:border-slate-200"
                    )}
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center transition-all",
                      isSelected ? "bg-[#22C55E]" : "bg-[#CBD5E1]"
                    )}>
                      {isSelected && <Check className="h-4 w-4 text-white stroke-[4]" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[16px] text-[#0F172A]">
                        {user.first_name || user.email.split('@')[0]} {user.last_name || ''}
                      </h4>
                      <p className="text-[13px] text-[#0F172A] font-bold opacity-80">
                        {user.email}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-6 mt-auto">
        <Button
          variant="outline"
          onClick={handleBack}
          className="bg-[#E5E5E5] border-none text-[#0F172A] font-bold px-10 h-12 rounded-md transition-all hover:bg-slate-300"
        >
          <ArrowLeft className="h-5 w-5 mr-3" />
          {t("pages:consultation.back") || "Back"}
        </Button>
        <Button
          onClick={handleStartChat}
          disabled={!selectedUser || startingChat}
          className="bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-md px-10 h-12 font-bold transition-all disabled:opacity-50"
        >
          {startingChat ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : null}
          {consultationType === 'free'
            ? t("pages:consultation.startFreeChat") || 'Start Free Chat'
            : t("pages:consultation.startPaidChat") || 'Start Paid Chat'}
        </Button>
      </div>
    </div>
  );

  const renderStartingChatStep = () => (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
      <h3 className="text-lg font-medium mb-2">
        {t("pages:consultation.startingChat") || "Starting Chat..."}
      </h3>
      <p className="text-gray-500 text-center">
        {t("pages:consultation.connectingWith") || "Connecting with"} {selectedUser?.first_name} {selectedUser?.last_name}
      </p>
      <Button variant="outline" onClick={handleBack} className="mt-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t("pages:consultation.back")}
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "transition-all duration-300",
        currentStep === 'consultationType' ? "sm:max-w-2xl p-8 outline-none" : "sm:max-w-md"
      )}>
        {(currentStep !== 'consultationType' && currentStep !== 'userSelection') && (
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t("pages:consultation.startChatConsultation") || "Start Chat Consultation"}
            </DialogTitle>
          </DialogHeader>
        )}

        {currentStep === 'consultationType' && renderConsultationTypeStep()}
        {currentStep === 'userSelection' && renderUserSelectionStep()}
        {currentStep === 'startingChat' && renderStartingChatStep()}
      </DialogContent>
    </Dialog>
  );
}