"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, User, Mail, Send, ArrowLeft } from "lucide-react";
import { getRelatedUsers } from "@/lib/api/users-api";
import { sendMessage, type SendMessageData } from "@/lib/api/simple-chat-api";
import { useToast } from "@/hooks/use-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { SimpleChat } from "@/components/chat/simple-chat";
import { useTranslation } from "@/hooks/useTranslation";

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  account_type: "client" | "lawyer";
  profile_image?: string;
  chat_rate?: number;
  video_rate?: number;
}

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMessageSent?: () => void;
}

type ModalStep = 'userSelection' | 'composeMessage';

export default function SendMessageModal({
  isOpen,
  onClose,
  onMessageSent,
}: SendMessageModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentStep, setCurrentStep] = useState<ModalStep>('userSelection');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [showChat, setShowChat] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isLawyer = currentUser?.account_type === 'lawyer';

  // Fetch users based on current user's role
  useEffect(() => {
    let isMounted = true;
    
    const fetchUsers = async () => {
      if (!isOpen) return;
      
      try {
        setLoading(true);
        const response = await getRelatedUsers();
        
        if (!isMounted) return;
        
        if (response.success) {
          const userList = response.users || response.data || [];
          console.log('Raw user list:', userList);
          console.log('Processed user list:', userList);
          setUsers(Array.isArray(userList) ? userList : []);
        } else {
          throw new Error(response.message || t('pages:sendMessage.failedToLoadUsers'));
        }
      } catch (error) {
        console.error('Error in fetchUsers:', error);
        if (isMounted) {
          toast({
            title: t('pages:sendMessage.error'),
            description: error instanceof Error ? error.message : t('pages:sendMessage.failedToLoadUsers'),
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Only fetch if the modal is open and we don't have users yet
    if (isOpen && users.length === 0) {
      const timer = setTimeout(() => {
        fetchUsers();
      }, 100);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, [isOpen, t]);

  const filteredUsers = users.filter(user => 
    (user.first_name + ' ' + user.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleUserSelect = (user: User) => {
    // Open chat modal instead of navigating to chat page
    setSelectedUser(user);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedUser(null);
    onClose();
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !messageContent.trim()) return;

    try {
      setLoading(true);
      await sendMessage({
        recipientId: selectedUser._id,
        subject: messageSubject,
        content: messageContent,
      });

      toast({
        title: t('pages:sendMessage.success'),
        description: t('pages:sendMessage.messageSentSuccessfully'),
      });

      // Reset form
      setMessageSubject("");
      setMessageContent("");
      setSelectedUser(null);
      setCurrentStep('userSelection');
      
      // Notify parent component
      if (onMessageSent) {
        onMessageSent();
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: t('pages:sendMessage.error'),
        description: error.message || t('pages:sendMessage.failedToSendMessage'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Set default subject based on user type
  useEffect(() => {
    if (selectedUser && !messageSubject) {
      const userType = isLawyer ? t('pages:sendMessage.client') : t('pages:sendMessage.lawyer');
      setMessageSubject(t('pages:sendMessage.regardingUser', {
        userType,
        firstName: selectedUser.first_name,
        lastName: selectedUser.last_name
      }));
    }
  }, [selectedUser, isLawyer, t]);

  return (
    <>
      <Dialog open={isOpen && !showChat} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {currentStep === 'composeMessage' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -ml-2"
                  onClick={() => setCurrentStep('userSelection')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {currentStep === 'userSelection' 
                ? t('pages:sendMessage.selectUser', { 
                    userType: isLawyer ? t('pages:sendMessage.client') : t('pages:sendMessage.lawyer') 
                  })
                : t('pages:sendMessage.newMessage')
              }
            </DialogTitle>
          </DialogHeader>

          {currentStep === 'userSelection' ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('pages:sendMessage.searchPlaceholder', {
                    userType: isLawyer ? t('pages:sendMessage.clients') : t('pages:sendMessage.lawyers')
                  })}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('pages:sendMessage.loadingUsers', {
                      userType: isLawyer ? t('pages:sendMessage.clients') : t('pages:sendMessage.lawyers')
                    })}
                  </div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleUserSelect(user)}
                    >
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={user.profile_image} alt={user.first_name} />
                        <AvatarFallback>
                          {user.first_name?.[0]}
                          {user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                        {/* Show chat rate for lawyers when clients are selecting */}
                        {user.account_type === 'lawyer'  ? (
                          <div className="text-xs text-green-600 font-medium">
                            {t('pages:sendMessage.chatRate', { rate: user.chat_rate })}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.account_type === 'lawyer' ? t('pages:sendMessage.lawyer') : t('pages:sendMessage.client')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('pages:sendMessage.noUsersFound', {
                      userType: isLawyer ? t('pages:sendMessage.clients') : t('pages:sendMessage.lawyers')
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('pages:sendMessage.to')}</Label>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedUser?.profile_image} alt={selectedUser?.first_name} />
                    <AvatarFallback>
                      {selectedUser?.first_name?.[0]}
                      {selectedUser?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">
                      {selectedUser?.first_name} {selectedUser?.last_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedUser?.email}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">{t('pages:sendMessage.subject')}</Label>
                <Input
                  id="subject"
                  placeholder={t('pages:sendMessage.subjectPlaceholder')}
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t('pages:sendMessage.message')}</Label>
                <Textarea
                  id="message"
                  placeholder={t('pages:sendMessage.messagePlaceholder', {
                    firstName: selectedUser?.first_name || ''
                  })}
                  className="min-h-[150px]"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                />
              </div>

              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('userSelection')}
                  disabled={loading}
                >
                  {t('pages:sendMessage.back')}
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim() || loading}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? t('pages:sendMessage.sending') : t('pages:sendMessage.sendMessage')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Modal */}
      {showChat && selectedUser && (
        <SimpleChat
          onClose={handleCloseChat}
          clientId={selectedUser._id}
          clientName={`${selectedUser.first_name} ${selectedUser.last_name}`}
          clientAvatar={selectedUser.profile_image}
          chatRate={selectedUser.chat_rate}
        />
      )}
    </>
  );
}