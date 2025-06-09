"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function TokenBundles() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Token Bundles</h3>
        <Button variant="outline">View History</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Basic</CardTitle>
                <CardDescription>For occasional use</CardDescription>
              </div>
              <Badge variant="outline" className="bg-gray-100">
                100 Tokens
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">$9.99</div>
            <p className="text-sm text-gray-500">$0.10 per token</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Buy Tokens</Button>
          </CardFooter>
        </Card>

        <Card className="border-2 border-black relative">
          <div className="absolute top-0 right-0 bg-black text-white text-xs px-3 py-1 rounded-bl-lg">Popular</div>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Standard</CardTitle>
                <CardDescription>For regular use</CardDescription>
              </div>
              <Badge variant="outline" className="bg-gray-100">
                500 Tokens
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">$39.99</div>
            <p className="text-sm text-gray-500">$0.08 per token</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-black hover:bg-gray-800">Buy Tokens</Button>
          </CardFooter>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Premium</CardTitle>
                <CardDescription>For heavy use</CardDescription>
              </div>
              <Badge variant="outline" className="bg-gray-100">
                1000 Tokens
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">$69.99</div>
            <p className="text-sm text-gray-500">$0.07 per token</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Buy Tokens</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
