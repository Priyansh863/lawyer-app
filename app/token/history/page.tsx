'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Coins, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar, 
  User, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'

interface TokenTransaction {
  _id: string
  type: 'purchase' | 'usage' | 'refund'
  amount: number
  description: string
  category: string
  status: 'pending' | 'completed' | 'failed'
  reference_id?: string
  metadata?: {
    lawyerId?: string
    lawyerName?: string
    consultationType?: 'chat' | 'video'
    sessionId?: string
  }
  createdAt: string
}

interface TransactionHistory {
  transactions: TokenTransaction[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
  }
  currentBalance: number
  totalPurchased: number
  totalUsed: number
}

export default function TokenHistoryPage() {
  const [history, setHistory] = useState<TransactionHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()
  const profile = useSelector((state: RootState) => state.auth.user)
  const router = useRouter()
  const { t } = useTranslation()

  const getToken = () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user")
      return user ? JSON.parse(user).token : null
    }
    return null
  }

  const fetchTokenHistory = async (page: number = 1) => {
    if (!profile?._id) return

    setLoading(true)
    try {
      const token = getToken()
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/charges/token-history/${profile._id}?page=${page}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setHistory(data.data)
        setCurrentPage(page)
      } else {
        throw new Error('Failed to fetch token history')
      }
    } catch (error) {
      console.error('Error fetching token history:', error)
      toast({
        title: t('pages:common:error'),
        description: t('pages:tokenHistory:toast.failedToLoad'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTokenHistory()
  }, [profile?._id])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ArrowUpCircle className="h-4 w-4 text-green-600" />
      case 'usage':
        return <ArrowDownCircle className="h-4 w-4 text-red-600" />
      case 'refund':
        return <ArrowUpCircle className="h-4 w-4 text-blue-600" />
      default:
        return <Coins className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'text-green-600'
      case 'usage':
        return 'text-red-600'
      case 'refund':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">{t('pages:tokenHistory:status.completed')}</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{t('pages:tokenHistory:status.pending')}</Badge>
      case 'failed':
        return <Badge variant="destructive">{t('pages:tokenHistory:status.failed')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTranslatedDescription = (description: string) => {
    if (description.includes('Professional Pack Purchase')) {
      return t('pages:tokenHistory:descriptions.professionalPack')
    } else if (description.includes('Starter Pack Purchase')) {
      return t('pages:tokenHistory:descriptions.starterPack')
    } else if (description.includes('Enterprise Pack Purchase')) {
      return t('pages:tokenHistory:descriptions.enterprisePack')
    } else if (description.includes('Token Purchase')) {
      return t('pages:tokenHistory:descriptions.tokenPurchase')
    }
    return description
  }

  const getTranslatedCategory = (category: string) => {
    if (category.includes('Token Purchase')) {
      return t('pages:tokenHistory:categories.tokenPurchase')
    }
    return category
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return t('pages:tokenHistory:invalidDate')
    }
  }

  if (loading && !history) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t('pages:tokenHistory:loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('pages:tokenHistory:title')}</h1>
          <p className="text-muted-foreground">
            {t('pages:tokenHistory:description')}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push('/token')}
          className="flex items-center gap-2"
        >
          <Coins className="h-4 w-4" />
          {t('pages:tokenHistory:buyMoreTokens')}
        </Button>
      </div>

      {/* Summary Cards */}
      {history && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('pages:tokenHistory:cards.currentBalance')}</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{history.currentBalance}</div>
              <p className="text-xs text-muted-foreground">{t('pages:tokenHistory:cards.availableTokens')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('pages:tokenHistory:cards.totalPurchased')}</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{history.totalPurchased}</div>
              <p className="text-xs text-muted-foreground">{t('pages:tokenHistory:cards.tokensBought')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('pages:tokenHistory:cards.totalUsed')}</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{history.totalUsed}</div>
              <p className="text-xs text-muted-foreground">{t('pages:tokenHistory:cards.tokensSpent')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('pages:tokenHistory:transactionHistory.title')}
          </CardTitle>
          <CardDescription>
            {t('pages:tokenHistory:transactionHistory.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history && history.transactions.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('pages:tokenHistory:tableHeaders.type')}</TableHead>
                      <TableHead>{t('pages:tokenHistory:tableHeaders.description')}</TableHead>
                      <TableHead>{t('pages:tokenHistory:tableHeaders.category')}</TableHead>
                      <TableHead>{t('pages:tokenHistory:tableHeaders.amount')}</TableHead>
                      <TableHead>{t('pages:tokenHistory:tableHeaders.status')}</TableHead>
                      <TableHead>{t('pages:tokenHistory:tableHeaders.date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.transactions.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(transaction.type)}
                            <span className="capitalize">{t(`pages:tokenHistory:transactionTypes.${transaction.type}`)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{getTranslatedDescription(transaction.description)}</p>
                            {transaction.metadata?.lawyerName && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {transaction.metadata.lawyerName}
                              </p>
                            )}
                            {transaction.metadata?.consultationType && (
                              <p className="text-xs text-muted-foreground capitalize">
                                {t(`pages:tokenHistory:consultationTypes.${transaction.metadata.consultationType}`)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getTranslatedCategory(transaction.category)}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${getTransactionColor(transaction.type)}`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(transaction.createdAt)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {history.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {t('pages:tokenHistory:pagination.showing', {
                      start: ((currentPage - 1) * 20) + 1,
                      end: Math.min(currentPage * 20, history.pagination.totalCount),
                      total: history.pagination.totalCount
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchTokenHistory(currentPage - 1)}
                      disabled={!history.pagination.hasPrev || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t('pages:tokenHistory:pagination.previous')}
                    </Button>
                    <span className="text-sm">
                      {t('pages:tokenHistory:pagination.pageInfo', {
                        current: currentPage,
                        total: history.pagination.totalPages
                      })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchTokenHistory(currentPage + 1)}
                      disabled={!history.pagination.hasNext || loading}
                    >
                      {t('pages:tokenHistory:pagination.next')}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('pages:tokenHistory:noTransactions.title')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('pages:tokenHistory:noTransactions.description')}
              </p>
              <Button onClick={() => router.push('/token')}>
                {t('pages:tokenHistory:noTransactions.button')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}