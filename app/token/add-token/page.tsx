"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Sparkles } from "lucide-react"
import TokenBundlesPurchase from "@/components/token/add-token"

export default function AddTokensPage() {
  const handlePurchaseSuccess = (tokensPurchased: number) => {
    toast({
      title: "Purchase Successful!",
      description: `You have successfully purchased ${tokensPurchased} tokens. Your balance will be updated shortly.`,
      variant: "default",
    })
    // In a real application, you might want to redirect the user
    // or trigger a re-fetch of their token balance here.
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Purchase More Tokens
          </CardTitle>
          <p className="text-sm text-muted-foreground">Select a token bundle to top up your balance.</p>
        </CardHeader>
        <CardContent>
          <TokenBundlesPurchase onPurchaseSuccess={handlePurchaseSuccess} />
        </CardContent>
      </Card>
    </div>
  )
}
