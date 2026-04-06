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
  Calculator,
  Loader2,
  Check,
  ChevronDown,
  Copy
} from "lucide-react";
import { getRelatedUsers } from "@/lib/api/users-api";
import { createMeeting } from "@/lib/api/meeting-api";
import { notificationsApi } from "@/lib/api/notifications-api";
import { useToast } from "@/hooks/use-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
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
type ConsultationType = 'free' | 'video';

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
  const [useBaseRate, setUseBaseRate] = useState(true);

  const { toast } = useToast();
  const profile = useSelector((state: RootState) => state.auth.user);
  const { t } = useTranslation();

  // Use original Redux profile for user type logic (like schedule meeting modal)
  // Only use fresh profile for rates
  const currentProfile = profile as any as User;
  const profileWithFreshRates = (freshUserProfile || profile) as any as User;

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

      const response = await getRelatedUsers();

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

  // Filter users based on search query and consultation type
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
      const defaultRate = selectedLawyerBaseRate;

      // Use per-minute rate if custom rate is selected (!useBaseRate), otherwise use defaultRate
      const finalRate = consultationType === 'video'
        ? (!useBaseRate && perMinuteRate ? parseFloat(perMinuteRate) : defaultRate)
        : 0;

      // For display purposes (though displayRate isn't strictly necessary for the meetingData it is for notifications)
      const displayRate = !useBaseRate && perMinuteRate
        ? parseFloat(perMinuteRate)
        : finalRate;

      const meetingData = {
        lawyerId: currentProfile?.account_type === 'lawyer' ? currentProfile._id : selectedUser._id,
        clientId: currentProfile?.account_type === 'client' ? currentProfile._id : selectedUser._id,
        meeting_title: `${consultationType === 'free' ? t("pages:consultation.free") : t("pages:consultation.video")} ${t("pages:consultation.videoConsultation")}`,
        meeting_description: `${consultationType === 'free' ? t("pages:consultation.free") : t("pages:consultation.video")} ${t("pages:consultation.videoConsultation")}${consultationType === 'video' ? ` ${t("pages:consultation.atRate", { rate: displayRate })}` : ''}${!useBaseRate ? ` (${t("pages:consultation.customRate")})` : ''}`,
        requested_date: consultationDate || new Date().toISOString().split('T')[0],
        requested_time: consultationTime || new Date().toTimeString().split(' ')[0].substring(0, 5),
        meetingLink: consultationLink,
        consultation_type: consultationType,
        hourly_rate: finalRate,
        custom_fee: !useBaseRate,
        per_minute_rate: !useBaseRate && perMinuteRate ? parseFloat(perMinuteRate) : (consultationType === 'video' ? defaultRate : null),
        reservation_end_date: reservationEndDate,
        reservation_end_time: reservationEndTime,
        calculated_total: calculatedTotal,
      };

      const response = await createMeeting(meetingData);

      if (response.success) {
        // Send notification to the selected user
        try {
          await notificationsApi.createNotification({
            userId: selectedUser._id,
            title: `${t("pages:consultation.new")} ${consultationType === 'free' ? t("pages:consultation.free") : t("pages:consultation.video")} ${t("pages:consultation.videoConsultationRequest")}`,
            message: `${currentProfile?.first_name} ${currentProfile?.last_name} ${t("pages:consultation.hasSentYouVideoConsultation")}${consultationType === 'video' ? ` ${t("pages:consultation.withHourlyRate", { rate: displayRate })}` : ''}.`,
            type: 'video_consultation_started',
            relatedId: response.data?._id,
            relatedType: 'meeting',
            redirectUrl: '/video-consultations',
            priority: 'medium',
            metadata: {
              consultation_type: consultationType,
              hourly_rate: finalRate,
              custom_fee: !useBaseRate,
              per_minute_rate: !useBaseRate && perMinuteRate ? parseFloat(perMinuteRate) : (consultationType === 'video' ? defaultRate : null),
              meeting_link: consultationLink,
              consultation_date: consultationDate,
              consultation_time: consultationTime,
              reservation_end_date: reservationEndDate,
              reservation_end_time: reservationEndTime,
              calculated_total: calculatedTotal,
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
    setPerMinuteRate("");
    setReservationEndDate("");
    setReservationEndTime("");
    setCalculatedTotal(0);
    onClose();
  };

  const getInitials = (firstName: string, lastName: string) => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    else return "NA";
  };

  const getUserTypeLabel = () => {
    return currentProfile?.account_type === "lawyer" ? t("pages:consultation.clients") : t("pages:consultation.lawyers");
  };

  const selectedLawyerBaseRate =
    currentProfile?.account_type === "lawyer"
      ? (profileWithFreshRates?.video_rate || profileWithFreshRates?.charges || 0)
      : (selectedUser ? ((selectedUser as any).video_rate || (selectedUser as any).charges || 0) : 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "transition-all duration-300 overflow-hidden outline-none",
        "sm:max-w-[740px] p-8 flex flex-col max-h-[95vh]"
      )}>
        {/* Step Content Container */}
        <div className="flex-1 flex flex-col min-h-0 overflow-visible">

          {currentStep === 'consultationType' && (
            <div className="space-y-10 py-4 pt-1 px-2 flex-1 flex flex-col overflow-y-auto">
              <div className="text-left flex-none">
                <h3 className="text-[20px] font-bold text-[#0F172A] tracking-tight">
                  {t("pages:consultation.selectConsultationType")}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 flex-none">
                {/* Only show free consultation for lawyers */}
                {currentProfile?.account_type !== 'client' && (
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
                        {t("pages:consultation.freeVideoConsultation")}
                      </h4>
                      <p className={cn(
                        "text-[13px] font-medium leading-relaxed",
                        consultationType === 'free' || !consultationType ? "text-slate-300" : "text-[#1E293B]"
                      )}>
                        {t("pages:consultation.freeConsultation")}
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
                )}

                {/* Paid Consultation Option - Always show */}
                <div
                  className={cn(
                    "p-8 rounded-[12px] cursor-pointer transition-all duration-300 flex flex-col items-center text-center justify-between min-h-[220px] border-2",
                    consultationType === 'video' || (currentProfile?.account_type === 'client' && !consultationType)
                      ? "bg-[#0F172A] border-[#0F172A] text-white shadow-xl shadow-slate-200"
                      : "bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] hover:border-slate-300"
                  )}
                  onClick={() => setConsultationType('video')}
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-[18px]">
                      {t("pages:consultation.paidVideoConsultation")}
                    </h4>
                    <p className={cn(
                      "text-[13px] font-medium leading-relaxed",
                      consultationType === 'video' ? "text-slate-300" : "text-[#1E293B]"
                    )}>
                      {t("pages:consultation.billedPerMinute")}
                    </p>
                  </div>

                  <div className="mt-8">
                    {consultationType === 'video' ? (
                      <div className="h-8 w-8 bg-[#22C55E] rounded-full flex items-center justify-center">
                        <Check className="h-5 w-5 text-white stroke-[4]" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 bg-[#CBD5E1] rounded-full" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 mt-auto flex-none">
                <Button
                  onClick={() => handleConsultationTypeSelect(consultationType || 'video')}
                  className="bg-[#0F172A] hover:bg-slate-800 text-white rounded-[8px] px-12 h-11 font-bold transition-all shadow-lg"
                >
                  {t("pages:consultation.next")}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'userSelection' && (
            <div className="flex-1 flex flex-col min-h-0 space-y-5">
              <div className="text-left w-full flex-none">
                <h3 className="text-[20px] font-bold text-[#0F172A] tracking-tight">
                  {consultationType === 'free' ? t("pages:consultation.freeConsultationSettings") : t("pages:consultation.paidConsultationSettings")}
                </h3>
              </div>

              {/* Main Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto pr-3 -mr-3 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                <div className="space-y-7 pb-2">
                  <div className="space-y-6">
                    {/* Rate Selection for Paid Consultation */}
                    {consultationType === 'video' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={cn(
                              "h-5 w-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all",
                              useBaseRate ? "bg-[#0F172A] border-[#0F172A]" : "bg-white border-slate-300"
                            )} onClick={() => setUseBaseRate(true)}>
                              {useBaseRate && <Check className="h-3 w-3 text-white stroke-[3.5]" />}
                            </div>
                            <span className="text-[14px] font-bold text-[#0F172A]">{t("pages:consultation.useBaseRate")}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="bg-[#F1F5F9] px-4 py-2 rounded font-bold text-[#0F172A] min-w-[100px] text-center">
                              ${selectedLawyerBaseRate}
                            </div>
                            <span className="text-[13px] text-[#0F172A] font-bold">{t("pages:consultation.tokensPerMinuteShort")}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={cn(
                              "h-5 w-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all",
                              !useBaseRate ? "bg-[#0F172A] border-[#0F172A]" : "bg-white border-slate-300"
                            )} onClick={() => setUseBaseRate(false)}>
                              {!useBaseRate && <Check className="h-3 w-3 text-white stroke-[3.5]" />}
                            </div>
                            <span className="text-[14px] font-bold text-[#0F172A]">{t("pages:consultation.useCustomRate")}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Input
                              value={perMinuteRate}
                              onChange={(e) => setPerMinuteRate(e.target.value)}
                              placeholder=""
                              className="h-10 w-[100px] text-center bg-white border-slate-200 font-bold text-[#0F172A] focus-visible:ring-0 focus-visible:border-[#0F172A]"
                            />
                            <span className="text-[13px] text-[#0F172A] font-bold">{t("pages:consultation.tokensPerMinuteShort")}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Booking Date */}
                    <div className="space-y-1.5">
                      <Label className="text-[14px] font-bold text-[#0F172A]">{t("pages:consultation.bookingDate")}</Label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={consultationDate}
                          onChange={(e) => setConsultationDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="h-11 bg-white border-slate-200 rounded-[8px] focus-visible:ring-0 focus-visible:border-[#0F172A] pr-10 text-[14px] cursor-pointer"
                          onFocus={(e) => e.target.showPicker()}
                          onClick={(e) => e.currentTarget.showPicker()}
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 pointer-events-none stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Booking Time Range */}
                    <div className="space-y-1.5">
                      <Label className="text-[14px] font-bold text-[#0F172A]">{t("pages:consultation.bookingTime")}</Label>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <Input
                            type="time"
                            value={consultationTime}
                            onChange={(e) => setConsultationTime(e.target.value)}
                            className="h-11 bg-white border-slate-200 rounded-[8px] focus-visible:ring-0 focus-visible:border-[#0F172A] text-[14px] pr-10 cursor-pointer"
                            onFocus={(e) => e.target.showPicker()}
                            onClick={(e) => e.currentTarget.showPicker()}
                          />
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 pointer-events-none stroke-[2.5]" />
                        </div>
                        <span className="text-[#0F172A] font-bold">-</span>
                        <div className="relative flex-1">
                          <Input
                            type="time"
                            value={reservationEndTime}
                            onChange={(e) => setReservationEndTime(e.target.value)}
                            className="h-11 bg-white border-slate-200 rounded-[8px] focus-visible:ring-0 focus-visible:border-[#0F172A] text-[14px] pr-10 cursor-pointer"
                            onFocus={(e) => e.target.showPicker()}
                            onClick={(e) => e.currentTarget.showPicker()}
                          />
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 pointer-events-none stroke-[2.5]" />
                        </div>
                      </div>
                    </div>

                    <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                      {t("pages:consultation.ifNotSpecifiedNote")}
                    </p>

                    {/* Search Client */}
                    <div className="relative -mt-1">
                      <Input
                        placeholder={currentProfile?.account_type === 'lawyer' ? t("pages:consultation.searchClient") : t("pages:consultation.searchLawyer")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 bg-white border-slate-200 rounded-[8px] focus-visible:ring-0 focus-visible:border-[#0F172A] placeholder:text-slate-400 font-medium pl-10 text-[14px]"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 stroke-[1.5]" />
                    </div>
                  </div>

                  {/* Users List - Part of the same scrollable area */}
                  <div className="space-y-2.5">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-[#0F172A]" />
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="text-center py-8 bg-[#F1F5F9] rounded-xl border border-dashed border-slate-200">
                        <p className="text-slate-500 font-bold text-[14px]">{t("pages:consultation.noUsersFound")}</p>
                      </div>
                    ) : (
                      filteredUsers.map((user) => {
                        const isSelected = selectedUser?._id === user._id;
                        return (
                          <div
                            key={user._id}
                            className={cn(
                              "p-4 rounded-lg flex items-center justify-between gap-4 transition-all duration-200",
                              isSelected ? "bg-[#E2E8F0] ring-1 ring-[#0F172A]" : "bg-[#F1F5F9]"
                            )}
                            onClick={() => setSelectedUser(user)}
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-[15px] text-[#0F172A] truncate">
                                {user.first_name || t("pages:consultation.clientName")} {user.last_name || ''}
                              </h4>
                              <p className="text-[12px] text-slate-500 font-medium truncate">
                                {user.email || t("pages:consultation.clientEmail")}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className={cn(
                                "h-9 px-6 font-bold text-[13px] rounded-[6px] transition-all shadow-sm",
                                isSelected ? "bg-[#0F172A] text-white" : "bg-[#0F172A] text-white hover:bg-slate-800"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(user);
                              }}
                            >
                              {isSelected ? t("pages:consultation.selected") : t("pages:consultation.select")}
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Buttons - Sticky at the bottom */}
              <div className="flex justify-end items-center gap-3 pt-4 flex-none border-t mt-auto">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="bg-[#E2E8F0] border-none text-[#0F172A] font-bold px-10 h-11 rounded-[8px] hover:bg-slate-300 transition-all shadow-sm"
                >
                  {t("pages:consultation.back")}
                </Button>
                <Button
                  onClick={() => {
                    if (selectedUser) {
                      setCurrentStep('sendLink');
                      const meetingId = Math.random().toString(36).substring(2, 15);
                      setConsultationLink(`https://meet.google.com/consultation-${meetingId}`);
                    }
                  }}
                  disabled={!selectedUser}
                  className={cn(
                    "bg-[#0F172A] hover:bg-slate-800 text-white rounded-[8px] px-12 h-11 font-bold transition-all shadow-lg",
                    !selectedUser && "opacity-80 bg-slate-400 cursor-not-allowed shadow-none"
                  )}
                >
                  {t("pages:consultation.next")}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'sendLink' && selectedUser && (
            <div className="flex-1 flex flex-col min-h-0 space-y-7">
              <div className="text-left w-full flex-none">
                <h3 className="text-[20px] font-bold text-[#0F172A] tracking-tight">
                  {consultationType === 'free' ? t("pages:consultation.sendFreeConsultationLink") : t("pages:consultation.sendPaidConsultationLink")}
                </h3>
              </div>

              {/* Grid Content */}
              <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                <div className="grid grid-cols-2 gap-x-8 gap-y-7">
                  {/* Consultation Type */}
                  <div className="space-y-3">
                    <Label className="text-[14px] font-bold text-slate-400">{t("pages:consultation.type")}</Label>
                    <div className="h-11 bg-[#F1F5F9] border-none rounded-[8px] flex items-center px-4 font-bold text-[#0F172A] text-[14px]">
                      {consultationType === 'free' ? t("pages:consultation.freeConsultation") : t("pages:consultation.paidConsultation")}
                    </div>
                  </div>

                  {/* Client Name */}
                  <div className="space-y-3">
                    <Label className="text-[14px] font-bold text-slate-400">{t("pages:consultation.clientName")}</Label>
                    <div className="h-11 bg-[#F1F5F9] border-none rounded-[8px] flex items-center px-4 font-bold text-[#0F172A] text-[14px]">
                      {selectedUser.first_name} {selectedUser.last_name || ''}
                    </div>
                  </div>

                  {/* Client Email */}
                  <div className="space-y-3">
                    <Label className="text-[14px] font-bold text-slate-400">{t("pages:consultation.clientEmail")}</Label>
                    <div className="h-11 bg-[#F1F5F9] border-none rounded-[8px] flex items-center px-4 font-bold text-[#0F172A] text-[14px]">
                      {selectedUser.email || 'N/A'}
                    </div>
                  </div>

                  {/* Consultation Fee */}
                  <div className="space-y-3">
                    <Label className="text-[14px] font-bold text-slate-400">{t("pages:consultation.consultationFee")}</Label>
                    <div className="h-11 bg-[#F1F5F9] border-none rounded-[8px] flex items-center px-4 font-bold text-[#0F172A] text-[14px]">
                      {consultationType === 'free'
                        ? t("pages:consultation.free")
                        : `${useBaseRate ? selectedLawyerBaseRate : perMinuteRate} ${t("pages:consultation.tokensPerMinuteShort")} ${useBaseRate ? `(${t("pages:consultation.yourDefaultRate").split(':')[0]})` : `(${t("pages:consultation.customRate")})`}`
                      }
                    </div>
                  </div>

                  {/* Consultation Date */}
                  <div className="space-y-3">
                    <Label className="text-[14px] font-bold text-slate-400">{t("pages:consultation.bookingDate")}</Label>
                    <div className="h-11 bg-[#F1F5F9] border-none rounded-[8px] flex items-center px-4 font-bold text-[#0F172A] text-[14px]">
                      {consultationDate ? new Date(consultationDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '. ') + '.' : t("pages:consultation.notSet")}
                    </div>
                  </div>

                  {/* Consultation Time */}
                  <div className="space-y-3">
                    <Label className="text-[14px] font-bold text-slate-400">{t("pages:consultation.bookingTime")}</Label>
                    <div className="h-11 bg-[#F1F5F9] border-none rounded-[8px] flex items-center px-4 font-bold text-[#0F172A] text-[14px]">
                      {consultationTime ? `${consultationTime} - ${reservationEndTime || ''}` : t("pages:consultation.notSet")}
                    </div>
                  </div>

                  {/* Meeting Link - Full Width */}
                  <div className="col-span-2 space-y-3 mt-1">
                    <Label className="text-[14px] font-bold text-slate-400">{t("pages:consultation.meetingLink")}</Label>
                    <div className="relative group">
                      <Input
                        value={consultationLink}
                        onChange={(e) => setConsultationLink(e.target.value)}
                        className="h-11 bg-[#F1F5F9] border-none rounded-[8px] focus-visible:ring-1 focus-visible:ring-slate-300 font-bold text-[#0F172A] text-[14px] pr-12"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(consultationLink);
                          toast({ description: t("pages:dashboard.linkCopied") });
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded transition-colors"
                      >
                        <Copy className="h-4 w-4 text-[#0F172A]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end items-center gap-3 pt-4 flex-none border-t">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="bg-[#E2E8F0] border-none text-[#0F172A] font-bold px-12 h-11 rounded-[8px] hover:bg-slate-300 transition-all shadow-sm"
                >
                  {t("pages:consultation.back")}
                </Button>
                <Button
                  onClick={handleSendConsultationLink}
                  disabled={sending || !consultationLink}
                  className={cn(
                    "bg-[#0F172A] hover:bg-slate-800 text-white rounded-[8px] px-12 h-11 font-bold transition-all shadow-lg",
                    (sending || !consultationLink) && "opacity-80 bg-slate-400 cursor-not-allowed shadow-none"
                  )}
                >
                  {sending ? (
                    t("pages:common.loading")
                  ) : (
                    t("pages:consultation.sendConsultationLink")
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}