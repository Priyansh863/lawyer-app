"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Calendar, User, Mail, Briefcase, Clock, ArrowLeft, Send, Link, Video, Coins } from "lucide-react";
import { getRelatedUsers } from "@/lib/api/users-api";
import { createMeeting } from "@/lib/api/meeting-api";
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
  charges?: number; // Added charges field for lawyer consultation rates
}

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

type ModalStep = 'userSelection' | 'meetingDetails';

export default function ScheduleMeetingModal({
  isOpen,
  onClose,
  onSelectUser,
}: ScheduleMeetingModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentStep, setCurrentStep] = useState<ModalStep>('userSelection');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDescription, setMeetingDescription] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const profile = useSelector((state: RootState) => state.auth.user);
  const { t } = useTranslation();

  console.log(users,"usersusersusersusersusersusersusers");

  const fetchUsers = async (query?: string) => {
    try {
      setLoading(true);
      
      // Get users based on current user's role
      const response = await getRelatedUsers(profile);
      
      if (response.success) {
        // Filter by search query if provided
        const filteredUsers = query 
          ? response.users.filter((user: User) => 
              `${user.first_name} ${user.last_name} ${user.email}`
                .toLowerCase()
                .includes(query.toLowerCase())
            )
          : response.users;
          
        console.log('Filtered users:', filteredUsers);
        setUsers(filteredUsers);
      }
    } catch (error: any) {
      toast({
        title: t("pages:scheduleM.error"),
        description: error.message || t("pages:scheduleM.failedToFetchUsers"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchUsers(searchQuery);
      } else {
        fetchUsers();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setCurrentStep('meetingDetails');
  };

  const handleMeetingLinkSubmit = async () => {
    if (!selectedUser || !meetingLink) {
      toast({
        title: t("pages:scheduleM.missingInformation"),
        description: t("pages:scheduleM.pleaseProvideMeetingLink"),
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      
      const meetingData = {
        lawyerId: profile?.account_type === 'lawyer' ? profile._id : selectedUser._id,
        clientId: profile?.account_type === 'client' ? profile._id : selectedUser._id,
        meeting_title: t("pages:scheduleM.meetingWith", { name: `${selectedUser.first_name} ${selectedUser.last_name}` }),
        meeting_description: t("pages:scheduleM.scheduledMeeting"),
        requested_date: new Date().toISOString().split('T')[0],
        requested_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        meetingLink: meetingLink,
      };

      const response = await createMeeting(meetingData);
      
      if (response.success) {
        toast({
          title: t("pages:scheduleM.meetingRequestSent"),
          description: t("pages:scheduleM.meetingRequestSentTo", { name: `${selectedUser.first_name} ${selectedUser.last_name}` }),
        });
        
        onSelectUser(selectedUser);
        handleClose();
      }
    } catch (error: any) {
      toast({
        title: t("pages:scheduleM.error"),
        description: error.message || t("pages:scheduleM.failedToScheduleMeeting"),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleBackToUserSelection = () => {
    setCurrentStep('userSelection');
    setSelectedUser(null);
  };

  const handleSendMeeting = async () => {
    if (!selectedUser || !meetingTitle || !meetingDate || !meetingTime || !meetingLink) {
      toast({
        title: t("pages:scheduleM.missingInformation"),
        description: t("pages:scheduleM.pleaseFillAllFields"),
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      
      const meetingData = {
        lawyerId: profile?.account_type === 'lawyer' ? profile._id : selectedUser._id,
        clientId: profile?.account_type === 'client' ? profile._id : selectedUser._id,
        meeting_title: meetingTitle,
        meeting_description: meetingDescription,
        requested_date: meetingDate,
        requested_time: meetingTime,
        meetingLink: meetingLink,
      };

      const response = await createMeeting(meetingData);
      
      if (response.success) {
        toast({
          title: t("pages:scheduleM.meetingScheduled"),
          description: t("pages:scheduleM.meetingRequestSentTo", { name: `${selectedUser.first_name} ${selectedUser.last_name}` }),
        });
        
        onSelectUser(selectedUser);
        handleClose();
      }
    } catch (error: any) {
      toast({
        title: t("scheduleM.error"),
        description: error.message || t("pages:scheduleM.failedToScheduleMeeting"),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('userSelection');
    setSelectedUser(null);
    setMeetingTitle("");
    setMeetingDescription("");
    setMeetingDate("");
    setMeetingTime("");
    setMeetingLink("");
    onClose();
  };

  const generateMeetingLink = () => {
    const meetingId = Math.random().toString(36).substring(2, 15);
    setMeetingLink(`https://meet.google.com/${meetingId}`);
  };

  const getUserTypeLabel = () => {
    return profile?.account_type === "lawyer" ? t("pages:scheduleM.clients") : t("pages:scheduleM.lawyers");
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentStep === 'meetingDetails' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToUserSelection}
                className="mr-2 p-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Calendar className="w-5 h-5 text-primary" />
            {currentStep === 'userSelection' 
              ? `${t("pages:scheduleM.scheduleMeeting")} - ${profile?.account_type === 'lawyer' ? t("pages:scheduleM.selectClient") : t("pages:scheduleM.selectLawyer")}`
              : t("pages:scheduleM.scheduleMeetingWith", { name: selectedUser?.first_name || t("pages:scheduleM.user") })
            }
          </DialogTitle>
        </DialogHeader>

        {currentStep === 'userSelection' ? (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t("pages:scheduleM.searchPlaceholder", { type: getUserTypeLabel().toLowerCase() })}
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
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <User className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-center">
                    {profile?.account_type === 'lawyer' 
                      ? t("pages:scheduleM.noClientsFound") 
                      : t("pages:scheduleM.noLawyersFound")}
                  </p>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    {profile?.account_type === 'lawyer'
                      ? t("pages:scheduleM.noActiveClients")
                      : t("pages:scheduleM.noLawyersAvailable")}
                  </p>
                </div>
              ) : (
                users.map((user) => (
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
                          {user.account_type === 'lawyer' ? t("pages:scheduleM.lawyer") : t("pages:scheduleM.client")}
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
                        
                        {user.experience && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{user.experience}</span>
                          </div>
                        )}

                        {/* Display lawyer charges for clients */}
                        {user.account_type === 'lawyer' && profile?.account_type === 'client' && (
                          <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md">
                            <Coins className="w-3 h-3 text-green-600" />
                            <span className="font-medium text-green-700">
                              {user.charges || 0} {t("pages:scheduleM.tokensPerHour")}
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
                      {t("pages:scheduleM.select")}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected User Info */}
            {selectedUser && (
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
                  
                  {/* Show consultation charges in meeting details */}
                  {selectedUser.account_type === 'lawyer' && profile?.account_type === 'client' && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded-md">
                      <Coins className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">
                        {t("pages:scheduleM.consultationRate")}: {selectedUser.charges || 0} {t("pages:scheduleM.tokensPerHour")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Meeting Link Only */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link">{t("pages:scheduleM.meetingLink")}</Label>
                <Input
                  id="link"
                  placeholder={t("scheduleM.pasteMeetingLink")}
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            {t("pages:scheduleM.cancel")}
          </Button>
          {currentStep === 'meetingDetails' && (
            <Button 
              onClick={handleMeetingLinkSubmit}
              disabled={sending || !meetingLink}
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t("pages:scheduleM.scheduling")}...
                </>
              ) : (
                t("pages:scheduleM.scheduleMeeting")
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}