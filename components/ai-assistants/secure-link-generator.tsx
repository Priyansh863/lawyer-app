"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Copy, Link } from "lucide-react"
import { generateSecureLink } from "@/lib/api/ai-assistants-api"
import { useToast } from "@/hooks/use-toast"
import type { ProcessedFile } from "@/types/ai-assistant"

interface SecureLinkGeneratorProps {
  processedFile: ProcessedFile | null
}

export function SecureLinkGenerator({ processedFile }: SecureLinkGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [secureLink, setSecureLink] = useState<string>("")
  const [expiryDays, setExpiryDays] = useState<number>(7)
  const [usePassword, setUsePassword] = useState<boolean>(false)
  const [password, setPassword] = useState<string>("")
  const { toast } = useToast()

  const handleGenerateLink = async () => {
    setIsGenerating(true)
    try {
      if (!processedFile) {
        // If no file is selected, generate a secure upload link
        const result = await generateSecureLink({
          expiryDays,
          password: usePassword ? password : undefined,
        })
        setSecureLink(result.url)
      } else {
        // If a file is selected, generate a secure download link
        const result = await generateSecureLink({
          fileId: processedFile.id,
          expiryDays,
          password: usePassword ? password : undefined,
        })
        setSecureLink(result.url)
      }

      toast({
        title: "Secure link generated",
        description: "Your secure link has been generated successfully",
      })
    } catch (error) {
      toast({
        title: "Link generation failed",
        description: "There was an error generating the secure link",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secureLink)
    toast({
      title: "Copied to clipboard",
      description: "The secure link has been copied to your clipboard",
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Generate Secure Link</h3>
        <p className="text-sm text-muted-foreground">
          {processedFile
            ? "Generate a secure link to share this file with others."
            : "Generate a secure link that allows others to upload files to you."}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="expiry">Link expiry (days)</Label>
          <Input
            id="expiry"
            type="number"
            min={1}
            max={30}
            value={expiryDays}
            onChange={(e) => setExpiryDays(Number(e.target.value))}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="password-protection" checked={usePassword} onCheckedChange={setUsePassword} />
          <Label htmlFor="password-protection">Password protection</Label>
        </div>

        {usePassword && (
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a secure password"
            />
          </div>
        )}

        <Button onClick={handleGenerateLink} disabled={isGenerating || (usePassword && !password)}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Link className="mr-2 h-4 w-4" />
              Generate Secure Link
            </>
          )}
        </Button>
      </div>

      {secureLink && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label htmlFor="secure-link">Secure Link</Label>
              <div className="flex">
                <Input id="secure-link" value={secureLink} readOnly className="flex-1" />
                <Button variant="outline" size="icon" onClick={copyToClipboard} className="ml-2">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link will expire in {expiryDays} day{expiryDays !== 1 ? "s" : ""}.
                {usePassword && " The recipient will need the password to access the content."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
