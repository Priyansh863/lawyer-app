"use client"

import type React from "react"
import { useState } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store" // Using 'type' for import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Zap, Star, Crown, Share2, Plus, Languages, Video, LifeBuoy, Briefcase, Gift } from "lucide-react" // Added Gift icon
import { toast } from "@/hooks/use-toast"
import axios from "axios"


const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:';


interface TokenPurchaseProps {
  onPurchaseSuccess: (tokensPurchased: number) => void
}

interface ProductPackage {
  id: string
  name: string
  price: number
  originalPrice?: number
  popular?: boolean
  icon: React.ReactNode
  features: string[] // For plans, these are the included features. For add-ons, this will be the description.
  tokens: number // Dummy value for backend compatibility, will be 1 for non-token items
  isAddon?: boolean // To distinguish if needed for future UI changes
  isTrial?: boolean // New property for trial plans
  period?: string // New property for trial period
}

const productPackages: ProductPackage[] = [
  // New Free Trial Plan
  {
    id: "free-trial-plan",
    name: "Free Trial Plan",
    price: 0,
    icon: <Gift className="h-5 w-5" />,
    features: [
      "Lawyer-only Electron-based Desktop App (PC and AWS save option)",
      "Lawyer-only PWA App",
      "Basic AI Assistant Features: Document summarization, OCR",
      "Blog posting (on-site) – limited to 5 posts",
      "Basic Auto-Posting Feature: 1 social media channel connection (e.g., Twitter), limited to 5 posts",
      "Manual post creation by the lawyer → automatic distribution to connected social media",
      "Q&A response functionality",
      "Chat consultation feature",
      "Sending/receiving, viewing, and managing documents sent by clients",
      "Case and client management features",
      "AES256 encryption for all stored documents",
      "Integrated metadata search (uploader, timestamp, case ID, etc.)",
      "Some features may be limited during the trial period.",
    ],
    tokens: 0, // No tokens for trial
    isTrial: true,
    period: "7-Day Trial",
  },
  // Plans
  {
    id: "basic-plan",
    name: "Basic Plan",
    price: 19.99,
    icon: <Briefcase className="h-5 w-5" />,
    features: [
      "Lawyer-only Electron-based Desktop App (PC version with AWS storage option)",
      "Lawyer-only PWA App",
      "Basic AI Assistant Features: Document summarization, OCR",
      "Unlimited blog posting (on-site)",
      "Basic Auto-Posting Feature: 1 social media channel connection (e.g., Twitter), limited to 10 posts",
      "Manual post creation by the lawyer → automatic distribution to connected social media",
      "Q&A response functionality",
      "Chat consultation feature (Free/Paid options available)",
      "Video consultation booking (Free/Paid options available)",
      "Sending/receiving, viewing, and managing documents sent by clients",
      "Case and client management features",
      "Secure document receiving and management feature",
      "AES256 encryption for all stored documents",
      "Integrated metadata search (uploader, timestamp, case ID, etc.)",
      "Email technical support within 24 hours after request",
    ],
    tokens: 1, // Dummy value for backend compatibility
  },
  {
    id: "professional-plan",
    name: "Professional Plan",
    price: 49.99,
    popular: true,
    icon: <Zap className="h-5 w-5" />,
    features: [
      "Includes all features from Basic Plan",
      "Extended AI Assistant Features: ACR (Audio Character Recognition), Voice playback for documents",
      "Extended Auto-Posting: 3 social media channels connected (30 posts/month)",
      "AI-Based Auto-Generation & Posting: Enter prompt → AI generates post → Auto-posts to connected channels",
      "Auto translation for blog posts (Korean to English)",
      "Video consultation recording and download support",
      "Auto recording, summarizing, documenting, and managing video consultations",
      "Auto summarizing, documenting, and managing videos and voice files sent by clients",
      "Email technical support within 12 hours after request",
    ],
    tokens: 1, // Dummy value for backend compatibility
  },
  {
    id: "enterprise-plan",
    name: "Enterprise Plan",
    price: 99.99,
    icon: <Crown className="h-5 w-5" />,
    features: [
      "Includes all features from Professional Plan",
      "5 social media channels connected (100 posts/month)",
      "Auto multi-language translation for posts (Korean as base language, choose from 40+ other languages)",
      "AI Marketing Report Generator (Summarizes social media response, views, keywords, etc.)",
      "Email technical support within 6 hours after request",
      "4 remote technical support sessions per month",
    ],
    tokens: 1, // Dummy value for backend compatibility
  },
  // Add-ons
  {
    id: "addon-social-channel",
    name: "Additional Social Media Channel",
    price: 5.0,
    icon: <Share2 className="h-5 w-5" />,
    features: ["Connect an extra social media channel beyond the default"],
    tokens: 1, // Dummy value for backend compatibility
    isAddon: true,
  },
  {
    id: "addon-10-posts",
    name: "10 Additional Posts",
    price: 3.0,
    icon: <Plus className="h-5 w-5" />,
    features: ["Add 10 more posting slots per month"],
    tokens: 1, // Dummy value for backend compatibility
    isAddon: true,
  },
  {
    id: "addon-multilingual-blog",
    name: "Multilingual Blog Translation",
    price: 9.0,
    icon: <Languages className="h-5 w-5" />,
    features: ["Auto-translate blog into one selected language"],
    tokens: 1, // Dummy value for backend compatibility
    isAddon: true,
  },
  {
    id: "addon-video-storage",
    name: "Video Consultation Storage + Download",
    price: 6.0,
    icon: <Video className="h-5 w-5" />,
    features: ["Store and download recorded consultations"],
    tokens: 1, // Dummy value for backend compatibility
    isAddon: true,
  },
  {
    id: "addon-remote-support",
    name: "Remote Technical/Installation Support",
    price: 2.0,
    icon: <LifeBuoy className="h-5 w-5" />,
    features: ["Technical agent remotely connects to assist with Electron App setup or support"],
    tokens: 1, // Dummy value for backend compatibility
    isAddon: true,
  },
]

export default function TokenPurchase({ onPurchaseSuccess }: TokenPurchaseProps) {
  const profile = useSelector((state: RootState) => state.auth.user)
  const token = useSelector((state: RootState) => state.auth.token)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({})

  const toggleFeatures = (id: string) => {
    setExpandedFeatures((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handlePurchase = async (packageData: ProductPackage) => {
    if (!profile || !token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setSelectedPackage(packageData.id)

    try {
      if (packageData.isTrial) {
        // Handle free trial activation
        toast({
          title: "Trial Activated",
          description: `Your ${packageData.name} has been activated for ${packageData.period}.`,
          variant: "default",
        })
        onPurchaseSuccess(0) // Notify parent, 0 tokens for trial
      } else {
        // Create Stripe checkout session for paid plans/add-ons
        // Import axios at the top of your file: import axios from "axios"
        const response = await axios.post(
        `${BACKEND_URL}/stripe/create-checkout-session`,
          {
            packageId: packageData.id,
            tokens: packageData.tokens,
            amount: packageData.price * 100,
            packageName: packageData.name,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )

        const { sessionUrl } = response.data
        // Redirect to Stripe Checkout
        window.location.href = sessionUrl
      }
    } catch (error) {
      console.error("Purchase error:", error)
      toast({
        title: "Purchase Failed",
        description: "Unable to process your purchase. Please try again.",
        variant: "destructive",
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
          Subscription Plans & Add-ons
        </CardTitle>
        <p className="text-sm text-muted-foreground">Choose a plan or add-on to enhance your service</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {" "}
          {/* Added grid for 2 columns */}
          {productPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                pkg.popular ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              } ${pkg.isTrial ? "border-green-500 bg-green-50/50" : ""}`} // Highlight trial
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
                  <div
                    className={`p-2 rounded-lg ${
                      pkg.popular ? "bg-primary text-primary-foreground" : "bg-muted"
                    } ${pkg.isTrial ? "bg-green-100 text-green-700" : ""}`} // Icon background for trial
                  >
                    {pkg.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{pkg.name}</h3>
                    {pkg.isAddon && <p className="text-sm text-muted-foreground">Add-on</p>}
                    {pkg.isTrial && <p className="text-sm text-muted-foreground">{pkg.period}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-0 sm:gap-2">
                    {pkg.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">${pkg.originalPrice}</span>
                    )}
                    <span className="text-xl font-bold text-nowrap">{pkg.price === 0 ? "Free" : `$${pkg.price}`}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex flex-wrap gap-1">
                  {(expandedFeatures[pkg.id] ? pkg.features : pkg.features.slice(0, 3)).map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
                {pkg.features.length > 3 && (
                  <Button
                    variant="link"
                    className="mt-2 p-0 h-auto text-xs text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation() // Prevent card click from triggering purchase
                      toggleFeatures(pkg.id)
                    }}
                  >
                    {expandedFeatures[pkg.id] ? "Show Less" : `View More (${pkg.features.length - 3} more)`}
                  </Button>
                )}
              </div>
              <Button
                className="w-full mt-4"
                disabled={loading}
                variant={pkg.popular ? "default" : pkg.isTrial ? "default" : "outline"} // Highlight trial button
              >
                {loading && selectedPackage === pkg.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    {pkg.isTrial ? <Gift className="h-4 w-4 mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}{" "}
                    {pkg.isTrial ? "Activate Free Trial" : `Purchase ${pkg.name}`}
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
        {/* Payment Methods */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center mb-3">Secure payment powered by Stripe</p>
          <div className="flex justify-center items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span>💳 Credit Cards</span>
            <span>🏦 Bank Transfer</span>
            <span>📱 Digital Wallets</span>
          </div>
        </div>
        {/* Refund Policy */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          <p>💰 30-day money-back guarantee • 🔒 Secure payments • ⚡ Instant delivery</p>
        </div>
      </CardContent>
    </Card>
  )
}
