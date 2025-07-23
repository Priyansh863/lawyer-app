"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import TokenBalance from "@/components/token/token-balance"
import TokenPurchase from "@/components/token/token-purchase"
import TokenHistory from "@/components/token/token-history"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, CreditCard, TrendingUp } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"

export default function TokenPage() {
  const { t } = useTranslation()
  const profile = useSelector((state: RootState) => state.auth.user)
  const token = useSelector((state: RootState) => state.auth.token)
  const [currentTokens, setCurrentTokens] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCurrentTokens()
  }, [])

  const fetchCurrentTokens = async () => {
    try {
      setLoading(true)
      // API call to get current user tokens
      const response = await fetch('/api/v1/user/tokens', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentTokens(data.tokens || 0)
      }
    } catch (error) {
      console.error('Error fetching tokens:', error)
      toast({
        title: t('common.error'),
        description: t('pages:tokens.fetchError'),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTokenPurchaseSuccess = (newTokens: number) => {
    setCurrentTokens(prev => prev + newTokens)
    toast({
      title: t('common.success'),
      description: t('pages:tokens.purchaseSuccess', { tokens: newTokens }),
      variant: "default"
    })
  }

  return (
    <div className="space-y-6"style={{ marginTop: "2.25rem" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('pages:tokens.title')}</h1>
          <p className="text-muted-foreground">
            {t('pages:tokens.description')}
          </p>
        </div>
        <div className="flex items-center gap-2 text-2xl font-bold">
          <Coins className="h-6 w-6 text-yellow-500" />
          <span>{loading ? "..." : currentTokens.toLocaleString()}</span>
          <span className="text-sm font-normal text-muted-foreground">{t('pages:tokens.tokens')}</span>
        </div>
      </div>

      {/* Token Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : currentTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,450</div>
            <p className="text-xs text-muted-foreground">Tokens used this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchased</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15,000</div>
            <p className="text-xs text-muted-foreground">Lifetime token purchases</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Balance & Usage */}
        <TokenBalance 
          currentTokens={currentTokens} 
          loading={loading}
          onRefresh={fetchCurrentTokens}
        />

        {/* Token Purchase */}
        <TokenPurchase 
          onPurchaseSuccess={handleTokenPurchaseSuccess}
        />
      </div>

      {/* Token History */}
      <TokenHistory />
    </div>
  )
}
