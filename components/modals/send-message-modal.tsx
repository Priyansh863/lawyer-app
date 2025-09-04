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
import { sendMessage, type SendMessageData } from "@/lib/api/message-api";
import { useToast } from "@/hooks/use-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  account_type: "client" | "lawyer";
  profile_image?: string;
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
  const { toast } = useToast();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isLawyer = currentUser?.account_type === 'lawyer';

  // Fetch users based on current user's role
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen) return;
      
      try {
        setLoading(true);
        const response = await getRelatedUsers();
        
        // Debug log the response to understand its structure
        console.log('API Response:', response);
        
        // Handle the response based on its structure
        if (response.success) {
          // The response might be in different formats:
          // 1. { success: true, users: [...] } - from getClients()
          // 2. { success: true, data: [...] } - from getLawyers()
          const userList = response.users || response.data || [];
          console.log('Processed user list:', userList);
          setUsers(Array.isArray(userList) ? userList : []);
        } else {
          throw new Error(response.message || 'Failed to load users');
        }
      } catch (error) {
        console.error('Error in fetchUsers:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load users",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to prevent rapid firing of requests
    const timer = setTimeout(() => {
      fetchUsers();
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, toast]);

  const filteredUsers = users.filter(user => 
    (user.first_name + ' ' + user.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setCurrentStep('composeMessage');
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
        title: "Success",
        description: "Message sent successfully!",
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
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Set default subject based on user type
  useEffect(() => {
    if (selectedUser && !messageSubject) {
      const userType = isLawyer ? 'Client' : 'Lawyer';
      setMessageSubject(`Regarding ${userType} ${selectedUser.first_name} ${selectedUser.last_name}`);
    }
  }, [selectedUser, isLawyer]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
              ? `Select ${isLawyer ? 'Client' : 'Lawyer'}` 
              : 'New Message'}
          </DialogTitle>
        </DialogHeader>

        {currentStep === 'userSelection' ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${isLawyer ? 'clients' : 'lawyers'} by name or email...`}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading {isLawyer ? 'clients' : 'lawyers'}...
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
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.account_type === 'lawyer' ? 'Lawyer' : 'Client'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No {isLawyer ? 'clients' : 'lawyers'} found
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>To:</Label>
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
              <Label htmlFor="subject">Subject:</Label>
              <Input
                id="subject"
                placeholder="Subject"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message:</Label>
              <Textarea
                id="message"
                placeholder={`Type your message to ${selectedUser?.first_name || ''}...`}
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
                Back
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!messageContent.trim() || loading}
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
