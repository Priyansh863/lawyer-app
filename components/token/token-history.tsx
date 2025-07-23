"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store" // Assuming this path is correct for your Redux store setup
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { History, Plus, Minus, FileText, MessageSquare, Sparkles, Download, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast" // Assuming this path is correct for your toast utility

interface Transaction {
  id: string
  type: "purchase" | "usage"
  amount: number
  description: string
  category: string
  date: string
  status: "completed" | "pending" | "failed"
  reference?: string
}

export default function TokenHistory() {
  // The useSelector hook is used to access the Redux store state [^1].
  const profile = useSelector((state: RootState) => state.auth.user)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  // The useEffect hook is used to perform side effects, such as data fetching, after rendering [^2].
  useEffect(() => {
    fetchTransactionHistory()
  }, [])

  const fetchTransactionHistory = async () => {
    try {
      setLoading(true)
      // Mock data - replace with actual API call
      const mockTransactions: Transaction[] = [
        {
          id: "1",
          type: "purchase",
          amount: 5000,
          description: "Professional Pack Purchase",
          category: "Token Purchase",
          date: "2024-01-15T10:30:00Z",
          status: "completed",
          reference: "stripe_pi_1234567890",
        },
        {
          id: "2",
          type: "usage",
          amount: -150,
          description: "Document AI Processing",
          category: "Document Processing",
          date: "2024-01-14T15:45:00Z",
          status: "completed",
        },
        {
          id: "3",
          type: "usage",
          amount: -75,
          description: "AI Chat Conversation",
          category: "AI Chat",
          date: "2024-01-14T14:20:00Z",
          status: "completed",
        },
        {
          id: "4",
          type: "purchase",
          amount: 1000,
          description: "Starter Pack Purchase",
          category: "Token Purchase",
          date: "2024-01-10T09:15:00Z",
          status: "completed",
          reference: "stripe_pi_0987654321",
        },
        {
          id: "5",
          type: "usage",
          amount: -200,
          description: "Content Generation",
          category: "AI Generation",
          date: "2024-01-09T16:30:00Z",
          status: "completed",
        },
      ]
      setTransactions(mockTransactions)
    } catch (error) {
      console.error("Error fetching transaction history:", error)
      toast({
        title: "Error",
        description: "Failed to fetch transaction history",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.type === "purchase") {
      return <Plus className="h-4 w-4 text-green-600" />
    }
    switch (transaction.category) {
      case "Document Processing":
        return <FileText className="h-4 w-4 text-blue-600" />
      case "AI Chat":
        return <MessageSquare className="h-4 w-4 text-purple-600" />
      case "AI Generation":
        return <Sparkles className="h-4 w-4 text-orange-600" />
      default:
        return <Minus className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredTransactions = transactions.filter((transaction) => {
    if (activeTab === "all") return true
    if (activeTab === "purchases") return transaction.type === "purchase"
    if (activeTab === "usage") return transaction.type === "usage"
    return true
  })

  const exportHistory = async () => {
    try {
      // In a real app, this would call an API to generate and download a CSV/PDF
      toast({
        title: "Export Started",
        description: "Your transaction history will be downloaded shortly",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export transaction history",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <div className="flex items-center gap-2 min-w-0">
          <History className="h-5 w-5" />
          <CardTitle className="flex-shrink-0 sm:flex-shrink min-w-0">Transaction History</CardTitle>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={fetchTransactionHistory} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={exportHistory}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                      <div className="space-y-1">
                        <div className="w-32 h-4 bg-muted rounded animate-pulse" />
                        <div className="w-24 h-3 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="w-16 h-4 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transactions found for the selected filter</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors space-y-2 sm:space-y-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-full bg-muted flex-shrink-0">{getTransactionIcon(transaction)}</div>
                      <div className="min-w-0">
                        <p className="font-medium break-words">{transaction.description}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                          <span>{new Date(transaction.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{transaction.category}</span>
                          {transaction.reference && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-xs break-all">{transaction.reference.slice(-8)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end sm:items-center gap-1 sm:gap-2 min-w-0">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                          {transaction.amount > 0 ? "+" : ""}
                          {transaction.amount.toLocaleString()}
                        </span>
                        {getStatusBadge(transaction.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 break-words">
                        {new Date(transaction.date).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
