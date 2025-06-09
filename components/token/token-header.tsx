"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function TokenHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Token Management</h1>
        <p className="text-gray-500">View and manage your token usage and transactions</p>
      </div>
      <Button variant="outline" className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        Export Data
      </Button>
    </div>
  )
}
