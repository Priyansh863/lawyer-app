'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Coins, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'

interface TokenBalanceDisplayProps {
  lawyerId?: string
  lawyerName?: string
  consultationType?: 'chat' | 'video'
  onProceed?: () => void
  showProceedButton?: boolean
}

interface TokenInfo {
  current_balance: number
  total_purchased: number
  total_used: number
  monthly_usage: number
}

interface LawyerInfo {
  _id: string
  name: string
  charges: number
  chat_rate: number
  video_rate: number
}

export default function TokenBalanceDisplay({ 
  lawyerId, 
  lawyerName, 
  consultationType = 'chat',
  onProceed,
  showProceedButton = false
}: TokenBalanceDisplayProps) {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [lawyerCharges, setLawyerCharges] = useState<number>(0)
  const [lawyerInfo, setLawyerInfo] = useState<LawyerInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const { toast } = useToast()
  const profile = useSelector((state: RootState) => state.auth.user)

  const getToken = () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user")
      return user ? JSON.parse(user).token : null
    }
    return null
  }

  // Only show for clients
  if (profile?.account_type !== 'client') {
    return null
  }

  useEffect(() => {
    if (profile?._id) {
      fetchTokenInfo()
    }
  }, [profile?._id])

  useEffect(() => {
    if (lawyerId) {
      fetchLawyerCharges()
    }
  }, [lawyerId, consultationType])

  const fetchTokenInfo = async () => {
    setLoading(true)
    try {
      const token = getToken()
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/charges/client-token-info/${profile?._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTokenInfo(data.tokenBalance)
      }
    } catch (error) {
      console.error('Error fetching token info:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLawyerCharges = async () => {
    if (!lawyerId) return
    
    try {
      const token = getToken()
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/charges/charges/${lawyerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const lawyer = data.user
        setLawyerInfo(lawyer)
        
        // Set the appropriate rate based on consultation type
        let rate = 0
        if (consultationType === 'chat') {
          rate = lawyer.chat_rate || lawyer.charges || 0
        } else if (consultationType === 'video') {
          rate = lawyer.video_rate || lawyer.charges || 0
        } else {
          rate = lawyer.charges || 0
        }
        
        setLawyerCharges(rate)
      }
    } catch (error) {
      console.error('Error fetching lawyer charges:', error)
    }
  }

  const checkTokenBalance = async () => {
    if (!lawyerId) return false

    setChecking(true)
    try {
      const token = getToken()
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/charges/check-token-balance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: profile?._id,
          lawyerId: lawyerId,
          consultationType: consultationType
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        toast({
          title: 'Insufficient Tokens',
          description: data.message,
          variant: 'destructive'
        })
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error checking token balance:', error)
      toast({
        title: 'Error',
        description: 'Failed to check token balance',
        variant: 'destructive'
      })
      return false
    } finally {
      setChecking(false)
    }
  }

  const handleProceed = async () => {
    const hasTokens = await checkTokenBalance()
    if (hasTokens && onProceed) {
      onProceed()
    }
  }

  const canAffordConsultation = tokenInfo && tokenInfo.current_balance >= lawyerCharges
  const needsTokens = lawyerCharges > 0 && (!tokenInfo || tokenInfo.current_balance < lawyerCharges)

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Token Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Your Token Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{tokenInfo?.current_balance || 0}</p>
              <p className="text-sm text-muted-foreground">Available Tokens</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/token" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Buy Tokens
              </a>
            </Button>
          </div>
          
          {tokenInfo && (
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Purchased</p>
                <p className="font-medium">{tokenInfo.total_purchased}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Used</p>
                <p className="font-medium">{tokenInfo.total_used}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consultation Cost Card */}
      {lawyerId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Consultation Details</CardTitle>
            {lawyerName && (
              <CardDescription>
                {consultationType === 'chat' ? 'Chat' : 'Video'} consultation with {lawyerName}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Consultation Cost:</span>
              <div className="flex items-center gap-2">
                <Badge variant={lawyerCharges === 0 ? "secondary" : "default"}>
                  {lawyerCharges === 0 ? 'FREE' : `${lawyerCharges} tokens`}
                </Badge>
              </div>
            </div>

            {lawyerCharges > 0 && (
              <>
                {canAffordConsultation ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      You have sufficient tokens for this consultation.
                      <br />
                      <strong>Remaining after consultation: {(tokenInfo?.current_balance || 0) - lawyerCharges} tokens</strong>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient tokens for this consultation.
                      <br />
                      <strong>You need {lawyerCharges - (tokenInfo?.current_balance || 0)} more tokens.</strong>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {showProceedButton && (
              <div className="mt-4">
                {needsTokens ? (
                  <Button asChild className="w-full">
                    <a href="/token">
                      Buy Tokens to Continue
                    </a>
                  </Button>
                ) : (
                  <Button 
                    onClick={handleProceed} 
                    disabled={checking}
                    className="w-full"
                  >
                    {checking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      `Start ${consultationType === 'chat' ? 'Chat' : 'Video Call'}`
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
