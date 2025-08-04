"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coins, CreditCard, Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import TokenPurchaseDialog from "@/components/token/token-purchase-dialog"
import TokenTransactionList from "@/components/token/token-transaction-list"

interface TokenData {
  currentBalance: number
  totalPurchased: number
  transactions: any[]
}

export default function TokenPage() {
  const { t } = useTranslation()
  const profile = useSelector((state: RootState) => state.auth.user)
  const token = useSelector((state: RootState) => state.auth.token)
  const [tokenData, setTokenData] = useState<TokenData>({
    currentBalance: 0,
    totalPurchased: 0,
    transactions: []
  })
  const [loading, setLoading] = useState(true)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)

  // useEffect(() => {
  //   fetchTokenData()
  // }, [])

  // const fetchTokenData = async () => {
  //   try {
  //     setLoading(true)
  //     const response = await fetch("/api/token/overview", {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         "Content-Type": "application/json",
  //       },
  //     })
  //     if (response.ok) {
  //       const data = await response.json()
  //       setTokenData({
  //         currentBalance: data.currentBalance || 0,
  //         totalPurchased: data.totalPurchased || 0,
  //         transactions: data.transactions || []
  //       })
  //     }
  //   } catch (error) {
  //     console.error("Error fetching token data:", error)
  //     toast({
  //       title: t("common.error"),
  //       description: "Failed to fetch token data",
  //       variant: "destructive",
  //     })
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const handleTokenPurchaseSuccess = (newTokens: number) => {
    setTokenData(prev => ({
      ...prev,
      currentBalance: prev.currentBalance + newTokens,
      totalPurchased: prev.totalPurchased + newTokens
    }))
    setShowPurchaseDialog(false)
    // fetchTokenData() // Refresh data
    toast({
      title: t("common.success"),
      description: `Successfully purchased ${newTokens} tokens`,
      variant: "default",
    })
  }

  return (
    <div className="space-y-6" style={{ marginTop: "2.25rem" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Token Management</h1>
          <p className="text-muted-foreground">Manage your tokens and purchase history</p>
        </div>
        <Button onClick={() => setShowPurchaseDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Buy Tokens
        </Button>
      </div>

      {/* Token Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : tokenData.currentBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Available tokens</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchased</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : tokenData.totalPurchased.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime token purchases</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <TokenTransactionList transactions={tokenData.transactions} loading={loading} />

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Purchase Tokens</DialogTitle>
          </DialogHeader>
          <TokenPurchaseDialog 
            onSuccess={handleTokenPurchaseSuccess}
            onCancel={() => setShowPurchaseDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}