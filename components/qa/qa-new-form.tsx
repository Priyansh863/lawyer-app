"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { useState, useEffect } from "react"
import { 
  MessageSquare, 
  User, 
  Globe, 
  Star, 
  Users, 
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const qaSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  tags: z.string().optional(),
  selectedLawyer: z.string().optional(), // Optional lawyer selection
})

type QAFormData = z.infer<typeof qaSchema>

interface Lawyer {
  _id: string
  first_name: string
  last_name: string
  email: string
  specialization?: string[]
  rating?: number
  experience_years?: number
  profile_image?: string
  chat_fee?: number
  is_available?: boolean
}

// API functions
const submitQA = async (data: {
  question: string
  category: string
  tags?: string
  selectedLawyer?: string
  clientId: string
}) => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  const token = localStorage.getItem('authToken')
  
  const response = await fetch(`${API_BASE_URL}/qa/submit-public`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      ...data,
      isPublic: true, // All Q&As are now public by default
      isAnonymous: false // Remove anonymous option
    })
  })
  
  if (!response.ok) {
    throw new Error(`Submission failed: ${response.statusText}`)
  }
  
  return response.json()
}

const getLawyers = async () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  const token = localStorage.getItem('authToken')
  
  const response = await fetch(`${API_BASE_URL}/lawyers/list`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch lawyers: ${response.statusText}`)
  }
  
  return response.json()
}

export default function QANewFormEnhanced() {
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)
  const { toast } = useToast()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [loadingLawyers, setLoadingLawyers] = useState(true)
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null)

  const form = useForm<QAFormData>({
    resolver: zodResolver(qaSchema),
    defaultValues: {
      question: "",
      category: "general",
      tags: "",
      selectedLawyer: "",
    },
  })

  // Load lawyers on component mount
  useEffect(() => {
    loadLawyers()
  }, [])

  const loadLawyers = async () => {
    try {
      setLoadingLawyers(true)
      const response = await getLawyers()
      if (response.success) {
        setLawyers(response.lawyers || [])
      }
    } catch (error) {
      console.error('Error loading lawyers:', error)
      toast({
        title: "Error",
        description: "Failed to load lawyers list.",
        variant: "destructive"
      })
    } finally {
      setLoadingLawyers(false)
    }
  }

  const onSubmit = async (data: QAFormData) => {
    if (!user?._id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a question.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      const response = await submitQA({
        question: data.question,
        category: data.category,
        tags: data.tags,
        selectedLawyer: data.selectedLawyer,
        clientId: user._id as string
      })

      if (response.success) {
        toast({
          title: "Question Submitted!",
          description: "Your question has been posted publicly and lawyers can now respond."
        })
        
        // Reset form
        form.reset()
        setSelectedLawyer(null)
        
        // Redirect to Q&A list
        router.push('/qa')
      } else {
        throw new Error(response.message || 'Submission failed')
      }
    } catch (error: any) {
      console.error('Error submitting Q&A:', error)
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit question. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLawyerSelect = (lawyerId: string) => {
    const lawyer = lawyers.find(l => l._id === lawyerId)
    setSelectedLawyer(lawyer || null)
    form.setValue('selectedLawyer', lawyerId)
  }

  const categories = [
    { value: "general", label: "General Legal" },
    { value: "criminal", label: "Criminal Law" },
    { value: "civil", label: "Civil Law" },
    { value: "family", label: "Family Law" },
    { value: "business", label: "Business Law" },
    { value: "property", label: "Property Law" },
    { value: "employment", label: "Employment Law" },
    { value: "immigration", label: "Immigration Law" },
    { value: "tax", label: "Tax Law" },
    { value: "intellectual-property", label: "Intellectual Property" }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
          <MessageSquare className="h-8 w-8 text-blue-500" />
          Ask a Legal Question
        </h1>
        <p className="text-muted-foreground">
          Submit your legal question publicly and get answers from qualified lawyers
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Globe className="h-4 w-4 text-green-500" />
            <span>Public Q&A</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-blue-500" />
            <span>All Lawyers Can Respond</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span>Free to Ask</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Your Question
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Question */}
                  <FormField
                    control={form.control}
                    name="question"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Legal Question *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your legal question in detail. Include relevant facts and circumstances..."
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Legal Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a legal category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tags */}
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., contract, dispute, consultation (comma-separated)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Lawyer Selection */}
                  <FormField
                    control={form.control}
                    name="selectedLawyer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Lawyer (Optional)</FormLabel>
                        <Select onValueChange={handleLawyerSelect} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a specific lawyer (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Any Available Lawyer</SelectItem>
                            {lawyers.map((lawyer) => (
                              <SelectItem key={lawyer._id} value={lawyer._id}>
                                <div className="flex items-center gap-2">
                                  <span>{lawyer.first_name} {lawyer.last_name}</span>
                                  {lawyer.specialization && lawyer.specialization.length > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      ({lawyer.specialization[0]})
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting Question...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Submit Public Question
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Lawyer Info */}
          {selectedLawyer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Lawyer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedLawyer.profile_image} />
                      <AvatarFallback>
                        {selectedLawyer.first_name[0]}{selectedLawyer.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedLawyer.first_name} {selectedLawyer.last_name}
                      </p>
                      {selectedLawyer.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{selectedLawyer.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedLawyer.specialization && (
                    <div className="flex flex-wrap gap-1">
                      {selectedLawyer.specialization.slice(0, 3).map((spec, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {selectedLawyer.experience_years && (
                    <p className="text-sm text-muted-foreground">
                      {selectedLawyer.experience_years} years experience
                    </p>
                  )}
                  
                  {selectedLawyer.chat_fee && (
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-sm">
                        <strong>Chat Fee:</strong> ${selectedLawyer.chat_fee}/session
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* How it Works */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How Public Q&A Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Submit Your Question</p>
                  <p className="text-xs text-muted-foreground">
                    Your question will be posted publicly for all lawyers to see
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Lawyers Respond</p>
                  <p className="text-xs text-muted-foreground">
                    Qualified lawyers will provide free public answers
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Get Detailed Help</p>
                  <p className="text-xs text-muted-foreground">
                    For private consultation, start a paid chat session
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Lawyers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Available Lawyers ({lawyers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLawyers ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : lawyers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No lawyers available at the moment
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {lawyers.slice(0, 5).map((lawyer) => (
                    <div key={lawyer._id} className="flex items-center gap-2 p-2 rounded border">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={lawyer.profile_image} />
                        <AvatarFallback className="text-xs">
                          {lawyer.first_name[0]}{lawyer.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {lawyer.first_name} {lawyer.last_name}
                        </p>
                        {lawyer.specialization && lawyer.specialization[0] && (
                          <p className="text-xs text-muted-foreground truncate">
                            {lawyer.specialization[0]}
                          </p>
                        )}
                      </div>
                      {lawyer.is_available && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  ))}
                  {lawyers.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{lawyers.length - 5} more lawyers available
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
