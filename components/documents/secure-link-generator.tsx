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
import { useTranslation } from "@/hooks/useTranslation";
import { generateSecureLink, getMySecureLinks, type SecureLink } from "@/lib/api/secure-link-api";
import { Shield, Copy, Eye, Loader2 } from "lucide-react";

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
  const { t } = useTranslation("secureLinks");
  
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
        title: t("pages:secureLink.errors.missingInfoTitle"),
        description: t("pages:secureLink.errors.missingInfoDesc"),
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t("pages:secureLink.errors.shortPasswordTitle"),
        description: t("pages:secureLink.errors.shortPasswordDesc"),
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
        title: t("pages:secureLink.success.generatedTitle"),
        description: t("pages:secureLink.success.generatedDesc", { name: response.data.client_name }),
        variant: "default",
      });

      setSelectedClient("");
      setPassword("");
      setExpiresIn("24");
    } catch (error: any) {
      toast({
        title: t("pages:secureLink.errors.errorTitle"),
        description: error.message || t("pages:secureLink.errors.errorDefault"),
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
        title: t("pages:secureLink.success.copiedTitle"),
        description: t("pages:secureLink.success.copiedDesc"),
        variant: "default",
      });
    }
  };

  const handleViewMyLinks = async () => {
    try {
      setIsLoadingLinks(true);
      const response = await getMySecureLinks(1, 20, "all");
      setMyLinks(response.data.links);
      setShowMyLinks(true);
    } catch (error: any) {
      toast({
        title: t("pages:secureLink.errors.errorTitle"),
        description: error.message || t("pages:secureLink.errors.errorDefault"),
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
      return <Badge variant="default" className="bg-green-100 text-green-800">{t("status.used")}</Badge>;
    } else if (expiresAt < now) {
      return <Badge variant="destructive">{t("pages:secureLink.status.expired")}</Badge>;
    } else {
      return <Badge variant="secondary">{t("pages:secureLink.status.active")}</Badge>;
    }
  };

  const selectedClientData = clients.find(c => c._id === selectedClient);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          {t("pages:secureLink.buttons.generateLink")}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="
          w-full 
          max-w-[800px] 
          sm:max-w-[700px] 
          lg:max-w-[800px] 
          max-h-[80vh] 
          overflow-y-auto 
          mx-auto 
          ml-0 
          md:ml-12 
          lg:ml-16
        "
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("pages:secureLink.title")}
          </DialogTitle>
          <DialogDescription>
            {t("pages:secureLink.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Generate New Link */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg">{t("pages:secureLink.generateNewLink")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("pages:secureLink.form.clientLabel")}</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("pages:secureLink.form.clientPlaceholder")} />
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
                <Label>{t("pages:secureLink.form.passwordLabel")}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("pages:secureLink.form.passwordPlaceholder")}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("pages:secureLink.form.expiryLabel")}</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t("pages:secureLink.expiry.1h")}</SelectItem>
                    <SelectItem value="6">{t("pages:secureLink.expiry.6h")}</SelectItem>
                    <SelectItem value="12">{t("pages:secureLink.expiry.12h")}</SelectItem>
                    <SelectItem value="24">{t("pages:secureLink.expiry.24h")}</SelectItem>
                    <SelectItem value="48">{t("pages:secureLink.expiry.48h")}</SelectItem>
                    <SelectItem value="72">{t("pages:secureLink.expiry.72h")}</SelectItem>
                    <SelectItem value="168">{t("pages:secureLink.expiry.1w")}</SelectItem>
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
                    {t("pages:secureLink.buttons.generating")}
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    {t("pages:secureLink.buttons.generateLink")}
                  </>
                )}
              </Button>

              {generatedLink && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-green-800">
                      {t("pages:secureLink.generatedFor", { name: `${selectedClientData?.first_name} ${selectedClientData?.last_name}` })}
                    </Label>
                    <Button size="sm" variant="outline" onClick={handleCopyLink}>
                      <Copy className="h-3 w-3 mr-1" />
                      {t("pages:secureLink.buttons.copy")}
                    </Button>
                  </div>
                  <div className="text-xs text-green-700 break-all bg-white p-2 rounded border">
                    {generatedLink}
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    {t("pages:secureLink.shareInfo")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
