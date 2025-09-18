"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  MessageSquare,
  Calendar
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
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [consultationLink, setConsultationLink] = useState("");
  const [sending, setSending] = useState(false);
  const [freshUserProfile, setFreshUserProfile] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [customFee, setCustomFee] = useState<string>("");
  const [useCustomFee, setUseCustomFee] = useState(false);
  const [consultationDate, setConsultationDate] = useState<string>("");
  const [consultationTime, setConsultationTime] = useState<string>("");

  const { toast } = useToast();
  const profile = useSelector((state: RootState) => state.auth.user);
  const { t } = useTranslation();

  // Use original Redux profile for user type logic (like schedule meeting modal)
  // Only use fresh profile for rates
  const currentProfile = profile;
  const profileWithFreshRates = freshUserProfile || profile;

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
      
      const response = await getRelatedUsers(currentProfile);
      
      if (response.success) {
        setUsers(response.users);
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

  // Memoize filtered users for better performance
  const filteredUsers = useMemo(() => {
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      return users.filter((user: User) => 
        `${user.first_name} ${user.last_name} ${user.email}`
          .toLowerCase()
          .includes(searchLower)
      );
    }
    return users;
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
      
      // Get the lawyer's video rate or custom fee
      const lawyerProfile = currentProfile?.account_type === 'lawyer' ? profileWithFreshRates : selectedUser;
      const defaultRate = lawyerProfile?.video_rate || lawyerProfile?.charges || 0;
      const finalRate = consultationType === 'paid' 
        ? (useCustomFee && customFee ? parseInt(customFee) : defaultRate)
        : 0;
      
      const meetingData = {
        lawyerId: currentProfile?.account_type === 'lawyer' ? currentProfile._id : selectedUser._id,
        clientId: currentProfile?.account_type === 'client' ? currentProfile._id : selectedUser._id,
        meeting_title: `${consultationType === 'free' ? t("pages:consultation.free") : t("pages:consultation.paid")} ${t("pages:consultation.videoConsultation")}`,
        meeting_description: `${consultationType === 'free' ? t("pages:consultation.free") : t("pages:consultation.paid")} ${t("pages:consultation.videoConsultation")}${consultationType === 'paid' ? ` ${t("pages:consultation.atRate", { rate: finalRate })}` : ''}${useCustomFee ? ` (${t("pages:consultation.customRate")})` : ''}`,
        requested_date: consultationDate || new Date().toISOString().split('T')[0],
        requested_time: consultationTime || new Date().toTimeString().split(' ')[0].substring(0, 5),
        meetingLink: consultationLink,
        consultation_type: consultationType,
        hourly_rate: finalRate,
        custom_fee: useCustomFee,
      };

      const response = await createMeeting(meetingData);
      
      if (response.success) {
        // Send notification to the selected user
        try {
          await notificationsApi.createNotification({
            userId: selectedUser._id,
            title: `${t("pages:consultation.new")} ${consultationType === 'free' ? t("pages:consultation.free") : t("pages:consultation.paid")} ${t("pages:consultation.videoConsultationRequest")}`,
            message: `${currentProfile?.first_name} ${currentProfile?.last_name} ${t("pages:consultation.hasSentYouVideoConsultation")}${consultationType === 'paid' ? ` ${t("pages:consultation.withHourlyRate", { rate: finalRate })}` : ''}.`,
            type: 'video_consultation_started',
            relatedId: response.data?._id,
            relatedType: 'meeting',
            redirectUrl: '/video-consultations',
            priority: 'medium',
            metadata: {
              consultation_type: consultationType,
              hourly_rate: finalRate,
              custom_fee: useCustomFee,
              meeting_link: consultationLink,
              consultation_date: consultationDate,
              consultation_time: consultationTime,
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
      setSearchQuery("");
    }
  };

  const handleClose = () => {
    setCurrentStep('consultationType');
    setConsultationType(null);
    setSelectedUser(null);
    setUsers([]);
    setSearchQuery("");
    setConsultationLink("");
    setFreshUserProfile(null);
    setCustomFee("");
    setUseCustomFee(false);
    setConsultationDate("");
    setConsultationTime("");
    onClose();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getUserTypeLabel = () => {
    return currentProfile?.account_type === "lawyer" ? t("pages:consultation.clients") : t("pages:consultation.lawyers");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-700">
                      {t("pages:consultation.paidVideoConsultation")}
                    </p>
                    <p className="text-sm text-blue-600">
                      {currentProfile?.account_type === 'lawyer' 
                        ? t("pages:consultation.yourDefaultRate", { rate: profileWithFreshRates?.video_rate || profileWithFreshRates?.charges || 0 })
                        : t("pages:consultation.seeLawyerRate")
                      }
                    </p>
                  </div>
                </div>
                
                {/* Custom fee option for lawyers */}
                {currentProfile?.account_type === 'lawyer' && (
                  <div className="border-t pt-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id="customFee"
                        checked={useCustomFee}
                        onCheckedChange={setUseCustomFee}
                      />
                      <Label htmlFor="customFee" className="text-sm font-medium">
                        {t("pages:consultation.useCustomFee")}
                      </Label>
                    </div>
                    {useCustomFee && (
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-blue-600" />
                        <Input
                          type="number"
                          placeholder={t("pages:consultation.enterCustomRate")}
                          value={customFee}
                          onChange={(e) => setCustomFee(e.target.value)}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground">{t("pages:consultation.tokensPerHour")}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Show date/time if specified */}
                {(consultationDate || consultationTime) && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-md">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {currentProfile?.account_type === 'lawyer' ? t("pages:consultation.scheduled") : t("pages:consultation.requested")} 
                      {consultationDate && ` ${new Date(consultationDate).toLocaleDateString()}`}
                      {consultationTime && ` ${t("pages:consultation.at")} ${consultationTime}`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Date and Time Selection - Available for both lawyers and clients */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <p className="text-sm font-medium text-gray-700">
                {currentProfile?.account_type === 'lawyer' 
                  ? t("pages:consultation.setConsultationSchedule")
                  : t("pages:consultation.requestPreferredDateTime")
                }
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="consultationDate" className="text-sm">
                    {currentProfile?.account_type === 'lawyer' ? t("pages:consultation.scheduleDate") : t("pages:consultation.preferredDate")}
                  </Label>
                  <Input
                    id="consultationDate"
                    type="date"
                    value={consultationDate}
                    onChange={(e) => setConsultationDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consultationTime" className="text-sm">
                    {currentProfile?.account_type === 'lawyer' ? t("pages:consultation.scheduleTime") : t("pages:consultation.preferredTime")}
                  </Label>
                  <Input
                    id="consultationTime"
                    type="time"
                    value={consultationTime}
                    onChange={(e) => setConsultationTime(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {currentProfile?.account_type === 'lawyer' 
                  ? t("pages:consultation.ifNotSpecifiedLawyer")
                  : t("pages:consultation.ifNotSpecifiedClient")
                }
              </p>
            </div>

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
            <div className="max-h-[400px] overflow-y-auto space-y-3 border border-gray-200 rounded-lg p-3 bg-white">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground bg-gray-50 rounded-lg">
                  <User className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-center font-medium">
                    {t("pages:consultation.noUsersFound", { type: getUserTypeLabel() })}
                  </p>
                  <p className="text-sm text-center mt-1">
                    {currentProfile?.account_type === 'lawyer' ? t("pages:consultation.noClientsAvailable") : t("pages:consultation.noLawyersAvailable")}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm"
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
                              {/* Show the rate that will be used */}
                              {currentProfile?.account_type === 'lawyer' 
                                ? useCustomFee && customFee 
                                  ? t("pages:consultation.customRateDisplay", { rate: customFee })
                                  : t("pages:consultation.defaultRateDisplay", { rate: profileWithFreshRates?.video_rate || profileWithFreshRates?.charges || 0 })
                                : t("pages:consultation.lawyerRateDisplay", { rate: user.video_rate || user.charges || 0 })
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      size="sm" 
                      className="bg-primary hover:bg-primary/90 text-white px-4 py-2"
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
                      {t("pages:consultation.rate")}: {currentProfile?.account_type === 'lawyer' 
                        ? (useCustomFee && customFee ? t("pages:consultation.customRateDisplay", { rate: customFee }) : t("pages:consultation.defaultRateDisplay", { rate: profileWithFreshRates?.video_rate || profileWithFreshRates?.charges || 0 }))
                        : t("pages:consultation.lawyerRateDisplay", { rate: selectedUser.video_rate || selectedUser.charges || 0 })
                      }
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
              <h4 className="font-medium mb-2">{t("pages:consultation.consultationSummary")}</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">{t("pages:consultation.type")}:</span> {consultationType === 'free' ? t("pages:consultation.freeConsultation") : t("pages:consultation.paidConsultation")}</p>
                <p><span className="font-medium">{t("pages:consultation.with")}:</span> {selectedUser.first_name} {selectedUser.last_name}</p>
                {consultationType === 'paid' && (
                  <p><span className="font-medium">{t("pages:consultation.rate")}:</span> {currentProfile?.account_type === 'lawyer' 
                    ? (useCustomFee && customFee ? t("pages:consultation.customRateDisplay", { rate: customFee }) : t("pages:consultation.defaultRateDisplay", { rate: profileWithFreshRates?.video_rate || profileWithFreshRates?.charges || 0 }))
                    : t("pages:consultation.lawyerRateDisplay", { rate: selectedUser.video_rate || selectedUser.charges || 0 })
                  }</p>
                )}
                {consultationDate && (
                  <p><span className="font-medium">{t("pages:consultation.date")}:</span> {new Date(consultationDate).toLocaleDateString()}</p>
                )}
                {consultationTime && (
                  <p><span className="font-medium">{t("pages:consultation.time")}:</span> {consultationTime}</p>
                )}
                {!consultationDate && !consultationTime && (
                  <p><span className="font-medium">{t("pages:consultation.schedule")}:</span> {currentProfile?.account_type === 'lawyer' ? t("pages:consultation.immediateSchedule") : t("pages:consultation.toBeScheduled")}</p>
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