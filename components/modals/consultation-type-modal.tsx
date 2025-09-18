"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  User, 
  Mail, 
  Briefcase, 
  Clock, 
  ArrowLeft, 
  Send, 
  Video, 
  Coins,
  DollarSign,
  Users,
  MessageSquare
} from "lucide-react";
import { getRelatedUsers } from "@/lib/api/users-api";
import { createMeeting } from "@/lib/api/meeting-api";
import { notificationsApi } from "@/lib/api/notifications-api";
import { useToast } from "@/hooks/use-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useTranslation } from "@/hooks/useTranslation";
import axios from "axios";

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
  charges?: number;
  video_rate?: number;
  chat_rate?: number;
}

interface ConsultationTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsultationScheduled?: (user: User) => void;
}

type ModalStep = 'consultationType' | 'userSelection' | 'sendLink';
type ConsultationType = 'free' | 'paid';

export default function ConsultationTypeModal({
  isOpen,
  onClose,
  onConsultationScheduled,
}: ConsultationTypeModalProps) {
  const [currentStep, setCurrentStep] = useState<ModalStep>('consultationType');
  const [consultationType, setConsultationType] = useState<ConsultationType | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [consultationLink, setConsultationLink] = useState("");
  const [sending, setSending] = useState(false);
  const [freshUserProfile, setFreshUserProfile] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const { toast } = useToast();
  const profile = useSelector((state: RootState) => state.auth.user);
  const { t } = useTranslation();

  // Use fresh profile data if available, otherwise fallback to Redux profile
  const currentProfile = freshUserProfile || profile;

  const fetchFreshUserProfile = async () => {
    if (!profile?._id) return;
    
    try {
      setLoadingProfile(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/charges/charges/${profile._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.user) {
        setFreshUserProfile(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching fresh profile:', error);
      // Don't show error toast, just use existing profile data
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getRelatedUsers();
      
      if (response.success) {
        setUsers(response.users);
        setFilteredUsers(response.users);
      }
    } catch (error: any) {
      toast({
        title: t("pages:commonp.error"),
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

  // Fetch fresh profile data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchFreshUserProfile();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter((user: User) => 
        `${user.first_name} ${user.last_name} ${user.email}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleConsultationTypeSelect = (type: ConsultationType) => {
    setConsultationType(type);
    setCurrentStep('userSelection');
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setCurrentStep('sendLink');
    
    // Generate a consultation link
    const meetingId = Math.random().toString(36).substring(2, 15);
    setConsultationLink(`https://meet.google.com/consultation-${meetingId}`);
  };

  const handleSendConsultationLink = async () => {
    if (!selectedUser || !consultationLink) {
      toast({
        title: t("pages:consultation.missingInformation"),
        description: t("pages:consultation.pleaseProvideLink"),
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      
      // Get the lawyer's video rate
      const lawyerProfile = currentProfile?.account_type === 'lawyer' ? currentProfile : selectedUser;
      const videoRate = consultationType === 'paid' ? (lawyerProfile?.video_rate || lawyerProfile?.charges || 0) : 0;
      
      const meetingData = {
        lawyerId: currentProfile?.account_type === 'lawyer' ? currentProfile._id : selectedUser._id,
        clientId: currentProfile?.account_type === 'client' ? currentProfile._id : selectedUser._id,
        meeting_title: `${consultationType === 'free' ? t("pages:consultation.free") : t("pages:consultation.paid")} ${t("pages:consultation.videoConsultation")}`,
        meeting_description: `${consultationType === 'free' ? t("pages:consultation.free") : t("pages:consultation.paid")} ${t("pages:consultation.videoConsultation")}${consultationType === 'paid' ? ` ${t("pages:consultation.atRate", { rate: videoRate })}` : ''}`,
        requested_date: new Date().toISOString().split('T')[0],
        requested_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        meetingLink: consultationLink,
        consultation_type: consultationType,
        hourly_rate: videoRate,
      };

      const response = await createMeeting(meetingData);
      
      if (response.success) {
        // Send notification to the selected user
        try {
          await notificationsApi.createNotification({
            userId: selectedUser._id,
            title: `${t("pages:consultation.new")} ${consultationType === 'free' ? t("pages:consultation.free") : t("pages:consultation.paid")} ${t("pages:consultation.videoConsultationRequest")}`,
            message: `${currentProfile?.first_name} ${currentProfile?.last_name} ${t("pages:consultation.hasSentYouVideoLink")}${consultationType === 'paid' ? ` ${t("pages:consultation.withHourlyRate", { rate: videoRate })}` : ''}.`,
            type: 'video_consultation_started',
            relatedId: response.data?._id,
            relatedType: 'meeting',
            redirectUrl: '/video-consultations',
            priority: 'medium',
            metadata: {
              consultation_type: consultationType,
              hourly_rate: videoRate,
              meeting_link: consultationLink,
              sender: {
                _id: currentProfile?._id,
                name: `${currentProfile?.first_name} ${currentProfile?.last_name}`,
                account_type: currentProfile?.account_type
              }
            }
          });
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError);
          // Don't block the main flow if notification fails
        }

        toast({
          title: t("pages:consultation.linkSent"),
          description: t("pages:consultation.linkSentTo", { name: `${selectedUser.first_name} ${selectedUser.last_name}` }),
        });
        
        if (onConsultationScheduled) {
          onConsultationScheduled(selectedUser);
        }
        handleClose();
      }
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t("pages:consultation.failedToSendLink"),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'sendLink') {
      setCurrentStep('userSelection');
      setSelectedUser(null);
    } else if (currentStep === 'userSelection') {
      setCurrentStep('consultationType');
      setConsultationType(null);
      setUsers([]);
      setFilteredUsers([]);
      setSearchQuery("");
    }
  };

  const handleClose = () => {
    setCurrentStep('consultationType');
    setConsultationType(null);
    setSelectedUser(null);
    setUsers([]);
    setFilteredUsers([]);
    setSearchQuery("");
    setConsultationLink("");
    setFreshUserProfile(null);
    onClose();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getUserTypeLabel = () => {
    return currentProfile?.account_type === "lawyer" ? t("pages:consultation.clients") : t("consultation.lawyers");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {(currentStep === 'userSelection' || currentStep === 'sendLink') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mr-2 p-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Video className="w-5 h-5 text-primary" />
            {currentStep === 'consultationType' && t("pages:consultation.startVideoConsultation")}
            {currentStep === 'userSelection' && `${t("pages:consultation.select")} ${currentProfile?.account_type === 'lawyer' ? t("pages:consultation.client") : t("pages:consultation.lawyer")}`}
            {currentStep === 'sendLink' && t("pages:consultation.sendConsultationLink")}
          </DialogTitle>
        </DialogHeader>

        {currentStep === 'consultationType' && (
          <div className="space-y-6 p-2">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t("pages:consultation.chooseConsultationType")}</h3>
              <p className="text-muted-foreground">
                {t("pages:consultation.selectFreeOrPaid")}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Free Consultation Option */}
              <div 
                className="p-6 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                onClick={() => handleConsultationTypeSelect('free')}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t("pages:consultation.freeConsultation")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("pages:consultation.freeConsultationDesc")}
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full border-green-300 text-green-600 hover:bg-green-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConsultationTypeSelect('free');
                    }}
                  >
                    {t("pages:consultation.selectFree")}
                  </Button>
                </div>
              </div>

              {/* Paid Consultation Option */}
              <div 
                className="p-6 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                onClick={() => handleConsultationTypeSelect('paid')}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t("pages:consultation.paidConsultation")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("pages:consultation.paidConsultationDesc")}
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConsultationTypeSelect('paid');
                    }}
                  >
                    {t("pages:consultation.selectPaid")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'userSelection' && (
          <div className="space-y-4">
            {/* Show rate information for paid consultations */}
            {consultationType === 'paid' && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      {t("pages:consultation.paidVideoConsultation")}
                    </p>
                    <p className="text-sm text-blue-600">
                      {currentProfile?.account_type === 'lawyer' 
                        ? t("pages:consultation.yourVideoRate", { rate: currentProfile?.video_rate || currentProfile?.charges || 0 })
                        : t("pages:consultation.seeLawyerRate")
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t("pages:consultation.searchPlaceholder", { type: getUserTypeLabel() })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Users List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <User className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-center">
                    {t("pages:consultation.noUsersFound", { type: getUserTypeLabel() })}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.profile_image} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(user.first_name, user.last_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {user.first_name} {user.last_name}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                          {t(`pages:commonp.${user.account_type}`)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        
                        {user.pratice_area && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            <span className="truncate">{user.pratice_area}</span>
                          </div>
                        )}

                        {user.account_type === 'lawyer' && currentProfile?.account_type === 'client' && consultationType === 'free' && (
                          <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md">
                            <Coins className="w-3 h-3 text-green-600" />
                            <span className="font-medium text-green-700">
                              {t("pages:consultation.freeConsultation")}
                            </span>
                          </div>
                        )}
                        
                        {consultationType === 'paid' && (
                          <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md">
                            <Coins className="w-3 h-3 text-blue-600" />
                            <span className="font-medium text-blue-700">
                              {/* Show lawyer's rate regardless of who is being selected */}
                              {currentProfile?.account_type === 'lawyer' 
                                ? t("pages:consultation.rateDisplay", { rate: currentProfile?.video_rate || currentProfile?.charges || 0 })
                                : t("pages:consultation.rateDisplay", { rate: user.video_rate || user.charges || 0 })
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleUserSelect(user)}
                    >
                      {t("pages:commonp.select")}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {currentStep === 'sendLink' && selectedUser && (
          <div className="space-y-4">
            {/* Selected User Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Avatar className="w-12 h-12">
                <AvatarImage src={selectedUser.profile_image} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(selectedUser.first_name, selectedUser.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {selectedUser.first_name} {selectedUser.last_name}
                </h3>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                
                {consultationType === 'paid' && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded-md">
                    <Coins className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      {t("pages:consultation.rate")}: {(currentProfile?.account_type === 'lawyer' ? currentProfile?.video_rate || currentProfile?.charges : selectedUser.video_rate || selectedUser.charges) || 0} {t("pages:consultation.tokensPerHour")}
                    </span>
                  </div>
                )}
                
                {consultationType === 'free' && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded-md">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      {t("pages:consultation.freeConsultation")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Consultation Link */}
            <div className="space-y-2">
              <Label htmlFor="link">{t("pages:consultation.consultationLink")}</Label>
              <Input
                id="link"
                value={consultationLink}
                onChange={(e) => setConsultationLink(e.target.value)}
                placeholder={t("pages:consultation.linkPlaceholder")}
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">{t("pages:consultation.summary")}</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">{t("pages:consultation.type")}:</span> {consultationType === 'free' ? t("pages:consultation.freeConsultation") : t("pages:consultation.paidConsultation")}</p>
                <p><span className="font-medium">{t("pages:consultation.with")}:</span> {selectedUser.first_name} {selectedUser.last_name}</p>
                {consultationType === 'paid' && (
                  <p><span className="font-medium">{t("pages:consultation.rate")}:</span> {(currentProfile?.account_type === 'lawyer' ? currentProfile?.video_rate || currentProfile?.charges : selectedUser.video_rate || selectedUser.charges) || 0} {t("pages:consultation.tokensPerHour")}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            {t("pages:commonp.cancel")}
          </Button>
          {currentStep === 'sendLink' && (
            <Button 
              onClick={handleSendConsultationLink}
              disabled={sending || !consultationLink}
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t("pages:commonp.sending")}...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t("pages:consultation.sendLink")}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}