"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingUp, TrendingDown, Plus } from "lucide-react"

interface TokenBalanceProps {
  currentTokens: number
  loading: boolean
  onRefresh: () => void
  onAddTokens: () => void // New prop for adding tokens
}

export default function TokenBalance({ 
  currentTokens, 
  loading, 
  onRefresh,
  onAddTokens 
}: TokenBalanceProps) {
  // Mock data for usage analytics
  const monthlyUsage = 2450
  const monthlyLimit = 5000
  const usagePercentage = (monthlyUsage / monthlyLimit) * 100
  const lastMonthUsage = 2100
  const usageChange = monthlyUsage - lastMonthUsage
  const usageChangePercent = ((usageChange / lastMonthUsage) * 100).toFixed(1)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        {/* Add Tokens Button on Left */}
       <Button variant="outline" size="sm" onClick={onAddTokens} className="flex items-center gap-1 bg-transparent">
          <Plus className="h-4 w-4" />
          Add Tokens
        </Button>
        
        {/* Centered Title */}
        <CardTitle className="text-base font-semibold mx-auto">
          Token Usage & Balance
        </CardTitle>
        
        {/* Refresh Button on Right */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh} 
          disabled={loading}
          className="ml-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Balance */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-medium text-muted-foreground">Available Balance</h3>
            <span className="text-xs text-muted-foreground">
              Updated: {new Date().toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {loading ? "..." : currentTokens.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">tokens</span>
          </div>
        </div>

        {/* Rest of your existing content... */}
        {/* Monthly Usage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Monthly Usage</span>
            <span className="text-sm font-medium">
              {monthlyUsage.toLocaleString()} / {monthlyLimit.toLocaleString()} tokens
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{usagePercentage.toFixed(1)}% used this month</span>
            <span>{(monthlyLimit - monthlyUsage).toLocaleString()} remaining</span>
          </div>
        </div>

        {/* Usage Comparison */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div className="space-y-0.5">
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-lg font-semibold">{monthlyUsage.toLocaleString()}</p>
            <div className="flex items-center gap-1">
              {usageChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-500" />
              )}
              <p className={`text-xs ${usageChange >= 0 ? "text-red-600" : "text-green-600"}`}>
                {usageChange >= 0 ? "+" : ""}
                {usageChangePercent}% from last month
              </p>
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-sm text-muted-foreground">Last Month</p>
            <p className="text-lg font-semibold">{lastMonthUsage.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Previous period</p>
          </div>
        </div>

        {/* Usage Breakdown */}
        <div className="space-y-2 pt-3 border-t">
          <h4 className="text-sm font-medium">Usage Breakdown</h4>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Document Processing</span>
              <span className="font-medium">1,200 tokens</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">AI Chat</span>
              <span className="font-medium">850 tokens</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Content Generation</span>
              <span className="font-medium">400 tokens</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}