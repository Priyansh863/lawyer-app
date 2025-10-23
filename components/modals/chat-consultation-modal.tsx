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
  DollarSign
} from "lucide-react";
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

  const { toast } = useToast();
  const profile = useSelector((state: RootState) => state.auth.user);
  const { t } = useTranslation();

  // Reset modal state when opening/closing
  useEffect(() => {
    if (isOpen) {
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
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">
          {t("pages:consultation.selectType") || "Select Consultation Type"}
        </h3>
        <p className="text-gray-500">
          {t("pages:consultation.selectTypeDescription") || "Choose the type of consultation you want to offer"}
        </p>
      </div>

      <div className="grid gap-4">
        {/* Free Consultation Option */}
        <div
          className="p-6 border rounded-lg cursor-pointer transition-colors hover:border-blue-300 hover:bg-blue-50"
          onClick={() => handleConsultationTypeSelect('free')}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-lg">
                {t("pages:consultation.freeConsultation") || "Free Consultation"}
              </h4>
              <p className="text-gray-500 text-sm mt-1">
                {t("pages:consultation.freeConsultationDescription") || "Offer free legal advice to help clients"}
              </p>
            </div>
          </div>
        </div>

        {/* Paid Consultation Option */}
        <div
          className="p-6 border rounded-lg cursor-pointer transition-colors hover:border-blue-300 hover:bg-blue-50"
          onClick={() => handleConsultationTypeSelect('paid')}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-lg">
                {t("pages:consultation.paidConsultation") || "Paid Consultation"}
              </h4>
              <p className="text-gray-500 text-sm mt-1">
                {t("pages:consultation.paidConsultationDescription") || "Provide professional legal services for a fee"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onClose}>
          {t("commonp:cancel") || "Cancel"}
        </Button>
      </div>
    </div>
  );

  const renderUserSelectionStep = () => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={t("pages:consultation.searchUsers") || "Search users..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">{t("pages:consultation.loading") || "Loading users..."}</span>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 
                (t("pages:consultation.noUsersFound") || "No users found matching your search.") :
                (t("pages:consultation.noUsersAvailable") || "No users available for chat.")
              }
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedUser?._id === user._id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleUserSelect(user)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profile_image} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{user.first_name} {user.last_name}</h3>
                      <Badge variant={user.account_type === 'lawyer' ? 'default' : 'secondary'}>
                        {user.account_type === 'lawyer' ? 
                          (t("pages:consultation.lawyer") || "Lawyer") : 
                          (t("pages:consultation.client") || "Client")
                        }
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      {user.pratice_area ? (
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {user.pratice_area}
                        </div>
                      ) : null}
                    </div>
                    {user.chat_rate ? (
                      <div className="text-sm text-green-600 mt-1">
                        {t("pages:consultation.chatRate") || "Chat Rate"}: ${user.chat_rate}/min
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={profile?.account_type === 'lawyer' ? handleBack : onClose}>
          {profile?.account_type === 'lawyer' ? (
            <>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("commonp:back") || "Back"}
            </>
          ) : (
            t("commonp:cancel") || "Cancel"
          )}
        </Button>
        <Button 
          onClick={handleStartChat}
          disabled={!selectedUser || startingChat}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          {startingChat ? 
            (t("pages:consultation.startingChat") || "Starting Chat...") :
            (t("pages:consultation.startChat") || "Start Chat")
          }
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
        {t("commonp:back") || "Back"}
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {currentStep === 'consultationType' 
              ? (t("pages:consultation.selectConsultationType") || "Select Consultation Type")
              : (t("pages:consultation.startChatConsultation") || "Start Chat Consultation")
            }
          </DialogTitle>
        </DialogHeader>

        {currentStep === 'consultationType' && renderConsultationTypeStep()}
        {currentStep === 'userSelection' && renderUserSelectionStep()}
        {currentStep === 'startingChat' && renderStartingChatStep()}
      </DialogContent>
    </Dialog>
  );
}