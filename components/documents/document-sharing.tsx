'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Share2, 
  Search, 
  Users, 
  UserCheck, 
  UserX, 
  Lock, 
  Globe,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { 
  getLawyersForSharing, 
  shareDocument, 
  unshareDocument,
  getDocumentSharingDetails,
  type Document,
  type Lawyer
} from '@/lib/api/documents-api-enhanced'
import { toast } from 'sonner'

interface DocumentSharingProps {
  isOpen: boolean
  onClose: () => void
  document: Document | null
  onSharingUpdate: () => void
}

export default function DocumentSharing({ 
  isOpen, 
  onClose, 
  document, 
  onSharingUpdate 
}: DocumentSharingProps) {
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [selectedLawyers, setSelectedLawyers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [currentlySharedWith, setCurrentlySharedWith] = useState<string[]>([])

  // Get user from Redux store
  const user = useSelector((state: RootState) => state.auth.user)
  const isClient = user?.account_type === 'client'

  // Load lawyers and current sharing details
  useEffect(() => {
    if (isOpen && document && isClient) {
      loadLawyers()
      loadSharingDetails()
    }
  }, [isOpen, document, isClient])

  const loadLawyers = async () => {
    setIsLoading(true)
    try {
      const response = await getLawyersForSharing()
      if (response.success && response.lawyers) {
        setLawyers(response.lawyers)
      }
    } catch (error: any) {
      console.error('Error loading lawyers:', error)
      toast.error('Failed to load lawyers')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSharingDetails = async () => {
    if (!document?._id) return
    
    try {
      const response = await getDocumentSharingDetails(document._id)
      if (response.success && response.document) {
        const sharedIds = response.document.shared_with.map((lawyer: any) => lawyer._id)
        setCurrentlySharedWith(sharedIds)
        setSelectedLawyers(sharedIds)
      }
    } catch (error: any) {
      console.error('Error loading sharing details:', error)
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
    if (!document?._id) return

    setIsSharing(true)
    try {
      // Find lawyers to add and remove
      const lawyersToAdd = selectedLawyers.filter(id => !currentlySharedWith.includes(id))
      const lawyersToRemove = currentlySharedWith.filter(id => !selectedLawyers.includes(id))

      // Share with new lawyers
      if (lawyersToAdd.length > 0) {
        const shareResponse = await shareDocument(document._id, lawyersToAdd)
        if (!shareResponse.success) {
          throw new Error(shareResponse.message || 'Failed to share document')
        }
      }

      // Unshare from removed lawyers
      for (const lawyerId of lawyersToRemove) {
        const unshareResponse = await unshareDocument(document._id, lawyerId)
        if (!unshareResponse.success) {
          console.warn(`Failed to unshare from lawyer ${lawyerId}`)
        }
      }

      toast.success('Document sharing updated successfully')
      setCurrentlySharedWith(selectedLawyers)
      onSharingUpdate()
      onClose()
    } catch (error: any) {
      console.error('Error updating sharing:', error)
      toast.error(error.message || 'Failed to update document sharing')
    } finally {
      setIsSharing(false)
    }
  }

  const filteredLawyers = lawyers.filter(lawyer =>
    `${lawyer.first_name} ${lawyer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lawyer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lawyer.pratice_area?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const handleClose = () => {
    if (!isSharing) {
      setSearchTerm('')
      setSelectedLawyers([])
      onClose()
    }
  }

  if (!document) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Document
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Document Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{document.document_name}</h3>
                <p className="text-sm text-gray-600">
                  Privacy: {document.privacy === 'private' ? (
                    <Badge variant="secondary" className="ml-1">
                      <Lock className="h-3 w-3 mr-1" />
                      Private
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="ml-1">
                      <Globe className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Currently shared with {currentlySharedWith.length} lawyer(s)
                </p>
              </div>
            </div>
          </div>

          {/* Access Control Check */}
          {!isClient && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-700">
                Only document owners can manage sharing settings
              </p>
            </div>
          )}

          {/* Private Document Check */}
          {document.privacy !== 'private' && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-700">
                Only private documents can be shared with specific lawyers. Public documents are visible to all lawyers.
              </p>
            </div>
          )}

          {/* Lawyer Selection (only for clients with private documents) */}
          {isClient && document.privacy === 'private' && (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search lawyers by name, email, or practice area..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Lawyers List */}
              <div className="flex-1 overflow-y-auto border rounded-lg">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading lawyers...</span>
                  </div>
                ) : filteredLawyers.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    {searchTerm ? 'No lawyers found matching your search' : 'No lawyers available'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredLawyers.map((lawyer) => {
                      const isSelected = selectedLawyers.includes(lawyer._id)
                      const wasOriginallyShared = currentlySharedWith.includes(lawyer._id)
                      
                      return (
                        <div
                          key={lawyer._id}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                          onClick={() => handleLawyerToggle(lawyer._id)}
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleLawyerToggle(lawyer._id)}
                            />
                            
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={lawyer.profile_image} />
                              <AvatarFallback>
                                {getInitials(lawyer.first_name, lawyer.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">
                                  {lawyer.first_name} {lawyer.last_name}
                                </h4>
                                {wasOriginallyShared && (
                                  <Badge variant="outline" className="text-xs">
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Currently Shared
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{lawyer.email}</p>
                              {lawyer.pratice_area && (
                                <p className="text-xs text-gray-500">
                                  Practice Area: {lawyer.pratice_area}
                                </p>
                              )}
                              {lawyer.experience && (
                                <p className="text-xs text-gray-500">
                                  Experience: {lawyer.experience}
                                </p>
                              )}
                            </div>

                            {isSelected ? (
                              <UserCheck className="h-5 w-5 text-blue-600" />
                            ) : (
                              <UserX className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Selection Summary */}
              {selectedLawyers.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-blue-700">
                      Document will be shared with {selectedLawyers.length} lawyer(s)
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSharing}
          >
            Cancel
          </Button>
          {isClient && document.privacy === 'private' && (
            <Button
              onClick={handleShare}
              disabled={isSharing || isLoading}
              className="min-w-[120px]"
            >
              {isSharing ? (
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
