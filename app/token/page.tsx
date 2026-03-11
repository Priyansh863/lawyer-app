"use client"

import { useState, useEffect, useMemo } from "react"
import { useSelector } from "react-redux"
import { useSearchParams, useRouter } from "next/navigation"
import type { RootState } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Coins,
  CreditCard,
  TrendingUp,
  Calendar,
  ExternalLink
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
import axios from "axios"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import { cn } from "@/lib/utils"

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

// Token packages configuration
const TOKEN_PACKAGES = (t: any) => ({
  starter: {
    id: 'starter',
    name: t('pages:tok.token.packages.starter.name'),
    tokens: 1000,
    price: 9.99,
    description: t('pages:tok.token.packages.starter.description'),
    bonus: 0,
    bonusTokens: 0,
    popular: false
  },
  professional: {
    id: 'professional',
    name: t('pages:tok.token.packages.professional.name'),
    tokens: 5000,
    price: 39.99,
    description: t('pages:tok.token.packages.professional.description'),
    bonus: 20,
    bonusTokens: 1000,
    popular: true
  },
  enterprise: {
    id: 'enterprise',
    name: t('pages:tok.token.packages.enterprise.name'),
    tokens: 15000,
    price: 99.99,
    description: t('pages:tok.token.packages.enterprise.description'),
    bonus: 50,
    bonusTokens: 7500,
    popular: false
  }
})

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
  const profile: any = useSelector((state: RootState) => state.auth.user)
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
  const [activeTab, setActiveTab] = useState<'Overview' | 'Buy'>('Overview')

  const tokenPackages = TOKEN_PACKAGES(t)

  useEffect(() => {
    const success = searchParams.get('success')
    const cancelled = searchParams.get('cancelled')
    const sessionId = searchParams.get('session_id')

    if (success === 'true' && sessionId && token) {
      handlePaymentSuccess(sessionId)
    } else if (cancelled === 'true' || success === 'false') {
      setPaymentStatus('error')
      setPaymentMessage(t('pages:tok.token.payment.cancelled'))
      toast({
        title: t('pages:tok.token.toast.payment.cancelled.title'),
        description: t('pages:tok.token.toast.payment.cancelled.description'),
        variant: "destructive",
      })
    }

    if (success || cancelled || sessionId) {
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams, token, t])

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
        fetchTransactions(1),
        fetchTokenStats()
      ])
    } catch (error) {
      console.error('Error fetching token data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTokenBalance = async () => {
    if (!token) return
    try {
      const balance = await getTokenBalance(token)
      setTokenBalance(balance)
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
        setPaymentMessage(t('pages:tok.token.payment.success', { tokens: tokensAdded.toLocaleString() }))
        await fetchAllData()
        toast({
          title: t('pages:tok.token.toast.payment.success.title'),
          description: t('pages:tok.token.toast.payment.success.description', { tokens: tokensAdded.toLocaleString() }),
        })
      }
    } catch (error: any) {
      setPaymentStatus('error')
      setPaymentMessage(error.message || t('pages:tok.token.payment.genericError'))
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseTokens = async (packageId: string) => {
    if (!profile || !token) return
    setPurchaseLoading(packageId)
    try {
      const { url, sessionId } = await createCheckoutSession(token, packageId)
      if (url) {
        sessionStorage.setItem('stripe_session_id', sessionId)
        window.location.href = url
      }
    } catch (error: any) {
      toast({
        title: "Checkout Error",
        description: error.message,
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
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${month} ${day}, ${year} - ${hours}:${minutes} ${ampm}`;
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('pages:tok.token.loading')}</span>
      </div>
    )
  }

  return (
    <div className="pt-1 pb-4 px-2 max-w-[1700px] mx-auto">
      <div className="flex flex-col space-y-6">
        {/* Payment Status Alert */}
        {paymentStatus && (
          <Alert className={cn(
            "border-none shadow-md rounded-xl",
            paymentStatus === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          )}>
            <div className="flex items-center gap-3">
              {paymentStatus === 'success' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              <AlertDescription className="font-bold">{paymentMessage}</AlertDescription>
            </div>
          </Alert>
        )}

        {/* Header Section matching Video Consultations */}
        <div className="flex justify-between items-center px-1">
          <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">
            {t('pages:tok.token.management')}
          </h1>
        </div>

        {/* Tabs & Actions Row */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveTab('Overview')}
              className={cn(
                "relative pb-3 text-[15px] font-bold transition-all",
                activeTab === 'Overview'
                  ? "text-[#0F172A] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0F172A]"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t('pages:tok.token.overview')}
            </button>
            <button
              onClick={() => setActiveTab('Buy')}
              className={cn(
                "relative pb-3 text-[15px] font-bold transition-all",
                activeTab === 'Buy'
                  ? "text-[#0F172A] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0F172A]"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t('pages:tok.token.buyTokens')}
            </button>
          </div>

          {activeTab === 'Overview' && (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleExportTransactions}
                variant="outline"
                className="h-10 bg-[#F1F5F9] border-slate-300 text-[#0F172A] font-bold hover:bg-slate-200 transition-all rounded-md px-4 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {t('pages:tok.token.exportCSV')}
              </Button>
              <Button
                onClick={fetchAllData}
                className="h-10 bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold rounded-md px-6 transition-all"
              >
                {t('pages:tok.token.refresh')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        {activeTab === 'Overview' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Stat Cards */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-[#0F172A] font-bold text-[15px] mb-4">{t('pages:tok.token.currentBalance')}</p>
                  <div className="text-right">
                    <span className="text-[32px] font-bold text-[#0F172A] mr-2">
                      {loading ? <Skeleton width={60} /> : tokenBalance?.current_balance?.toLocaleString() || 0}
                    </span>
                    <span className="text-[20px] font-bold text-[#0F172A]">{t('pages:tok.token.tokens')}</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-[#0F172A] font-bold text-[15px] mb-4">{t('pages:tok.token.tokensUsed')}</p>
                  <div className="text-right">
                    <span className="text-[32px] font-bold text-[#0F172A] mr-2">
                      {loading ? <Skeleton width={60} /> : tokenBalance?.monthly_usage?.toLocaleString() || 0}
                    </span>
                    <span className="text-[20px] font-bold text-[#0F172A]">{t('pages:tok.token.tokens')}</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-[#0F172A] font-bold text-[15px] mb-4">{t('pages:tok.token.totalPurchased')}</p>
                  <div className="text-right">
                    <span className="text-[32px] font-bold text-[#0F172A] mr-2">
                      {loading ? <Skeleton width={60} /> : tokenBalance?.total_purchased?.toLocaleString() || 0}
                    </span>
                    <span className="text-[20px] font-bold text-[#0F172A]">{t('pages:tok.token.tokens')}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Transaction Table */}
              <div className="lg:col-span-8 border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm self-start">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-[#F1F5F9] border-b border-slate-300 text-left text-[#0F172A] text-[13px] font-bold">
                        <th className="px-5 py-3 font-bold">{t('pages:tok.token.paymentDetails')}</th>
                        <th className="px-5 py-3 font-bold">{t('pages:tok.token.tokens')}</th>
                        <th className="px-5 py-3 font-bold">{t('pages:tok.token.status')}</th>
                        <th className="px-5 py-3 font-bold">{t('pages:tok.token.date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading || transactionsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="animate-pulse border-b border-slate-200 last:border-0">
                            <td colSpan={4} className="px-6 py-6 bg-slate-50"></td>
                          </tr>
                        ))
                      ) : transactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-20 text-slate-500 bg-white italic font-bold">
                            {t('pages:tok.token.noTransactions')}
                          </td>
                        </tr>
                      ) : (
                        transactions.map((transaction) => (
                          <tr key={transaction._id} className="border-b border-slate-200 last:border-0 hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3">
                              <span className="text-[#0F172A] font-bold text-[13px]">{transaction.description}</span>
                            </td>
                            <td className="px-5 py-3">
                              <span className={cn(
                                "font-bold text-[13px]",
                                transaction.type === 'usage' ? 'text-red-600' : 'text-[#0F172A]'
                              )}>
                                {transaction.type === 'usage' ? '-' : '+'}{transaction.amount.toLocaleString()} {t('pages:tok.token.tokens')}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "h-2.5 w-2.5 rounded-full shrink-0",
                                  transaction.status === 'completed' ? "bg-[#4ADE80]" :
                                    transaction.status === 'pending' ? "bg-[#FFB600]" : "bg-[#EF4444]"
                                )} />
                                <span className="text-[#0F172A] font-bold text-[13px] capitalize">
                                  {transaction.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap">
                              <span className="text-[#0F172A] font-bold text-[13px]">
                                {formatDate(transaction.created_at)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-200">
                    <Button
                      onClick={() => fetchTransactions(currentPage - 1)}
                      disabled={currentPage === 1 || transactionsLoading}
                      variant="outline"
                      className="h-9 px-4 text-[13px] font-bold border-slate-300 text-[#0F172A] rounded-md transition-all"
                    >
                      {t('pages:tok.token.previous')}
                    </Button>
                    <div className="text-[13px] font-bold text-[#0F172A]">
                      {t('pages:tok.token.pageOf', { current: currentPage, total: totalPages })}
                    </div>
                    <Button
                      onClick={() => fetchTransactions(currentPage + 1)}
                      disabled={currentPage === totalPages || transactionsLoading}
                      variant="outline"
                      className="h-9 px-4 text-[13px] font-bold border-slate-300 text-[#0F172A] rounded-md transition-all"
                    >
                      {t('pages:tok.token.next')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Buy Tokens Tab - Perfected layout and alignment */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
            {Object.values(tokenPackages).map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white border border-slate-300 rounded-lg p-6 shadow-sm flex flex-col min-h-[360px]"
              >
                <div className="flex-1 flex flex-col">
                  {/* Title and Subtitle */}
                  <div className="space-y-1">
                    <h3 className="text-[20px] font-bold text-[#0F172A] tracking-tight">{pkg.name}</h3>
                    <p className="text-slate-600 font-bold text-[13px] leading-tight">{pkg.description}</p>
                  </div>

                  {/* Bonus Badge - positioned directly below the header info */}
                  {pkg.bonus > 0 && (
                    <div className="mt-4">
                      <div className="bg-[#4ADE80] text-white text-[10px] font-black px-3 py-1 rounded-full inline-block">
                        {t('pages:tok.token.bonus', { bonus: pkg.bonus })}
                      </div>
                    </div>
                  )}

                  {/* Token Count & Bonus Info - Pushed to bottom of the card content area */}
                  <div className="mt-auto text-right pb-1">
                    {pkg.bonus > 0 && (
                      <p className="text-[#4ADE80] font-bold text-[13px] mb-[-4px]">
                        {t('pages:tok.token.includesBonus', { tokens: pkg.bonusTokens.toLocaleString() })}
                      </p>
                    )}
                    <div className="flex items-baseline justify-end gap-2">
                      <span className="text-[28px] font-bold text-[#0F172A]">
                        {pkg.tokens.toLocaleString()}
                      </span>
                      <span className="text-[16px] font-bold text-[#0F172A]">{t('pages:tok.token.tokens')}</span>
                    </div>
                  </div>
                </div>

                {/* Purchase Button */}
                <div className="pt-3">
                  <Button
                    onClick={() => handlePurchaseTokens(pkg.id)}
                    disabled={purchaseLoading === pkg.id}
                    className="w-full h-13 bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold rounded-lg text-[18px] transition-all shadow-md"
                  >
                    {purchaseLoading === pkg.id ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" strokeWidth={3} />
                    ) : (
                      `$${pkg.price}`
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}