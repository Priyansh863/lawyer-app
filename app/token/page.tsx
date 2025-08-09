"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { useSearchParams, useRouter } from "next/navigation"
import type { RootState } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Coins, 
  CreditCard, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  TrendingUp, 
  Calendar, 
  Download,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ExternalLink
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
import axios from "axios"

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

// Types
interface TokenBalance {
  current_balance: number
  total_purchased: number
  total_used: number
  monthly_usage: number
  last_monthly_reset: string
}

interface TokenTransaction {
  _id: string
  user_id: string
  type: 'purchase' | 'usage' | 'refund' | 'bonus'
  amount: number
  description: string
  category: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  stripe_payment_intent_id?: string
  stripe_session_id?: string
  package_id?: string
  package_name?: string
  created_at: string
  updated_at: string
}

interface TokenStats {
  current_balance: number
  total_purchased: number
  monthly_usage: number
  usage_by_category: Record<string, number>
  recent_transactions: TokenTransaction[]
}

interface PaymentSession {
  sessionId: string
  status: string
  paymentStatus: string
  amountTotal: number
  currency: string
  customerEmail: string
  metadata: Record<string, any>
  transaction?: TokenTransaction
  tokenBalance?: TokenBalance
}

// Token packages configuration - synced with backend
const TOKEN_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    tokens: 1000,
    price: 9.99,
    description: '1,000 AI tokens for basic usage',
    popular: false
  },
  professional: {
    id: 'professional',
    name: 'Professional Pack',
    tokens: 5000,
    price: 39.99,
    description: '5,000 AI tokens with 20% bonus (6,000 total)',
    popular: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Pack',
    tokens: 15000,
    price: 99.99,
    description: '15,000 AI tokens with 50% bonus (22,500 total)',
    popular: false
  }
}

// API Functions
const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
})

const getTokenBalance = async (token: string): Promise<TokenBalance> => {
  const response = await axios.get(`${API_BASE_URL}/user/tokens`, {
    headers: getAuthHeaders(token)
  })
  return response.data.data
}

const getTokenTransactions = async (token: string, page = 1, limit = 20, type?: string): Promise<{
  transactions: TokenTransaction[]
  pagination: {
    currentPage: number
    totalPages: number
    totalTransactions: number
    hasNext: boolean
    hasPrev: boolean
  }
}> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  })
  
  if (type) {
    params.append('type', type)
  }

  const response = await axios.get(`${API_BASE_URL}/user/token-transactions?${params}`, {
    headers: getAuthHeaders(token)
  })
  return response.data.data
}

const getTokenStats = async (token: string): Promise<TokenStats> => {
  const response = await axios.get(`${API_BASE_URL}/user/token-stats`, {
    headers: getAuthHeaders(token)
  })
  return response.data.data
}

const createCheckoutSession = async (token: string, packageId: string): Promise<{ url: string; sessionId: string }> => {
  const response = await axios.post(`${API_BASE_URL}/stripe/create-checkout-session`, {
    packageId
  }, {
    headers: getAuthHeaders(token)
  })
  return response.data.data
}

const verifyPaymentSession = async (token: string, sessionId: string): Promise<PaymentSession> => {
  const response = await axios.get(`${API_BASE_URL}/stripe/verify-session/${sessionId}`, {
    headers: getAuthHeaders(token)
  })
  return response.data.data
}

const exportTokenTransactions = async (token: string): Promise<Blob> => {
  const response = await axios.get(`${API_BASE_URL}/user/token-transactions/export`, {
    headers: getAuthHeaders(token),
    responseType: 'blob'
  })
  return response.data
}

export default function TokenPage() {
  const { t } = useTranslation()
  const profile:any = useSelector((state: RootState) => state.auth.user)
  const token = profile?.token
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // State
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null)
  const [transactions, setTransactions] = useState<TokenTransaction[]>([])
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'error' | null>(null)
  const [paymentMessage, setPaymentMessage] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Check for payment success/error on page load
  useEffect(() => {
    const success = searchParams.get('success')
    const cancelled = searchParams.get('cancelled')
    const sessionId = searchParams.get('session_id')
    
    if (success === 'true' && sessionId && token) {
      handlePaymentSuccess(sessionId)
    } else if (cancelled === 'true' || success === 'false') {
      setPaymentStatus('error')
      setPaymentMessage('Payment was cancelled or failed. Please try again.')
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. No charges were made.",
        variant: "destructive",
      })
    }

    // Clean up URL parameters after handling
    if (success || cancelled || sessionId) {
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams, token])

  // Fetch initial data
  useEffect(() => {
    if (profile && token) {
      fetchAllData()
    }
  }, [profile, token])

  const fetchAllData = async () => {
    if (!token) return
    
    setLoading(true)
    try {
      await Promise.all([
        fetchTokenBalance(),
        fetchTransactions(),
        fetchTokenStats()
      ])
    } catch (error) {
      console.error('Error fetching token data:', error)
      toast({
        title: "Error",
        description: "Failed to load token data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTokenBalance = async () => {
    if (!token) return
    
    try {
      const balance = await getTokenBalance(token)
      setTokenBalance(balance)
    } catch (error: any) {
      console.error('Error fetching token balance:', error)
    }
  }

  const fetchTransactions = async (page = 1) => {
    if (!token) return
    
    setTransactionsLoading(true)
    try {
      const result = await getTokenTransactions(token, page, 10)
      setTransactions(result.transactions)
      setCurrentPage(result.pagination.currentPage)
      setTotalPages(result.pagination.totalPages)
    } catch (error: any) {
      console.error('Error fetching transactions:', error)
    } finally {
      setTransactionsLoading(false)
    }
  }

  const fetchTokenStats = async () => {
    if (!token) return
    
    try {
      const stats = await getTokenStats(token)
      setTokenStats(stats)
    } catch (error: any) {
      console.error('Error fetching token stats:', error)
    }
  }

  const handlePaymentSuccess = async (sessionId: string) => {
    if (!token) return
    
    try {
      setLoading(true)
      const paymentSession = await verifyPaymentSession(token, sessionId)
      
      if (paymentSession.paymentStatus === 'paid') {
        setPaymentStatus('success')
        const tokensAdded = paymentSession.transaction?.amount || 0
        setPaymentMessage(`Payment successful! ${tokensAdded.toLocaleString()} tokens have been added to your account.`)
        
        // Refresh data to show updated balance
        await fetchAllData()
        
        toast({
          title: "Payment Successful! 🎉",
          description: `${tokensAdded.toLocaleString()} tokens have been added to your account.`,
        })
      } else {
        setPaymentStatus('error')
        setPaymentMessage('Payment verification failed. Please contact support if tokens were not added.')
        toast({
          title: "Payment Verification Failed",
          description: "Please contact support if you were charged but tokens were not added.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setPaymentStatus('error')
      setPaymentMessage(error.message || 'Failed to verify payment. Please contact support.')
      toast({
        title: "Verification Error",
        description: error.message || 'Failed to verify payment. Please contact support.',
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseTokens = async (packageId: string) => {
    if (!profile || !token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase tokens.",
        variant: "destructive",
      })
      return
    }

    setPurchaseLoading(packageId)
    try {
      const { url, sessionId } = await createCheckoutSession(token, packageId)
      
      if (url) {
        // Store session ID for verification later
        sessionStorage.setItem('stripe_session_id', sessionId)
        
        // Redirect to Stripe checkout
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to create checkout session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPurchaseLoading(null)
    }
  }

  const handleExportTransactions = async () => {
    if (!token) return
    
    try {
      const blob = await exportTokenTransactions(token)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `token-transactions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Export Successful",
        description: "Transaction history has been downloaded.",
      })
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export transactions",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'bonus':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'usage':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />
      case 'refund':
        return <RefreshCw className="h-4 w-4 text-blue-600" />
      default:
        return <Coins className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      cancelled: 'outline'
    } as const
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // Show loading if no token or still loading
  if (!token || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading token data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6" style={{ marginTop: "2.25rem" }}>
      {/* Payment Status Alert */}
      {paymentStatus && (
        <Alert className={paymentStatus === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {paymentStatus === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={paymentStatus === 'success' ? 'text-green-800' : 'text-red-800'}>
            {paymentMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Token Management</h1>
          <p className="text-muted-foreground">Manage your AI tokens and purchase history</p>
        </div>
        <Button onClick={() => fetchAllData()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Token Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokenBalance?.current_balance?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Available tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchased</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokenBalance?.total_purchased?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Lifetime purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokenBalance?.monthly_usage?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Token Packages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Purchase Tokens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(TOKEN_PACKAGES).map((pkg) => (
              <Card key={pkg.id} className={`relative ${pkg.popular ? 'border-primary' : ''}`}>
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-4 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <div className="text-3xl font-bold">${pkg.price}</div>
                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    onClick={() => handlePurchaseTokens(pkg.id)}
                    disabled={purchaseLoading === pkg.id}
                    className="w-full"
                  >
                    {purchaseLoading === pkg.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Redirecting to Stripe...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Buy {pkg.tokens.toLocaleString()} Tokens
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          <Button onClick={handleExportTransactions} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading transactions...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions found</p>
              <p className="text-sm">Purchase tokens to see your transaction history</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(transaction.created_at)}
                        {transaction.package_name && ` • ${transaction.package_name}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`font-medium ${
                        transaction.type === 'usage' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'usage' ? '-' : '+'}{transaction.amount.toLocaleString()} tokens
                      </div>
                      <div className="text-sm text-muted-foreground">{transaction.category}</div>
                    </div>
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <Button 
                    onClick={() => fetchTransactions(currentPage - 1)}
                    disabled={currentPage === 1 || transactionsLoading}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button 
                    onClick={() => fetchTransactions(currentPage + 1)}
                    disabled={currentPage === totalPages || transactionsLoading}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
