"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, Download } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

const subscriptionHistory = [
  {
    id: "INV-001",
    date: "May 15, 2025",
    description: "Monthly Subscription - Advanced Plan",
    amount: "$425.00",
    status: "Paid",
  },
  {
    id: "INV-002",
    date: "May 10, 2025",
    description: "Token Bundle - 500 Tokens",
    amount: "$39.99",
    status: "Paid",
  },
  {
    id: "INV-003",
    date: "Apr 15, 2025",
    description: "Monthly Subscription - Advanced Plan",
    amount: "$425.00",
    status: "Paid",
  },
  {
    id: "INV-004",
    date: "Apr 02, 2025",
    description: "Token Bundle - 100 Tokens",
    amount: "$9.99",
    status: "Paid",
  },
  {
    id: "INV-005",
    date: "Mar 15, 2025",
    description: "Monthly Subscription - Advanced Plan",
    amount: "$425.00",
    status: "Paid",
  },
]

export default function SubscriptionHistory() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h3 className="text-xl font-semibold">Subscription History</h3>
        <Button variant="outline" className="flex items-center gap-2 sm:w-auto w-full justify-center">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptionHistory.map((item, index) => (
                <TableRow key={item.id} className={index % 2 === 0 ? "bg-gray-100" : ""}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.amount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Invoice</DropdownMenuItem>
                        <DropdownMenuItem>Download PDF</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
