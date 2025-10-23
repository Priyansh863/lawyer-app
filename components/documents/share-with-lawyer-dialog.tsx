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
import { useTranslation } from "@/hooks/useTranslation"
import { Loader2, Users, Share2, X } from "lucide-react"
import { getAvailableLawyers, getAvailableClients, shareDocumentWithLawyers, unshareDocumentFromLawyer } from '@/lib/api/document-sharing-api'
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"

interface ShareDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: {
    id: string
    document_name: string
    privacy: string
    shared_with?: any[]
  }
  onShareUpdate?: (updatedDocument: any) => void
}

export function ShareDocumentDialog({
  open,
  onOpenChange,
  document,
  onShareUpdate
}: ShareDocumentDialogProps) {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()
  const profile = useSelector((state: RootState) => state.auth.user)
  const isClient = profile?.account_type === 'client'

  useEffect(() => {
    if (open) {
      fetchUsers()
      // Pre-select already shared users
      const sharedUserIds = document.shared_with?.map((user: any) => user._id) || []
      setSelectedUsers(sharedUserIds)
    }
  }, [open, document.shared_with])

  const fetchUsers = async () => {
    setIsFetching(true)
    try {
      const availableUsers = isClient 
        ? await getAvailableLawyers() 
        : await getAvailableClients()
      setUsers(availableUsers)
    } catch (error) {
      toast({
        title: t('error'),
        description: t('pages:shar.failedToLoadUsers', { userType: isClient ? t('pages:shar.lawyers') : t('pages:shar.clients') }),
        variant: "destructive"
      })
    } finally {
      setIsFetching(false)
    }
  }

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleShare = async () => {
    if (!profile?._id) {
      toast({
        title: t('pages:shar.error'),
        description: t('pages:shar.userNotAuthenticated'),
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const currentlyShared = document.shared_with?.map((user: any) => user._id) || []
      const toShare = selectedUsers.filter((id: string) => !currentlyShared.includes(id))
      const toUnshare = currentlyShared.filter((id: string) => !selectedUsers.includes(id))

      // Share with new users
      if (toShare.length > 0) {
        await shareDocumentWithLawyers({
          documentId: document.id,
          userIds: toShare,
          userId: profile._id
        })
      }

      // Unshare from removed users
      for (const userId of toUnshare) {
        await unshareDocumentFromLawyer({
          documentId: document.id,
          lawyerId: userId,
          userId: profile._id
        })
      }

      toast({
        title: t('pages:shar.success'),
        description: t('pages:shar.documentSharingUpdated')
      })

      // Update parent component
      if (onShareUpdate) {
        const updatedSharedWith = users.filter((user: any) => selectedUsers.includes(user._id))
        onShareUpdate({
          ...document,
          shared_with: updatedSharedWith
        })
      }

      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('pages:shar.failedToUpdateSharing'),
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

   const getInitials = (firstName: string, lastName: string) => {
    if(firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    else return "NA";
  };

  const isPrivateDocument = document.privacy === 'private'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('pages:shar.shareWithUserType', { userType: isClient ? t('pages:shar.lawyers') : t('pages:shar.clients') })}
          </DialogTitle>
          <DialogDescription>
            {t('pages:shar.shareDocumentDescription', { 
              documentName: document.document_name,
              userType: isClient ? t('pages:shar.lawyers') : t('pages:shar.clients')
            })}
            {!isPrivateDocument && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                {t('pages:shar.privateDocumentSharingNote', { userType: isClient ? t('pages:shar.lawyers') : t('pages:shar.clients') })}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {!isPrivateDocument ? (
          <div className="py-6 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>{t('pages:shar.privateDocumentRequired')}</p>
          </div>
        ) : (
          <div className="py-4">
            {isFetching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">{t('pages:shar.loadingUsers', { userType: isClient ? t('pages:shar.lawyers') : t('pages:shar.clients') })}</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('pages:shar.noUsersAvailable', { userType: isClient ? t('pages:shar.lawyers') : t('pages:shar.clients') })}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {users.map((user: any) => {
                  const isSelected = selectedUsers.includes(user._id)
                  const wasOriginallyShared = document.shared_with?.some((l: any) => l._id === user._id)
                  
                  return (
                    <div
                      key={user._id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleUserToggle(user._id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleUserToggle(user._id)}
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`/placeholder.svg?height=40&width=40&query=${encodeURIComponent(`${user.first_name} ${user.last_name}`)}`} />
                        <AvatarFallback>
                          {getInitials(user.first_name, user.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      {wasOriginallyShared && (
                        <Badge variant="secondary" className="text-xs">
                          {t('pages:shar.currentlyShared')}
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('pages:shar.cancel')}
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
                  {t('pages:shar.updating')}
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('pages:shar.updateSharing')}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}