"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Video, FileText, Download, ExternalLink } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const searchFormSchema = z.object({
  query: z.string(),
})

type SearchFormData = z.infer<typeof searchFormSchema>

interface VideoConsultation {
  id: string
  clientName: string
  scheduledTime: string
  status: "pending" | "rejected" | "approved"
  transcriptAccess: string
  videoLink?: string
  hasTranscript?: boolean
}

interface VideoConsultationTableProps {
  initialConsultations: VideoConsultation[]
}

export default function VideoConsultationTable({ initialConsultations }: VideoConsultationTableProps) {
  const [consultations, setConsultations] = useState<VideoConsultation[]>(initialConsultations)
  const [filteredConsultations, setFilteredConsultations] = useState<VideoConsultation[]>(initialConsultations)
  const [selectedConsultation, setSelectedConsultation] = useState<VideoConsultation | null>(null)
  const { toast } = useToast()

  const searchForm = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      query: "",
    },
  })

  const watchedQuery = searchForm.watch("query")

  // Filter consultations based on search query
  useState(() => {
    if (!watchedQuery.trim()) {
      setFilteredConsultations(consultations)
    } else {
      const filtered = consultations.filter((consultation) =>
        consultation.clientName.toLowerCase().includes(watchedQuery.toLowerCase()),
      )
      setFilteredConsultations(filtered)
    }
  }, [watchedQuery, consultations])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
            Pending
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            Rejected
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            Approved
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleStartCall = (consultation: VideoConsultation) => {
    if (consultation.videoLink) {
      // Open the video link in a new tab
      window.open(consultation.videoLink, "_blank")
    } else {
      toast({
        title: "Starting call",
        description: `Starting video call for consultation ${consultation.id}`,
      })
    }
  }

  const handleReschedule = (consultationId: string) => {
    toast({
      title: "Reschedule",
      description: `Opening reschedule dialog for consultation ${consultationId}`,
    })
  }

  const handleViewTranscript = (consultation: VideoConsultation) => {
    setSelectedConsultation(consultation)
  }

  const handleDownloadTranscript = (type: "original" | "summary") => {
    if (!selectedConsultation) return

    toast({
      title: "Downloading transcript",
      description: `Downloading ${type} transcript for consultation with ${selectedConsultation.clientName}`,
    })

    // In a real app, this would trigger an actual download
    const text =
      type === "original"
        ? `Original transcript for consultation with ${selectedConsultation.clientName} on ${formatDate(selectedConsultation.scheduledTime, true)}`
        : `Summary transcript for consultation with ${selectedConsultation.clientName} on ${formatDate(selectedConsultation.scheduledTime, true)}`

    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${type}-transcript-${selectedConsultation.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleGenerateTranscript = (consultationId: string) => {
    toast({
      title: "Generating transcript",
      description: "Automatically generating transcript from video consultation recording",
    })
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Form {...searchForm}>
          <FormField
            control={searchForm.control}
            name="query"
            render={({ field }) => (
              <FormItem className="flex-1 relative">
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Search consultations..."
                      {...field}
                      className="bg-[#F5F5F5] border-gray-200 pl-10"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
      </div>

      {/* Consultations Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
          <div className="min-w-[1000px] relative">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Client Name</TableHead>
                  <TableHead className="min-w-[150px]">Scheduled Time</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[140px]">Transcript Access</TableHead>
                  <TableHead className="min-w-[280px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsultations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No consultations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConsultations.map((consultation, index) => (
                    <TableRow key={consultation.id} className={index % 2 === 0 ? "bg-gray-100" : ""}>
                      <TableCell className="min-w-[120px]">{consultation.clientName}</TableCell>
                      <TableCell className="min-w-[150px]">{formatDate(consultation.scheduledTime, true)}</TableCell>
                      <TableCell className="min-w-[100px]">{getStatusBadge(consultation.status)}</TableCell>
                      <TableCell className="min-w-[140px]">{consultation.transcriptAccess}</TableCell>
                      <TableCell className="min-w-[280px]">
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                            onClick={() => handleStartCall(consultation)}
                          >
                            {consultation.videoLink ? (
                              <>
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Join
                              </>
                            ) : (
                              <>
                                <Video className="h-3 w-3 mr-1" />
                                Start
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1"
                            onClick={() => handleReschedule(consultation.id)}
                          >
                            Reschedule
                          </Button>
                          {consultation.hasTranscript ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs px-2 py-1"
                                  onClick={() => handleViewTranscript(consultation)}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Transcript
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[625px]">
                                <DialogHeader>
                                  <DialogTitle>Video Consultation Transcript</DialogTitle>
                                  <DialogDescription>
                                    Consultation with {consultation.clientName} on{" "}
                                    {formatDate(consultation.scheduledTime, true)}
                                  </DialogDescription>
                                </DialogHeader>
                                <Tabs defaultValue="original" className="mt-4">
                                  <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="original">Original Transcript</TabsTrigger>
                                    <TabsTrigger value="summary">Summary</TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="original" className="mt-4">
                                    <div className="border rounded-md p-4 h-[300px] overflow-y-auto bg-gray-50">
                                      <p className="text-sm">
                                        <strong>Lawyer:</strong> Good morning, thank you for joining this consultation.
                                      </p>
                                      <p className="text-sm mt-2">
                                        <strong>Client:</strong> Good morning, thank you for making the time.
                                      </p>
                                      <p className="text-sm mt-2">
                                        <strong>Lawyer:</strong> Let's discuss the details of your case. Could you
                                        please provide an overview of the situation?
                                      </p>
                                      <p className="text-sm mt-2">
                                        <strong>Client:</strong> Of course. The issue began approximately three months
                                        ago when...
                                      </p>
                                      {/* More transcript content would go here */}
                                    </div>
                                    <div className="flex justify-end mt-4">
                                      <Button onClick={() => handleDownloadTranscript("original")}>
                                        <Download className="h-4 w-4 mr-1" />
                                        Download Original
                                      </Button>
                                    </div>
                                  </TabsContent>
                                  <TabsContent value="summary" className="mt-4">
                                    <div className="border rounded-md p-4 h-[300px] overflow-y-auto bg-gray-50">
                                      <h3 className="font-medium mb-2">Consultation Summary</h3>
                                      <p className="text-sm mb-2">
                                        This consultation covered the client's legal issue that began three months ago.
                                        The main points discussed were:
                                      </p>
                                      <ul className="list-disc pl-5 space-y-1 text-sm">
                                        <li>Background of the case and relevant timeline</li>
                                        <li>Legal options available to the client</li>
                                        <li>Potential outcomes and associated risks</li>
                                        <li>Next steps and documentation requirements</li>
                                      </ul>
                                      <h3 className="font-medium mt-4 mb-2">Action Items</h3>
                                      <ol className="list-decimal pl-5 space-y-1 text-sm">
                                        <li>Client to provide additional documentation by next week</li>
                                        <li>Lawyer to draft initial response letter</li>
                                        <li>Follow-up consultation scheduled for next month</li>
                                      </ol>
                                    </div>
                                    <div className="flex justify-end mt-4">
                                      <Button onClick={() => handleDownloadTranscript("summary")}>
                                        <Download className="h-4 w-4 mr-1" />
                                        Download Summary
                                      </Button>
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs px-2 py-1"
                              onClick={() => handleGenerateTranscript(consultation.id)}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Generate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Scroll indicator for better UX */}
            <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-white to-transparent pointer-events-none opacity-50"></div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="text-xs text-gray-500 text-center py-2 border-t bg-gray-50">
          <span className="inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Scroll horizontally to view all columns
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  )
}
