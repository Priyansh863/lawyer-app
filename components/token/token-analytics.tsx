"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { Button } from "@/components/ui/button"

// Mock data for weekly view
const weeklyData = [
  { name: "Mon", earned: 12, spent: 8 },
  { name: "Tue", earned: 18, spent: 15 },
  { name: "Wed", earned: 24, spent: 22 },
  { name: "Thu", earned: 11, spent: 7 },
  { name: "Fri", earned: 8, spent: 8 },
  { name: "Sat", earned: 7, spent: 5 },
  { name: "Sun", earned: 5, spent: 2 },
]

// Mock data for monthly view
const monthlyData = [
  { name: "Week 1", earned: 45, spent: 38 },
  { name: "Week 2", earned: 52, spent: 48 },
  { name: "Week 3", earned: 38, spent: 35 },
  { name: "Week 4", earned: 30, spent: 25 },
]

export default function TokenAnalytics() {
  const [view, setView] = useState<"weekly" | "monthly">("weekly")

  const data = view === "weekly" ? weeklyData : monthlyData

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold">Analytics Chart</h2>
        <div className="flex items-center space-x-2">
          <Button variant={view === "weekly" ? "default" : "outline"} size="sm" onClick={() => setView("weekly")}>
            Weekly
          </Button>
          <Button variant={view === "monthly" ? "default" : "outline"} size="sm" onClick={() => setView("monthly")}>
            Monthly
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: "300px" }}>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} tokens`, undefined]}
                    labelFormatter={(label) => `${view === "weekly" ? "Day" : "Period"}: ${label}`}
                  />
                  <Legend />
                  <Bar name="Earned" dataKey="earned" fill="#000000" radius={[4, 4, 0, 0]} />
                  <Bar name="Spent" dataKey="spent" fill="#CCCCCC" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
