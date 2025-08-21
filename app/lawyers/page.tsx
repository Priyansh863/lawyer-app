'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Search, Filter, Users, Coins } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { useRouter } from 'next/navigation'
import LawyerCard from '@/components/ui/lawyer-card'
import TokenBalanceDisplay from '@/components/ui/token-balance-display'

interface Lawyer {
  _id: string
  first_name: string
  last_name: string
  email: string
  profile_image?: string
  pratice_area?: string
  experience?: string
  charges?: number
}

export default function LawyersPage() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [filteredLawyers, setFilteredLawyers] = useState<Lawyer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [practiceAreaFilter, setPracticeAreaFilter] = useState('')
  const [experienceFilter, setExperienceFilter] = useState('')
  const [priceFilter, setPriceFilter] = useState('')
  const { toast } = useToast()
  const profile = useSelector((state: RootState) => state.auth.user)
  const router = useRouter()

  useEffect(() => {
    fetchLawyers()
  }, [])

  useEffect(() => {
    filterLawyers()
  }, [lawyers, searchTerm, practiceAreaFilter, experienceFilter, priceFilter])

  const fetchLawyers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/charges/lawyers-with-charges`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLawyers(data.lawyers || [])
      } else {
        throw new Error('Failed to fetch lawyers')
      }
    } catch (error) {
      console.error('Error fetching lawyers:', error)
      toast({
        title: 'Error',
        description: 'Failed to load lawyers',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterLawyers = () => {
    let filtered = lawyers

    // Search by name
    if (searchTerm) {
      filtered = filtered.filter(lawyer =>
        `${lawyer.first_name} ${lawyer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lawyer.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by practice area
    if (practiceAreaFilter) {
      filtered = filtered.filter(lawyer => lawyer.pratice_area === practiceAreaFilter)
    }

    // Filter by experience
    if (experienceFilter) {
      filtered = filtered.filter(lawyer => lawyer.experience === experienceFilter)
    }

    // Filter by price
    if (priceFilter) {
      filtered = filtered.filter(lawyer => {
        const charges = lawyer.charges || 0
        switch (priceFilter) {
          case 'free':
            return charges === 0
          case 'low':
            return charges > 0 && charges <= 50
          case 'medium':
            return charges > 50 && charges <= 100
          case 'high':
            return charges > 100
          default:
            return true
        }
      })
    }

    setFilteredLawyers(filtered)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setPracticeAreaFilter('')
    setExperienceFilter('')
    setPriceFilter('')
  }

  const handleChatCreated = (chatId: string) => {
    router.push(`/chat?id=${chatId}`)
  }

  const handleMeetingCreated = (meetingId: string) => {
    router.push(`/video-consultations?meeting=${meetingId}`)
  }

  const practiceAreas = [
    { value: 'corporate', label: 'Corporate Law' },
    { value: 'family', label: 'Family Law' },
    { value: 'criminal', label: 'Criminal Law' },
    { value: 'immigration', label: 'Immigration Law' },
    { value: 'intellectual', label: 'Intellectual Property' },
    { value: 'real-estate', label: 'Real Estate Law' }
  ]

  const experienceOptions = [
    { value: '1', label: '1-2 years' },
    { value: '3', label: '3-5 years' },
    { value: '6', label: '6-9 years' },
    { value: '10', label: '10+ years' }
  ]

  const priceOptions = [
    { value: 'free', label: 'Free Consultations' },
    { value: 'low', label: '1-50 tokens' },
    { value: 'medium', label: '51-100 tokens' },
    { value: 'high', label: '100+ tokens' }
  ]

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading lawyers...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Find Legal Experts</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Connect with experienced lawyers for consultations. Browse by practice area, experience, and consultation rates.
        </p>
      </div>

      {/* Client Token Balance */}
      {profile?.account_type === 'client' && (
        <div className="max-w-md mx-auto">
          <TokenBalanceDisplay />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Lawyers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Practice Area */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Practice Area</label>
              <Select value={practiceAreaFilter} onValueChange={setPracticeAreaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All areas</SelectItem>
                  {practiceAreas.map((area) => (
                    <SelectItem key={area.value} value={area.value}>
                      {area.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Experience</label>
              <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All levels</SelectItem>
                  {experienceOptions.map((exp) => (
                    <SelectItem key={exp.value} value={exp.value}>
                      {exp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Consultation Rate</label>
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All rates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All rates</SelectItem>
                  {priceOptions.map((price) => (
                    <SelectItem key={price.value} value={price.value}>
                      {price.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || practiceAreaFilter || experienceFilter || priceFilter) && (
            <div className="mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filteredLawyers.length} lawyer{filteredLawyers.length !== 1 ? 's' : ''} found
          </span>
        </div>
        
        {profile?.account_type === 'client' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Coins className="h-4 w-4" />
            <span>Consultation rates shown in tokens</span>
          </div>
        )}
      </div>

      {/* Lawyers Grid */}
      {filteredLawyers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No lawyers found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or clearing the filters.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLawyers.map((lawyer) => (
            <LawyerCard
              key={lawyer._id}
              lawyer={lawyer}
              onChatCreated={handleChatCreated}
              onMeetingCreated={handleMeetingCreated}
            />
          ))}
        </div>
      )}
    </div>
  )
}
