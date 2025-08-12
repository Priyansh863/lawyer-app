"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateSecureLink, getMySecureLinks, type SecureLink } from "@/lib/api/secure-link-api";
import { Shield, Copy, Clock, CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";

interface Client {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface SecureLinkGeneratorProps {
  clients: Client[];
}

export default function SecureLinkGenerator({ clients }: SecureLinkGeneratorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [password, setPassword] = useState("");
  const [expiresIn, setExpiresIn] = useState("24");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [myLinks, setMyLinks] = useState<SecureLink[]>([]);
  const [showMyLinks, setShowMyLinks] = useState(false);

  const handleGenerateLink = async () => {
    if (!selectedClient || !password) {
      toast({
        title: "Missing Information",
        description: "Please select a client and enter a password",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      const response = await generateSecureLink({
        client_id: selectedClient,
        password,
        expires_in_hours: parseInt(expiresIn),
      });

      setGeneratedLink(response.data.secure_url);
      toast({
        title: "Secure Link Generated",
        description: `Link created for ${response.data.client_name}`,
        variant: "default",
      });

      // Reset form
      setSelectedClient("");
      setPassword("");
      setExpiresIn("24");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate secure link",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast({
        title: "Link Copied",
        description: "Secure link copied to clipboard",
        variant: "default",
      });
    }
  };

  const handleViewMyLinks = async () => {
    try {
      setIsLoadingLinks(true);
      const response = await getMySecureLinks(1, 20, 'all');
      setMyLinks(response.data.links);
      setShowMyLinks(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load secure links",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLinks(false);
    }
  };

  const getStatusBadge = (link: SecureLink) => {
    const now = new Date();
    const expiresAt = new Date(link.expires_at);
    
    if (link.is_used) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Used</Badge>;
    } else if (expiresAt < now) {
      return <Badge variant="destructive">Expired</Badge>;
    } else {
      return <Badge variant="secondary">Active</Badge>;
    }
  };

  const selectedClientData = clients.find(c => c._id === selectedClient);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Generate Secure Link
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Secure Document Upload Links
          </DialogTitle>
          <DialogDescription>
            Generate password-protected links for clients to upload documents securely.
            Links expire after successful upload or when the time limit is reached.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generate New Link */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generate New Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Select Client</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.first_name} {client.last_name} ({client.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password (min 6 characters)"
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires">Expires In</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Hour</SelectItem>
                    <SelectItem value="6">6 Hours</SelectItem>
                    <SelectItem value="12">12 Hours</SelectItem>
                    <SelectItem value="24">24 Hours</SelectItem>
                    <SelectItem value="48">48 Hours</SelectItem>
                    <SelectItem value="72">72 Hours</SelectItem>
                    <SelectItem value="168">1 Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleGenerateLink} 
                disabled={isGenerating || !selectedClient || !password}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Generate Secure Link
                  </>
                )}
              </Button>

              {generatedLink && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-green-800">
                      Generated Link for {selectedClientData?.first_name} {selectedClientData?.last_name}
                    </Label>
                    <Button size="sm" variant="outline" onClick={handleCopyLink}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="text-xs text-green-700 break-all bg-white p-2 rounded border">
                    {generatedLink}
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    Share this link and password with your client. The link will expire after successful upload.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Secure Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                My Secure Links
                <Button size="sm" variant="outline" onClick={handleViewMyLinks} disabled={isLoadingLinks}>
                  {isLoadingLinks ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showMyLinks ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {myLinks.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No secure links generated yet
                    </p>
                  ) : (
                    myLinks.map((link) => (
                      <div key={link.link_id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">{link.client_name}</div>
                          {getStatusBadge(link)}
                        </div>
                        <div className="text-xs text-gray-500">
                          <div>Created: {new Date(link.created_at).toLocaleDateString()}</div>
                          <div>Expires: {new Date(link.expires_at).toLocaleDateString()}</div>
                          {link.used_at && (
                            <div>Used: {new Date(link.used_at).toLocaleDateString()}</div>
                          )}
                        </div>
                        {link.uploaded_document && (
                          <div className="text-xs bg-blue-50 p-2 rounded">
                            <div className="font-medium">Document Uploaded:</div>
                            <div>{link.uploaded_document.file_name}</div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  Click the eye icon to view your secure links
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
