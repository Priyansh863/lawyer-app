"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Users, Share2, X } from "lucide-react"
import {
  getAvailableLawyers,
  shareDocumentWithLawyers,
  unshareDocumentFromLawyer,
  type Lawyer
} from "@/lib/api/document-sharing-api"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"

interface ShareWithLawyerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: {
    id: string
    document_name: string
    privacy: string
    shared_with?: Lawyer[]
  }
  onShareUpdate?: (updatedDocument: any) => void
}

export function ShareWithLawyerDialog({
  open,
  onOpenChange,
  document,
  onShareUpdate
}: ShareWithLawyerDialogProps) {
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [selectedLawyers, setSelectedLawyers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const { toast } = useToast()
  const profile = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    if (open) {
      fetchLawyers()
      // Pre-select already shared lawyers
      const sharedLawyerIds = document.shared_with?.map(lawyer => lawyer._id) || []
      setSelectedLawyers(sharedLawyerIds)
    }
  }, [open, document.shared_with])

  const fetchLawyers = async () => {
    setIsFetching(true)
    try {
      const availableLawyers = await getAvailableLawyers()
      setLawyers(availableLawyers)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load lawyers",
        variant: "destructive"
      })
    } finally {
      setIsFetching(false)
    }
  }

  const handleLawyerToggle = (lawyerId: string) => {
    setSelectedLawyers(prev => 
      prev.includes(lawyerId)
        ? prev.filter(id => id !== lawyerId)
        : [...prev, lawyerId]
    )
  }

  const handleShare = async () => {
    if (!profile?._id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const currentlyShared = document.shared_with?.map(lawyer => lawyer._id) || []
      const toShare = selectedLawyers.filter(id => !currentlyShared.includes(id))
      const toUnshare = currentlyShared.filter(id => !selectedLawyers.includes(id))

      // Share with new lawyers
      if (toShare.length > 0) {
        await shareDocumentWithLawyers({
          documentId: document.id,
          lawyerIds: toShare,
          userId: profile._id
        })
      }

      // Unshare from removed lawyers
      for (const lawyerId of toUnshare) {
        await unshareDocumentFromLawyer({
          documentId: document.id,
          lawyerId,
          userId: profile._id
        })
      }

      toast({
        title: "Success",
        description: "Document sharing updated successfully"
      })

      // Update parent component
      if (onShareUpdate) {
        const updatedSharedWith = lawyers.filter(lawyer => selectedLawyers.includes(lawyer._id))
        onShareUpdate({
          ...document,
          shared_with: updatedSharedWith
        })
      }

      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update document sharing",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const isPrivateDocument = document.privacy === 'private'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share with Lawyer
          </DialogTitle>
          <DialogDescription>
            Share "{document.document_name}" with lawyers in your network.
            {!isPrivateDocument && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                Note: Only private documents can be shared with lawyers.
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {!isPrivateDocument ? (
          <div className="py-6 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>This document must be private to share with lawyers.</p>
          </div>
        ) : (
          <div className="py-4">
            {isFetching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading lawyers...</span>
              </div>
            ) : lawyers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No lawyers available</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {lawyers.map((lawyer) => {
                  const isSelected = selectedLawyers.includes(lawyer._id)
                  const wasOriginallyShared = document.shared_with?.some(l => l._id === lawyer._id)
                  
                  return (
                    <div
                      key={lawyer._id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleLawyerToggle(lawyer._id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleLawyerToggle(lawyer._id)}
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`/placeholder.svg?height=40&width=40&query=${encodeURIComponent(`${lawyer.first_name} ${lawyer.last_name}`)}`} />
                        <AvatarFallback>
                          {getInitials(lawyer.first_name, lawyer.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {lawyer.first_name} {lawyer.last_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {lawyer.email}
                        </p>
                      </div>
                      {wasOriginallyShared && (
                        <Badge variant="secondary" className="text-xs">
                          Currently Shared
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {document.shared_with && document.shared_with.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-sm font-medium mb-2">Currently shared with:</h4>
                  <div className="flex flex-wrap gap-2">
                    {document.shared_with.map((lawyer) => (
                      <Badge key={lawyer._id} variant="outline" className="text-xs">
                        {lawyer.first_name} {lawyer.last_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {isPrivateDocument && (
            <Button 
              onClick={handleShare} 
              disabled={isLoading || isFetching}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Update Sharing
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
