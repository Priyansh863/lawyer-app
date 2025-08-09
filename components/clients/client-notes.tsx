"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"  // <-- add translation hook

interface ClientNotesProps {
  clientId: string
  notes: string
  onSave: (notes: string) => Promise<boolean>
}

export default function ClientNotes({ clientId, notes: initialNotes, onSave }: ClientNotesProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editableNotes, setEditableNotes] = useState(initialNotes)
  const { t } = useTranslation() // <-- translation instance

  const handleEdit = () => {
    setIsEditing(true)
    setEditableNotes(notes)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditableNotes(notes)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const success = await onSave(editableNotes)
      if (success) {
        setNotes(editableNotes)
        setIsEditing(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{t("pages:clientNotes.title")}</h3>
          {!isEditing ? (
            <Button size="sm" onClick={handleEdit}>
              {t("pages:clientNotes.edit")}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSaving}>
                {t("pages:clientNotes.cancel")}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    {t("pages:clientNotes.saving")}
                  </>
                ) : (
                  t("pages:clientNotes.save")
                )}
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <Textarea
            value={editableNotes}
            onChange={(e) => setEditableNotes(e.target.value)}
            placeholder={t("pages:clientNotes.placeholder")}
            className="min-h-[200px]"
            disabled={isSaving}
          />
        ) : (
          <div className="min-h-[200px] p-4 border rounded-md bg-gray-50">
            {notes ? (
              <p className="whitespace-pre-wrap">{notes}</p>
            ) : (
              <p className="text-muted-foreground">{t("pages:clientNotes.noNotes")}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
