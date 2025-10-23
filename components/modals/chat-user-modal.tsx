"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MessageSquare, ArrowLeft } from "lucide-react";
import { getRelatedUsers } from "@/lib/api/users-api";
import { useToast } from "@/hooks/use-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { SimpleChat } from "@/components/chat/simple-chat";

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

interface ChatUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatUserModal({
  isOpen,
  onClose,
}: ChatUserModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showChat, setShowChat] = useState(false);
  const { toast } = useToast();
  
  const user = useSelector((state: RootState) => state.auth.user);
  const isLawyer = user?.account_type === 'lawyer';
  const targetUserType = isLawyer ? 'client' : 'lawyer';

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      try {
        const response = await getRelatedUsers();
          console.log('Fetched responseresponseresponseresponseresponse:', response.users);
        setUsers(response.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, searchQuery, targetUserType, toast]);

  const handleStartChat = async (targetUser: User) => {
    try {
      setLoading(true);
      setSelectedUser(targetUser);
      setShowChat(true);
      
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedUser(null);
    onClose();
  };

  const filteredUsers = users.filter(user => 
    `${user.first_name} ${user.last_name} ${user.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Dialog open={isOpen && !showChat} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Select Client
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${targetUserType}s...`}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((targetUser) => (
                  <div
                    key={targetUser._id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleStartChat(targetUser)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={targetUser.profile_image} />
                        <AvatarFallback>
                          {targetUser.first_name?.[0]}{targetUser.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {targetUser.first_name} {targetUser.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                        {targetUser.email} 
                        </p>
                        {/* Show chat rate for lawyers when clients are selecting */}
                        {targetUser.account_type === 'lawyer' ? (
                          <p className="text-xs text-green-600 font-medium">
                            Chat: {targetUser.chat_rate} tokens/hour
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Chat
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No {targetUserType}s found
                </div>
              )}
            </div>
          </div>
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
