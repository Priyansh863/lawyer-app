"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  generateSecureLink,
  getMySecureLinks,
  updateSecureLinkPassword,
  type SecureLink,
} from "@/lib/api/secure-link-api";
import { Shield, Copy, Eye, Loader2, Pencil } from "lucide-react";

interface Client {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface SecureLinkGeneratorProps {
  clients: Client[];
  customTrigger?: React.ReactNode;
}

export default function SecureLinkGenerator({ clients, customTrigger }: SecureLinkGeneratorProps) {
  const { toast } = useToast();
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [isNonCustomerUser, setIsNonCustomerUser] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresIn, setExpiresIn] = useState("24");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [generatedClientName, setGeneratedClientName] = useState<string | null>(null);
  const [myLinks, setMyLinks] = useState<SecureLink[]>([]);
  const [showMyLinks, setShowMyLinks] = useState(false);
  const [hasLoadedLinks, setHasLoadedLinks] = useState(false);
  const [editingLink, setEditingLink] = useState<SecureLink | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<{ password?: string; confirm?: string }>({});
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const loadMyLinks = async () => {
    try {
      setIsLoadingLinks(true);
      const response = await getMySecureLinks(1, 20, "all");
      setMyLinks(response?.data?.links || []);
      setHasLoadedLinks(true);
    } catch (error: any) {
      setMyLinks([]);
      setHasLoadedLinks(true);
      toast({
        title: t("pages:secureLink.errors.errorTitle"),
        description: error.message || t("pages:secureLink.errors.errorDefault"),
        variant: "destructive",
      });
    } finally {
      setIsLoadingLinks(false);
    }
  };

  const validatePasswordForm = () => {
    const nextErrors: { password?: string; confirm?: string } = {};

    if (editPassword.trim().length < 6) {
      nextErrors.password = t("pages:secureLink.editPassword.errors.minLength");
    }

    if (confirmPassword !== editPassword) {
      nextErrors.confirm = t("pages:secureLink.editPassword.errors.mismatch");
    }

    setPasswordErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const isLinkActive = (link: SecureLink) => {
    if (link.status) return link.status === "active";
    return new Date(link.expires_at) >= new Date() && !link.is_used;
  };

  const handleGenerateLink = async () => {
    if (!password || (!selectedClient && !isNonCustomerUser)) {
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
        ...(isNonCustomerUser ? { non_customer_user: true } : { client_id: selectedClient }),
        password,
        expires_in_hours: parseInt(expiresIn),
      });

      setGeneratedLink(response.data.secure_url);
      setGeneratedClientName(
        response.data.client_name ||
          (isNonCustomerUser ? t("pages:secureLink.nonCustomer.generatedName") : "-")
      );
      const displayName =
        response.data.client_name ||
        (isNonCustomerUser ? t("pages:secureLink.nonCustomer.generatedName") : "-");
      toast({
        title: t("pages:secureLink.success.generatedTitle"),
        description: t("pages:secureLink.success.generatedDesc", { name: displayName }),
        variant: "default",
      });

      setSelectedClient("");
      setIsNonCustomerUser(false);
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
    setShowMyLinks(true);
    await loadMyLinks();
  };

  const openEditPasswordModal = (link: SecureLink) => {
    setEditingLink(link);
    setEditPassword("");
    setConfirmPassword("");
    setPasswordErrors({});
  };

  const handleSavePassword = async () => {
    if (!editingLink) return;
    if (!validatePasswordForm()) return;

    try {
      setIsSavingPassword(true);
      const response = await updateSecureLinkPassword(editingLink.link_id, editPassword.trim());
      toast({
        title: t("pages:secureLink.success.passwordUpdatedTitle"),
        description: t("pages:secureLink.success.passwordUpdatedDesc"),
      });

      const updatedLink = response?.data as SecureLink | undefined;
      if (updatedLink?.link_id) {
        setMyLinks((prev) => prev.map((link) => (link.link_id === updatedLink.link_id ? { ...link, ...updatedLink } : link)));
      } else {
        await loadMyLinks();
      }

      setEditingLink(null);
      setEditPassword("");
      setConfirmPassword("");
      setPasswordErrors({});
    } catch (error: any) {
      const status = error?.status;
      let description = error?.message || t("pages:secureLink.errors.passwordUpdateDefault");

      if (status === 403) {
        description = t("pages:secureLink.errors.notAllowed");
      } else if (status === 401) {
        description = t("pages:secureLink.errors.relogin");
      }

      toast({
        title: t("pages:secureLink.errors.errorTitle"),
        description,
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const getStatusBadge = (link: SecureLink) => {
    const now = new Date();
    const expiresAt = new Date(link.expires_at);

    if (expiresAt < now) {
      return <Badge variant="destructive">{t("pages:secureLink.status.expired")}</Badge>;
    } else {
      return <Badge variant="secondary">{t("pages:secureLink.status.active")}</Badge>;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setShowMyLinks(false);
      setHasLoadedLinks(false);
      setMyLinks([]);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {customTrigger ? customTrigger : (
          <Button variant="outline" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t("pages:secureLink.buttons.generateLink")}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="
    w-full 
    max-w-[800px] 
    max-h-[80vh] 
    overflow-y-auto 
    fixed
    left-1/2
    -translate-x-[calc(50%-20px)]
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

        <Dialog open={!!editingLink} onOpenChange={(open) => !open && setEditingLink(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("pages:secureLink.editPassword.title")}</DialogTitle>
              <DialogDescription>
                {t("pages:secureLink.editPassword.description", { name: editingLink?.client_name || "-" })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-secure-link-password">{t("pages:secureLink.editPassword.newPasswordLabel")}</Label>
                <Input
                  id="edit-secure-link-password"
                  type="password"
                  value={editPassword}
                  onChange={(e) => {
                    setEditPassword(e.target.value);
                    if (passwordErrors.password) {
                      setPasswordErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  placeholder={t("pages:secureLink.editPassword.newPasswordPlaceholder")}
                  minLength={6}
                />
                {passwordErrors.password ? (
                  <p className="text-sm text-destructive">{passwordErrors.password}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-secure-link-password-confirm">{t("pages:secureLink.editPassword.confirmPasswordLabel")}</Label>
                <Input
                  id="edit-secure-link-password-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordErrors.confirm) {
                      setPasswordErrors((prev) => ({ ...prev, confirm: undefined }));
                    }
                  }}
                  placeholder={t("pages:secureLink.editPassword.confirmPasswordPlaceholder")}
                  minLength={6}
                />
                {passwordErrors.confirm ? (
                  <p className="text-sm text-destructive">{passwordErrors.confirm}</p>
                ) : null}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingLink(null)}
                  disabled={isSavingPassword}
                >
                  {t("pages:secureLink.editPassword.cancel")}
                </Button>
                <Button type="button" onClick={handleSavePassword} disabled={isSavingPassword}>
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("pages:secureLink.editPassword.saving")}
                    </>
                  ) : (
                    t("pages:secureLink.editPassword.save")
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generate New Link */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg">{t("pages:secureLink.generateNewLink")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("pages:secureLink.form.clientLabel")}</Label>
                <Select
                  value={selectedClient}
                  onValueChange={(value) => {
                    setSelectedClient(value);
                    if (value) setIsNonCustomerUser(false);
                  }}
                  disabled={isNonCustomerUser}
                >
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

              <div className="flex items-start gap-3 rounded-md border p-3">
                <Checkbox
                  id="non-customer-user"
                  checked={isNonCustomerUser}
                  onCheckedChange={(checked) => {
                    const enabled = checked === true;
                    setIsNonCustomerUser(enabled);
                    if (enabled) setSelectedClient("");
                  }}
                />
                <div className="space-y-1">
                  <Label htmlFor="non-customer-user" className="font-medium cursor-pointer">
                    {t("pages:secureLink.nonCustomer.checkbox")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("pages:secureLink.nonCustomer.helper")}
                  </p>
                </div>
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
                disabled={isGenerating || (!selectedClient && !isNonCustomerUser) || !password}
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
                      {t("pages:secureLink.generatedFor", { name: generatedClientName || "-" })}
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

          {/* My Secure Links */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{t("pages:secureLink.myLinks")}</span>

              </CardTitle>
            </CardHeader>
            <CardContent>
              {showMyLinks ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {isLoadingLinks && !hasLoadedLinks ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t("pages:secureLink.buttons.loading")}
                    </p>
                  ) : myLinks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t("pages:secureLink.noLinks")}
                    </p>
                  ) : (
                    myLinks.map((link) => (
                      <div key={link.link_id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {link.client_name}
                          </span>
                          {getStatusBadge(link)}
                        </div>
                        <div className="text-xs text-muted-foreground break-all">
                          {link.secure_url}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {t("pages:secureLink.created")}: {new Date(link.created_at).toLocaleDateString()}
                          </span>
                          <span>
                            {t("pages:secureLink.expires")}: {new Date(link.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                        {isLinkActive(link) ? (
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => openEditPasswordModal(link)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              {t("pages:secureLink.editPassword.trigger")}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("pages:secureLink.viewExistingLinks")}
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleViewMyLinks}
                    disabled={isLoadingLinks}
                  >
                    {isLoadingLinks ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("pages:secureLink.buttons.loading")}
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        {t("pages:secureLink.buttons.viewMyLinks")}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}