"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Download, Save } from "lucide-react"
import { downloadSummary, saveToCase } from "@/lib/api/ai-assistants-api"
import { useToast } from "@/hooks/use-toast"
import { getCases } from "@/lib/api/cases-api"
import type { ProcessedFile } from "@/types/ai-assistant"
import type { Case } from "@/types/case"
import { useTranslation } from "@/hooks/useTranslation"

interface FileOutputProps {
  processedFile: ProcessedFile
  onGenerateSummary: () => Promise<void>
  isGeneratingSummary: boolean
}

export function FileOutput({ processedFile, onGenerateSummary, isGeneratingSummary }: FileOutputProps) {
  const { t } = useTranslation()
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
        setCases(fetchedCases.cases)
      } catch (error) {
        console.error("Failed to load cases:", error)
        toast({
          title: t("pages:fileOutput.errors.loadCasesFailed.title"),
          description: t("pages:fileOutput.errors.loadCasesFailed.description"),
          variant: "destructive",
        })
      } finally {
        setIsLoadingCases(false)
      }
    }

    loadCases()
  }, [toast, t])

  const handleDownloadSummary = async () => {
    if (!processedFile.summary) return

    setIsDownloading(true)
    try {
      await downloadSummary(processedFile.id)
      toast({
        title: t("pages:fileOutput.success.download.title"),
        description: t("pages:fileOutput.success.download.description"),
      })
    } catch (error) {
      toast({
        title: t("pages:fileOutput.errors.downloadFailed.title"),
        description: t("pages:fileOutput.errors.downloadFailed.description"),
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
        title: t("pages:fileOutput.success.saveToCase.title"),
        description: t("pages:fileOutput.success.saveToCase.description"),
      })
    } catch (error) {
      toast({
        title: t("pages:fileOutput.errors.saveFailed.title"),
        description: t("pages:fileOutput.errors.saveFailed.description"),
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
                {t("pages:fileOutput.generatingSummary")}
              </>
            ) : (
              t("pages:fileOutput.generateSummary")
            )}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={handleDownloadSummary}
              disabled={isDownloading}
              className="whitespace-nowrap"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("pages:fileOutput.downloading")}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {t("pages:fileOutput.downloadSummary")}
                </>
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Select 
                value={selectedCaseId} 
                onValueChange={setSelectedCaseId} 
                disabled={isLoadingCases || isSaving}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t("pages:fileOutput.selectCasePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCases ? (
                    <SelectItem value="loading" disabled>
                      {t("pages:fileOutput.loadingCases")}
                    </SelectItem>
                  ) : cases.length === 0 ? (
                    <SelectItem value="none" disabled>
                      {t("pages:fileOutput.noCasesAvailable")}
                    </SelectItem>
                  ) : (
                    cases.map((caseItem) => (
                      <SelectItem key={caseItem._id} value={caseItem._id as string}>
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
                    {t("pages:fileOutput.saving")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("pages:fileOutput.saveToCase")}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      <Tabs defaultValue="original" className="mt-4">
        <TabsList>
          <TabsTrigger value="original">
            {t("pages:fileOutput.tabs.originalText")}
          </TabsTrigger>
          <TabsTrigger value="summary" disabled={!processedFile.summary}>
            {t("pages:fileOutput.tabs.summary")}
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