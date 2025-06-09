"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function TokenBalance() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Token Balance</h3>
              <span className="text-sm text-gray-500">Updated: May 19, 2025</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">1,250</span>
              <span className="text-gray-500">tokens available</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Monthly Usage</span>
                <span className="font-medium">450 / 2,000 tokens</span>
              </div>
              <Progress value={22.5} className="h-2" />
              <p className="text-sm text-gray-500">Your plan renews on June 1, 2025</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Token Usage Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-semibold">450</p>
                <p className="text-xs text-green-600">+12% from last month</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Last Month</p>
                <p className="text-2xl font-semibold">402</p>
                <p className="text-xs text-green-600">+8% from previous</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Earned</p>
                <p className="text-2xl font-semibold">320</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Spent</p>
                <p className="text-2xl font-semibold">130</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
