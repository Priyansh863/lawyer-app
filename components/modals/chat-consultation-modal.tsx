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
  Calendar,
  Calculator
} from "lucide-react";
import { getRelatedUsers } from "@/lib/api/users-api";
import { createOrGetChat, sendMessage } from "@/lib/api/simple-chat-api";
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
  chat_rate?: number;
  video_rate?: number;
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
  const [perMinuteRate, setPerMinuteRate] = useState<string>("");
  const [reservationEndDate, setReservationEndDate] = useState<string>("");
  const [reservationEndTime, setReservationEndTime] = useState<string>("");
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0);

  const { toast } = useToast();
  const profile = useSelector((state: RootState) => state.auth.user);
  const { t } = useTranslation();

  // Use original Redux profile for user type logic (like schedule meeting modal)
  // Only use fresh profile for rates
  const currentProfile = profile;
  const profileWithFreshRates = freshUserProfile || profile;

  // Calculate total based on per-minute rate and duration
  useEffect(() => {
    if (perMinuteRate && reservationEndDate && reservationEndTime && consultationDate && consultationTime) {
      try {
        const rate = parseFloat(perMinuteRate);
        if (isNaN(rate) || rate <= 0) {
          setCalculatedTotal(0);
          return;
        }

        // Calculate duration in minutes
        const startDateTime = new Date(`${consultationDate}T${consultationTime}`);
        const endDateTime = new Date(`${reservationEndDate}T${reservationEndTime}`);
        
        if (endDateTime <= startDateTime) {
          setCalculatedTotal(0);
          return;
        }
        
        const durationMs = endDateTime.getTime() - startDateTime.getTime();
        const durationMinutes = Math.ceil(durationMs / (1000 * 60));
        
        // Calculate total
        const total = rate * durationMinutes;
        setCalculatedTotal(total);
      } catch (error) {
        console.error("Error calculating total:", error);
        setCalculatedTotal(0);
      }
    } else {
      setCalculatedTotal(0);
    }
  }, [perMinuteRate, reservationEndDate, reservationEndTime, consultationDate, consultationTime]);

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
    let filtered = [...users];
    
    // For lawyers, show clients for both free and paid consultations
    if (currentProfile?.account_type === 'lawyer') {
      filtered = filtered.filter(user => user.account_type === 'client');
    } 
    // For clients, only show lawyers for free consultations
    else if (consultationType === 'free') {
      filtered = filtered.filter(user => user.account_type === 'lawyer');
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [searchQuery, users, consultationType, currentProfile]);

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

  const handleSubmit = async () => {
    if (!selectedUser) return;
    
    setSending(true);
    try {
      // Create or get chat with the selected user
      const chat = await createOrGetChat(selectedUser._id);
      
      // If this is a paid chat, send a system message about the rate
      if (consultationType === 'paid' && (perMinuteRate || selectedUser.chat_rate)) {
        const rate = useCustomFee && perMinuteRate ? perMinuteRate : selectedUser.chat_rate;
        await sendMessage(chat._id, 
          `This is a paid chat consultation. Rate: ${rate} tokens per minute`,
          'system'
        );
      }

      // Send notification to the other user
      await notificationsApi.createNotification({
        recipient_id: selectedUser._id,
        type: 'new_chat',
        title: 'New Chat Consultation',
        message: `${currentProfile?.first_name} ${currentProfile?.last_name} has started a chat consultation with you`,
        related_id: chat._id
      });

      toast({
        title: t("common:success"),
        description: t("pages:chat.chatStarted"),
      });

      if (onConsultationScheduled) {
        onConsultationScheduled(selectedUser);
      }

      onClose();
    } catch (error: any) {
      console.error("Error creating chat:", error);
      toast({
        title: t("common:error"),
        description: error.response?.data?.message || t("pages:chat.errors.create"),
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
    setPerMinuteRate("");
    setReservationEndDate("");
    setReservationEndTime("");
    setCalculatedTotal(0);
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
            <MessageSquare className="w-5 h-5 text-primary" />
            {currentStep === 'consultationType' && t("pages:consultation.startChatConsultation")}
            {currentStep === 'userSelection' && `${t("pages:consultation.select")} ${currentProfile?.account_type === 'lawyer' ? t("pages:consultation.client") : t("pages:consultation.lawyer")}`}
            {currentStep === 'sendLink' && t("pages:consultation.sendConsultationLink")}
          </DialogTitle>
        </DialogHeader>

        {currentStep === 'consultationType' && (
          <div className="space-y-6 p-2">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                {t("pages:consultation.startChatConsultation")}
              </h3>
              {currentProfile?.account_type === 'client' ? (
                <p className="text-sm text-muted-foreground">
                  {t("pages:consultation.selectPaidChatConsultation")}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("pages:consultation.selectFreeOrPaid")}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Only show free consultation for lawyers */}
              {currentProfile?.account_type !== 'client' && (
                <div 
                  className="p-6 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                  onClick={() => handleConsultationTypeSelect('free')}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{t("pages:consultation.freeChat")}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("pages:consultation.freeChatDesc")}
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-green-300 text-green-600 hover:bg-green-50"
                    >
                      {t("pages:consultation.startFreeChat")}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Paid Chat Option - Always show */}
              <div 
                className="p-6 border-2 border-blue-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                onClick={() => handleConsultationTypeSelect('paid')}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t("pages:consultation.paidChat")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("pages:consultation.paidChatDesc")}
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    {t("pages:consultation.startPaidChat")}
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
                      {t("pages:consultation.paidChatConsultation")}
                    </p>
                    <p className="text-sm text-blue-600">
                      {currentProfile?.account_type === 'lawyer' 
                        ? t("pages:consultation.yourDefaultRate", { rate: profileWithFreshRates?.chat_rate || profileWithFreshRates?.charges || 0 })
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
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-blue-600" />
                          <Input
                            type="number"
                            placeholder={t("pages:consultation.enterPerMinuteRate")}
                            value={perMinuteRate}
                            onChange={(e) => setPerMinuteRate(e.target.value)}
                            className="flex-1"
                            min="0"
                            step="0.01"
                          />
                          <span className="text-sm text-muted-foreground">{t("pages:consultation.tokensPerMinute")}</span>
                        </div>
                        
                        {/* Total calculation display */}
                        {calculatedTotal > 0 && (
                          <div className="flex items-center gap-2 p-2 bg-blue-100 rounded-md">
                            <Calculator className="w-4 h-4 text-blue-700" />
                            <span className="text-sm font-medium text-blue-800">
                              {t("pages:consultation.estimatedTotal")}: {calculatedTotal.toFixed(2)} {t("pages:consultation.tokens")}
                            </span>
                          </div>
                        )}
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
            {currentProfile?.account_type === 'lawyer' && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  {t("pages:consultation.setConsultationSchedule")}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="consultationDate" className="text-sm">
                      {t("pages:consultation.scheduleDate")}
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
                      {t("pages:consultation.scheduleTime")}
                    </Label>
                    <Input
                      id="consultationTime"
                      type="time"
                      value={consultationTime}
                      onChange={(e) => setConsultationTime(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Reservation End Date/Time - Only for paid consultations */}
                {consultationType === 'paid' && (
                  <>
                    <div className="border-t pt-3 mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {t("pages:consultation.reservationEnd")}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="reservationEndDate" className="text-sm">
                            {t("pages:consultation.endDate")}
                          </Label>
                          <Input
                            id="reservationEndDate"
                            type="date"
                            value={reservationEndDate}
                            onChange={(e) => setReservationEndDate(e.target.value)}
                            min={consultationDate || new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reservationEndTime" className="text-sm">
                            {t("pages:consultation.endTime")}
                          </Label>
                          <Input
                            id="reservationEndTime"
                            type="time"
                            value={reservationEndTime}
                            onChange={(e) => setReservationEndTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Total calculation for paid consultations */}
                    {calculatedTotal > 0 && (
                      <div className="flex items-center justify-between p-3 bg-blue-100 rounded-md">
                        <div className="flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-blue-700" />
                          <span className="text-sm font-medium text-blue-800">
                            {t("pages:consultation.estimatedTotal")}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-blue-800">
                          {calculatedTotal.toFixed(2)} {t("pages:consultation.tokens")}
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                <p className="text-xs text-muted-foreground">
                  {t("pages:consultation.ifNotSpecifiedLawyer")}
                </p>
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
                              {currentProfile?.account_type === 'lawyer' 
                                ? useCustomFee && perMinuteRate 
                                  ? t("pages:consultation.customRateDisplay", { rate: perMinuteRate })
                                  : t("pages:consultation.defaultRateDisplay", { rate: profileWithFreshRates?.chat_rate || profileWithFreshRates?.charges || 0 })
                                : t("pages:consultation.lawyerRateDisplay", { rate: user.chat_rate || user.charges || 0 })
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
                        ? (useCustomFee && perMinuteRate ? t("pages:consultation.customRateDisplay", { rate: perMinuteRate }) : t("pages:consultation.defaultRateDisplay", { rate: profileWithFreshRates?.chat_rate || profileWithFreshRates?.charges || 0 }))
                        : t("pages:consultation.lawyerRateDisplay", { rate: selectedUser.chat_rate || selectedUser.charges || 0 })
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
                  <>
                    <p><span className="font-medium">{t("pages:consultation.rate")}:</span> {currentProfile?.account_type === 'lawyer' 
                      ? (useCustomFee && perMinuteRate ? t("pages:consultation.customRateDisplay", { rate: perMinuteRate }) : t("pages:consultation.defaultRateDisplay", { rate: profileWithFreshRates?.chat_rate || profileWithFreshRates?.charges || 0 }))
                      : t("pages:consultation.lawyerRateDisplay", { rate: selectedUser.chat_rate || selectedUser.charges || 0 })
                    }</p>
                    {calculatedTotal > 0 && (
                      <p><span className="font-medium">{t("pages:consultation.estimatedTotal")}:</span> {calculatedTotal.toFixed(2)} {t("pages:consultation.tokens")}</p>
                    )}
                  </>
                )}
                {consultationDate && (
                  <p><span className="font-medium">{t("pages:consultation.date")}:</span> {new Date(consultationDate).toLocaleDateString()}</p>
                )}
                {consultationTime && (
                  <p><span className="font-medium">{t("pages:consultation.time")}:</span> {consultationTime}</p>
                )}
                {reservationEndDate && (
                  <p><span className="font-medium">{t("pages:consultation.endDate")}:</span> {new Date(reservationEndDate).toLocaleDateString()}</p>
                )}
                {reservationEndTime && (
                  <p><span className="font-medium">{t("pages:consultation.endTime")}:</span> {reservationEndTime}</p>
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
              onClick={handleSubmit}
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