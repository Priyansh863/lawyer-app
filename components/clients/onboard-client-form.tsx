"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { UserPlus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/api/clients-api";

// ✅ Schema as a function so we can pass `t` for translations
const onboardClientSchema = (t: any) =>
  z.object({
    email: z.string().email(t("pages:client.onboard.errors.invalidEmail")),
  });

type OnboardClientFormData = z.infer<ReturnType<typeof onboardClientSchema>>;

interface OnboardClientFormProps {
  onClientCreated?: () => void;
}

export default function OnboardClientForm({ onClientCreated }: OnboardClientFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const form = useForm<OnboardClientFormData>({
    resolver: zodResolver(onboardClientSchema(t)),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: OnboardClientFormData) => {
    setIsLoading(true);
    try {
      const res: any = await createClient({
        email: data.email.trim(),
        account_type: "client",
      });

      if (res?.success) {
        toast({
          title: t("pages:client.onboard.successTitle"),
          description: t("pages:client.onboard.successDescription"),
          variant: "success",
        });
        form.reset();
        setIsOpen(false);

        if (onClientCreated) onClientCreated();
      } else {
        throw new Error(
          res?.message || t("pages:client.onboard.errorDescription")
        );
      }
    } catch (error: any) {
      toast({
        title: t("pages:client.onboard.errorTitle"),
        description:
          error.message || t("pages:client.onboard.errorDescription"),
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-black hover:bg-gray-800 text-white">
          <UserPlus className="h-4 w-4 mr-2" />
          {t("pages:client.onboard.button")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {t("pages:client.onboard.title")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("pages:client.onboard.email")} *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t(
                        "pages:client.onboard.emailPlaceholder"
                      )}
                      {...field}
                      className="bg-[#F5F5F5] border-gray-200"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                {t("pages:client.onboard.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("pages:client.onboard.creating")}
                  </>
                ) : (
                  t("pages:client.onboard.submit")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
