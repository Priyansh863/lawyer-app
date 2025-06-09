"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Note {
  id: string
  content: string
  createdAt: string
  createdBy: string
}

interface CaseNotesProps {
  caseId: string
}

export default function CaseNotes({ caseId }: CaseNotesProps) {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "note1",
      content: "Initial consultation completed. Client provided all necessary documents.",
      createdAt: "2025-03-24T10:30:00Z",
      createdBy: "Joseph",
    },
    {
      id: "note2",
      content: "Reviewed contract terms. Found potential issues in section 3.2 regarding payment terms.",
      createdAt: "2025-03-25T14:15:00Z",
      createdBy: "Joseph",
    },
  ])
  const [newNote, setNewNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    setIsSubmitting(true)
    try {
      // In a real app, this would call an API
      const note: Note = {
        id: `note${Date.now()}`,
        content: newNote,
        createdAt: new Date().toISOString(),
        createdBy: "Joseph", // Would come from auth context
      }

      setNotes([...notes, note])
      setNewNote("")
      toast({
        title: "Note added",
        description: "Your note has been added to the case",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Add Note</h3>
          <div className="space-y-4">
            <Textarea
              placeholder="Add a note about this case..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
            />
            <Button onClick={handleAddNote} disabled={isSubmitting || !newNote.trim()}>
              {isSubmitting ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Case Notes</h3>
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No notes yet</div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{note.createdBy}</span>
                    <span className="text-sm text-muted-foreground">{formatDate(note.createdAt)}</span>
                  </div>
                  <p>{note.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
