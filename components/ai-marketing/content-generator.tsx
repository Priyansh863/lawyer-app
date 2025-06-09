"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { generateContent, shareContent } from "@/lib/api/marketing-api"
import ContentDisplay from "@/components/ai-marketing/content-display"
import TemplateSelector from "@/components/ai-marketing/template-selector"
import type { MarketingTemplate, GeneratedContent } from "@/types/marketing"

interface ContentGeneratorProps {
  initialTemplates: MarketingTemplate[]
}

export default function ContentGenerator({ initialTemplates }: ContentGeneratorProps) {
  const [templates] = useState<MarketingTemplate[]>(initialTemplates)
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<MarketingTemplate | null>(null)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [activeTab, setActiveTab] = useState("templates")
  const { toast } = useToast()

  const handleTemplateSelect = (template: MarketingTemplate) => {
    setSelectedTemplate(template)
    setActiveTab("generate")

    // Pre-fill prompt based on template
    if (template.type === "christmas") {
      setPrompt("Please create Christmas post design")
    } else {
      setPrompt(template.defaultPrompt || "")
    }
  }

  const handleGenerateContent = async () => {
    if (!prompt.trim() || !selectedTemplate) return

    setIsGenerating(true)
    try {
      const content = await generateContent({
        prompt,
        templateId: selectedTemplate.id,
        templateType: selectedTemplate.type,
      })

      setGeneratedContent(content)
      setActiveTab("result")

      toast({
        title: "Content generated",
        description: "Your marketing content has been generated successfully",
      })
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "There was an error generating your content",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShareContent = async () => {
    if (!generatedContent) return

    try {
      await shareContent(generatedContent.id)
      toast({
        title: "Content shared",
        description: "Your content has been shared successfully",
      })
    } catch (error) {
      toast({
        title: "Share failed",
        description: "There was an error sharing your content",
        variant: "destructive",
      })
    }
  }

  const handleCopyLink = () => {
    if (!generatedContent?.shareUrl) return

    navigator.clipboard.writeText(generatedContent.shareUrl)
    toast({
      title: "Link copied",
      description: "The share link has been copied to your clipboard",
    })
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="generate" disabled={!selectedTemplate}>
              Generate
            </TabsTrigger>
            <TabsTrigger value="result" disabled={!generatedContent}>
              Result
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <TemplateSelector templates={templates} onSelectTemplate={handleTemplateSelect} />
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="prompt" className="text-sm font-medium">
                    Prompt
                  </label>
                  <Input
                    id="prompt"
                    placeholder="Describe what you want to generate..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <Button variant="outline" onClick={() => setActiveTab("templates")}>
                    Back to Templates
                  </Button>
                  <Button onClick={handleGenerateContent} disabled={!prompt.trim() || isGenerating}>
                    {isGenerating ? "Generating..." : "Generate Content"}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="result" className="space-y-4">
            {generatedContent && (
              <ContentDisplay
                content={generatedContent}
                onShare={handleShareContent}
                onCopyLink={handleCopyLink}
                onBack={() => setActiveTab("generate")}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
