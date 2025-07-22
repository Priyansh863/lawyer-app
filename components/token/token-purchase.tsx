"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coins, CreditCard, Zap, Star, Crown } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface TokenPurchaseProps {
  onPurchaseSuccess: (tokensPurchased: number) => void
}

interface TokenPackage {
  id: string
  name: string
  tokens: number
  price: number
  originalPrice?: number
  popular?: boolean
  icon: React.ReactNode
  features: string[]
}

const tokenPackages: TokenPackage[] = [
  {
    id: "starter",
    name: "Starter Pack",
    tokens: 1000,
    price: 9.99,
    icon: <Coins className="h-5 w-5" />,
    features: ["1,000 AI tokens", "Basic support", "30-day validity"]
  },
  {
    id: "professional",
    name: "Professional Pack",
    tokens: 5000,
    price: 39.99,
    originalPrice: 49.99,
    popular: true,
    icon: <Zap className="h-5 w-5" />,
    features: ["5,000 AI tokens", "Priority support", "60-day validity", "20% bonus tokens"]
  },
  {
    id: "enterprise",
    name: "Enterprise Pack",
    tokens: 15000,
    price: 99.99,
    originalPrice: 149.99,
    icon: <Crown className="h-5 w-5" />,
    features: ["15,000 AI tokens", "Premium support", "90-day validity", "50% bonus tokens", "Priority processing"]
  }
]

export default function TokenPurchase({ onPurchaseSuccess }: TokenPurchaseProps) {
  const profile = useSelector((state: RootState) => state.auth.user)
  const token = useSelector((state: RootState) => state.auth.token)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handlePurchase = async (packageData: TokenPackage) => {
    if (!profile || !token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase tokens",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setSelectedPackage(packageData.id)

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/v1/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packageId: packageData.id,
          tokens: packageData.tokens,
          amount: packageData.price * 100, // Convert to cents
          packageName: packageData.name
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionUrl } = await response.json()
      
      // Redirect to Stripe Checkout
      window.location.href = sessionUrl

    } catch (error) {
      console.error('Purchase error:', error)
      toast({
        title: "Purchase Failed",
        description: "Unable to process your purchase. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setSelectedPackage(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Purchase Token Credits
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose a token package to increase your AI credits
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {tokenPackages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
              pkg.popular ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onClick={() => !loading && handlePurchase(pkg)}
          >
            {pkg.popular && (
              <Badge className="absolute -top-2 left-4 bg-primary">
                <Star className="h-3 w-3 mr-1" />
                Most Popular
              </Badge>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${pkg.popular ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {pkg.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {pkg.tokens.toLocaleString()} tokens
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2">
                  {pkg.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${pkg.originalPrice}
                    </span>
                  )}
                  <span className="text-xl font-bold">${pkg.price}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ${(pkg.price / pkg.tokens * 1000).toFixed(2)}/1k tokens
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {pkg.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>

            <Button
              className="w-full mt-4"
              disabled={loading}
              variant={pkg.popular ? "default" : "outline"}
            >
              {loading && selectedPackage === pkg.id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Purchase {pkg.tokens.toLocaleString()} Tokens
                </>
              )}
            </Button>
          </div>
        ))}

        {/* Payment Methods */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center mb-3">
            Secure payment powered by Stripe
          </p>
          <div className="flex justify-center items-center gap-4 text-xs text-muted-foreground">
            <span>💳 Credit Cards</span>
            <span>🏦 Bank Transfer</span>
            <span>📱 Digital Wallets</span>
          </div>
        </div>

        {/* Refund Policy */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          <p>
            💰 30-day money-back guarantee • 🔒 Secure payments • ⚡ Instant token delivery
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
