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
import { createChat } from "@/lib/api/chat-api";
import { useRouter } from "next/navigation";

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  account_type: "client" | "lawyer";
  profile_image?: string;
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
  const { toast } = useToast();
  const router = useRouter();
  
  const user = useSelector((state: RootState) => state.auth.user);
  const isLawyer = user?.account_type === 'lawyer';
  const targetUserType = isLawyer ? 'client' : 'lawyer';

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      try {
        const response = await getRelatedUsers({
          userType: targetUserType,
          search: searchQuery,
        });
        setUsers(response.data || []);
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
      // Create a new chat with the selected user
      const response = await createChat({ 
        lawyerId: isLawyer ? user._id : targetUser._id,
        clientId: isLawyer ? targetUser._id : user._id
      });
      
      // Close the modal and navigate to the chat
      onClose();
      router.push(`/chat/${response.data._id}`);
      
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {isLawyer ? "Select Client to Chat" : "Select Lawyer to Chat"}
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
            ) : users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleStartChat(user)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={user.profile_image} />
                      <AvatarFallback>
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
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
  );
}
