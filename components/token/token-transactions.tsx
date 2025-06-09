"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock data - would come from API in real implementation
const transactions = [
  {
    id: 1,
    date: "May 18, 2025",
    clientId: "CL-23165",
    amount: "$45",
    type: "earned",
  },
  {
    id: 2,
    date: "May 15, 2025",
    clientId: "CL-23156",
    amount: "$30",
    type: "earned",
  },
  {
    id: 3,
    date: "May 10, 2025",
    clientId: "CL-23622",
    amount: "$25",
    type: "spent",
  },
  {
    id: 4,
    date: "May 5, 2025",
    clientId: "CL-23189",
    amount: "$50",
    type: "earned",
  },
  {
    id: 5,
    date: "May 1, 2025",
    clientId: "CL-23201",
    amount: "$15",
    type: "spent",
  },
]

export default function TokenTransactions() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Transaction Log</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Client ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, index) => (
              <TableRow key={transaction.id} className={index % 2 === 0 ? "bg-gray-100" : ""}>
                <TableCell>{transaction.date}</TableCell>
                <TableCell>{transaction.clientId}</TableCell>
                <TableCell>{transaction.amount}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>View Client</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
