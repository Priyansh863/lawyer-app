"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card" // Removed CardDescription
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CreditCard } from "lucide-react"

interface AddTokenProps {
  onPaymentSuccess?: (amount: number) => void
  onClose?: () => void
}

export default function AddToken({ onPaymentSuccess, onClose }: AddTokenProps) {
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvc, setCvc] = useState("")
  const [cardName, setCardName] = useState("")
  const [amount, setAmount] = useState("5000")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("Processing payment for:", { cardNumber, expiryDate, cvc, cardName, amount })
    alert(`Payment of ${amount} tokens processed successfully! (Mock)`)
    onPaymentSuccess?.(Number.parseInt(amount))
    onClose?.()
    setCardNumber("")
    setExpiryDate("")
    setCvc("")
    setCardName("")
    setAmount("5000")
  }

  return (
    <Card className="w-full border-none shadow-none">
      <CardHeader className="pb-2 px-0">
        {" "}
        {/* Reduced padding */}
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5" /> Add Tokens
        </CardTitle>
        {/* CardDescription is now handled by DialogDescription in page.tsx */}
      </CardHeader>
      <CardContent className="pb-4 px-0">
        {" "}
        {/* Reduced padding */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="amount">Amount (Tokens)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g., 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="py-2"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="card-number">Card Number</Label>
            <Input
              id="card-number"
              type="text"
              placeholder="XXXX XXXX XXXX XXXX"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              maxLength={19}
              required
              className="py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="expiry-date">Expiry Date</Label>
              <Input
                id="expiry-date"
                type="text"
                placeholder="MM/YY"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                maxLength={5}
                required
                className="py-2"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                type="text"
                placeholder="XXX"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                maxLength={4}
                required
                className="py-2"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="card-name">Name on Card</Label>
            <Input
              id="card-name"
              type="text"
              placeholder="John Doe"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              required
              className="py-2"
            />
          </div>
          <Button type="submit" className="w-full mt-2">
            Pay ${amount ? (Number.parseInt(amount) / 1000).toFixed(2) : "0.00"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground text-center py-3 px-0">
        {" "}
        {/* Reduced padding */}
        Your payment is securely processed.
      </CardFooter>
    </Card>
  )
}
