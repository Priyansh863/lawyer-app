"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import type { Message } from "@/types/chat"

interface ChatSummaryProps {
  messages: Message[]
  onBack: () => void
}

export function ChatSummary({ messages, onBack }: ChatSummaryProps) {
  // Calculate total tokens used
  const totalTokens = messages.reduce((sum, msg) => sum + (msg.tokenCount || 0), 0)

  // Get user messages only
  const userMessages = messages.filter((msg) => msg.senderId === "current_user")

  // Get AI messages only
  const aiMessages = messages.filter((msg) => msg.senderId === "ai_assistant")

  // Generate a simple summary based on the conversation
  const generateSummary = () => {
    if (messages.length <= 1) {
      return "No substantial conversation to summarize."
    }

    //  this would use AI to generate a proper summary
    // For now, we'll just return a simple placeholder
    return "This conversation covered legal consultation topics. The client asked questions about their case, and the AI assistant provided guidance and information."
  }

  // Extract key points in a real app, this would be AI-generated
  const keyPoints = [
    "Client inquired about legal procedures",
    "Information was provided about documentation requirements",
    "Next steps were outlined for the client's case",
    "Follow-up actions were recommended",
  ]

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b flex items-center">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h3 className="font-medium">Chat Summary</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Session Statistics</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Messages:</span>
                <span>{messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Client Messages:</span>
                <span>{userMessages.length}</span>
              </div>
              <div className="flex justify-between">
                <span>AI Responses:</span>
                <span>{aiMessages.length}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Tokens Used:</span>
                <span>{totalTokens}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Conversation Summary</h4>
            <p className="text-sm text-gray-700">{generateSummary()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Key Points</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Next Steps</h4>
            <p className="text-sm text-gray-700">
              Based on this conversation, the recommended next steps are to schedule a follow-up consultation and
              prepare the requested documentation.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="p-3 border-t">
        <Button className="w-full">Download Summary</Button>
      </div>
    </div>
  )
}
