"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Mock data for analytics
const engagementData = [
  { name: "Mon", value: 400 },
  { name: "Tue", value: 300 },
  { name: "Wed", value: 500 },
  { name: "Thu", value: 280 },
  { name: "Fri", value: 590 },
  { name: "Sat", value: 800 },
  { name: "Sun", value: 700 },
]

const contentTypeData = [
  { name: "Social", value: 65 },
  { name: "Email", value: 15 },
  { name: "Blog", value: 10 },
  { name: "Other", value: 10 },
]

export default function MarketingAnalytics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketing Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="engagement" className="space-y-4">
          <TabsList>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="content">Content Types</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="engagement" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0f0921" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="content" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contentTypeData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Bar dataKey="value" fill="#0f0921" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="performance" className="h-80">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Performance analytics would go here
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
