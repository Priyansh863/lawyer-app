"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function SubscriptionPlans() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  const [selectedPlan, setSelectedPlan] = useState<string>("free")

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold">Select a Plan</h3>
          <p className="text-sm text-gray-500">If you need more info, please check Pricing Guidelines.</p>
        </div>
        <div className="bg-gray-100 rounded-full p-1">
          <Button
            variant={billingCycle === "monthly" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "rounded-full text-xs px-4",
              billingCycle === "monthly" ? "bg-black text-white" : "bg-transparent text-gray-500",
            )}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === "annual" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "rounded-full text-xs px-4",
              billingCycle === "annual" ? "bg-black text-white" : "bg-transparent text-gray-500",
            )}
            onClick={() => setBillingCycle("annual")}
          >
            Annual
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="space-y-4">
            <div className={cn("border rounded-lg p-4", selectedPlan === "free" ? "border-black" : "border-gray-200")}>
              <div className="flex items-start">
                <RadioGroupItem value="free" id="free" className="mt-1" />
                <div className="ml-3">
                  <Label htmlFor="free" className="text-base font-medium">
                    Free Trial
                  </Label>
                  <p className="text-sm text-gray-500">14 days free Trial</p>
                </div>
              </div>
            </div>

            <div
              className={cn("border rounded-lg p-4", selectedPlan === "advanced" ? "border-black" : "border-gray-200")}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <RadioGroupItem value="advanced" id="advanced" className="mt-1" />
                  <div className="ml-3">
                    <Label htmlFor="advanced" className="text-base font-medium">
                      Advanced
                    </Label>
                    <p className="text-sm text-gray-500">Best for 100+ team size</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">$425</span>
                  <span className="text-sm text-gray-500">/Mon</span>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "border rounded-lg p-4",
                selectedPlan === "enterprise" ? "border-black" : "border-gray-200",
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <RadioGroupItem value="enterprise" id="enterprise" className="mt-1" />
                  <div className="ml-3">
                    <Label htmlFor="enterprise" className="text-base font-medium">
                      Enterprise
                    </Label>
                    <p className="text-sm text-gray-500">Best value for 1000+ team</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">$799</span>
                  <span className="text-sm text-gray-500">/Mon</span>
                </div>
              </div>
            </div>

            <div
              className={cn("border rounded-lg p-4", selectedPlan === "custom" ? "border-black" : "border-gray-200")}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <RadioGroupItem value="custom" id="custom" className="mt-1" />
                  <div className="ml-3">
                    <Label htmlFor="custom" className="text-base font-medium">
                      Custom
                    </Label>
                    <p className="text-sm text-gray-500">Request a custom license</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">$999</span>
                  <span className="text-sm text-gray-500">/Mon</span>
                </div>
              </div>
            </div>
          </RadioGroup>

          <div className="flex space-x-4">
            <Button className="bg-black hover:bg-gray-800 text-white">Submit</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium mb-4">What's in Startup Plan?</h4>
          <p className="text-sm text-gray-500 mb-4">Optimal for 10+ team size and new startup</p>

          <div className="space-y-3">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm">Up to 10 Active Users</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm">Up to 30 Project Integrations</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm">Analytics Module</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm">Finance Module</span>
            </div>
            <div className="flex items-center opacity-50">
              <div className="h-5 w-5 rounded-full border border-gray-300 mr-2" />
              <span className="text-sm">Accounting Module</span>
            </div>
            <div className="flex items-center opacity-50">
              <div className="h-5 w-5 rounded-full border border-gray-300 mr-2" />
              <span className="text-sm">Network Platform</span>
            </div>
            <div className="flex items-center opacity-50">
              <div className="h-5 w-5 rounded-full border border-gray-300 mr-2" />
              <span className="text-sm">Unlimited Cloud Space</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
