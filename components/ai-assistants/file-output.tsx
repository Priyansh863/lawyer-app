"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Download, Save } from "lucide-react"
import { downloadSummary, saveToCase } from "@/lib/api/ai-assistants-api"
import { useToast } from "@/hooks/use-toast"
import { getCases } from "@/lib/api/cases-api"
import type { ProcessedFile } from "@/types/ai-assistant"
import { useEffect } from "react"
import type { Case } from "@/types/case"

interface FileOutputProps {
  processedFile: ProcessedFile
  onGenerateSummary: () => Promise<void>
  isGeneratingSummary: boolean
}

export function FileOutput({ processedFile, onGenerateSummary, isGeneratingSummary }: FileOutputProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [cases, setCases] = useState<Case[]>([])
  const [isLoadingCases, setIsLoadingCases] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadCases = async () => {
      setIsLoadingCases(true)
      try {
        const fetchedCases = await getCases({ status: "all" })
        setCases(fetchedCases)
      } catch (error) {
        console.error("Failed to load cases:", error)
      } finally {
        setIsLoadingCases(false)
      }
    }

    loadCases()
  }, [])

  const handleDownloadSummary = async () => {
    if (!processedFile.summary) return

    setIsDownloading(true)
    try {
      await downloadSummary(processedFile.id)
      toast({
        title: "Summary downloaded",
        description: "Your summary has been downloaded successfully",
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading the summary",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSaveToCase = async () => {
    if (!selectedCaseId || !processedFile.summary) return

    setIsSaving(true)
    try {
      await saveToCase(processedFile.id, selectedCaseId)
      toast({
        title: "Saved to case",
        description: "Your summary has been saved to the selected case",
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving the summary to the case",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {!processedFile.summary ? (
          <Button onClick={onGenerateSummary} disabled={isGeneratingSummary}>
            {isGeneratingSummary ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Summary...
              </>
            ) : (
              "Generate Summary"
            )}
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleDownloadSummary} disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Summary
                </>
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Select value={selectedCaseId} onValueChange={setSelectedCaseId} disabled={isLoadingCases || isSaving}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select case" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCases ? (
                    <SelectItem value="loading" disabled>
                      Loading cases...
                    </SelectItem>
                  ) : cases.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No cases available
                    </SelectItem>
                  ) : (
                    cases.map((caseItem) => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={handleSaveToCase}
                disabled={!selectedCaseId || isSaving}
                className="whitespace-nowrap"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save to Case
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      <Tabs defaultValue="original" className="mt-4">
        <TabsList>
          <TabsTrigger value="original">Original Text</TabsTrigger>
          <TabsTrigger value="summary" disabled={!processedFile.summary}>
            Summary
          </TabsTrigger>
        </TabsList>
        <TabsContent value="original">
          <Card>
            <CardContent className="p-4">
              <div className="whitespace-pre-wrap">{processedFile.extractedText}</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="summary">
          <Card>
            <CardContent className="p-4">
              <div className="whitespace-pre-wrap">{processedFile.summary}</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
