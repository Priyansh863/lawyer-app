"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, CreditCard, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';


interface TokenPackage {
  id: string
  name: string
  tokens: number
  price: number
  popular: boolean
  description: string
}

const tokenPackages: TokenPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    tokens: 1000,
    price: 9.99,
    popular: false,
    description: '1,000 AI tokens for basic usage'
  },
  {
    id: 'professional',
    name: 'Professional Pack',
    tokens: 5000,
    price: 39.99,
    popular: true,
    description: '5,000 AI tokens with 20% bonus (6,000 total)'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    tokens: 15000,
    price: 99.99,
    popular: false,
    description: '15,000 AI tokens with 50% bonus (22,500 total)'
  }
]

interface TokenPurchaseDialogProps {
  onSuccess: (tokens: number) => void
  onCancel: () => void
}

export default function TokenPurchaseDialog({ onSuccess, onCancel }: TokenPurchaseDialogProps) {
  const { toast } = useToast()
  const token = useSelector((state: RootState) => state.auth.token)
  const profile = useSelector((state: RootState) => state.auth.user)
  const [loading, setLoading] = useState<string | null>(null)

  const handlePurchase = async (tokenPackage: TokenPackage) => {
    try {
      setLoading(tokenPackage.id)
      
      // Check if Stripe is properly configured
      if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY === 'pk_test_your_stripe_publishable_key_here') {
        throw new Error("Stripe is not properly configured. Please add your Stripe publishable key to the environment variables.")
      }
      
      // Create checkout session
      const axios = (await import("axios")).default
      const response = await axios.post( 
        `${BACKEND_URL}/stripe/create-checkout-session`,
        {
          packageId: tokenPackage.id,
          successUrl: `${window.location.origin}/token?success=true`,
          cancelUrl: `${window.location.origin}/token?canceled=true`,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )

    console.log("Checkout session created:", response.data)

      if (!response.data) {
        throw new Error("Failed to create checkout session")
      }

      const { sessionId } = response.data

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error("Stripe failed to load")
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (error) {
        throw new Error(error.message)
      }

    } catch (error: any) {
      console.error("Purchase error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to initiate purchase",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Choose Token Package</h3>
        <p className="text-sm text-muted-foreground">Select the number of tokens you'd like to purchase</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tokenPackages.map((pkg) => (
          <Card 
            key={pkg.id} 
            className={`relative cursor-pointer transition-all hover:shadow-md ${
              pkg.popular ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="flex items-center justify-center gap-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                {pkg.tokens.toLocaleString()} Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div>
                <div className="text-3xl font-bold">${pkg.price}</div>
                <div className="text-sm text-muted-foreground">
                  ${(pkg.price / pkg.tokens).toFixed(3)} per token
                </div>
              </div>
              <Button
                onClick={() => handlePurchase(pkg)}
                disabled={loading === pkg.id}
                className="w-full"
                variant={pkg.popular ? "default" : "outline"}
              >
                {loading === pkg.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Purchase
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
