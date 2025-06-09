"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AccountSettings() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-6">Account Settings</h3>

      <Tabs defaultValue="general">
        <TabsList className="flex flex-wrap w-full gap-2 mb-6">
          <TabsTrigger value="general" className="flex-1">
            General
          </TabsTrigger>
          <TabsTrigger value="password" className="flex-1">
            Password
          </TabsTrigger>
          <TabsTrigger value="2fa" className="flex-1">
            Two-Factor Auth
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="account-email">Email Address</Label>
              <Input id="account-email" type="email" defaultValue="johndoe123@gmail.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select defaultValue="en">
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select defaultValue="est">
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="est">Eastern Time (ET)</SelectItem>
                  <SelectItem value="cst">Central Time (CT)</SelectItem>
                  <SelectItem value="mst">Mountain Time (MT)</SelectItem>
                  <SelectItem value="pst">Pacific Time (PT)</SelectItem>
                  <SelectItem value="utc">Coordinated Universal Time (UTC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button className="bg-black hover:bg-gray-800 text-white">Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="password" className="space-y-6 mt-4">
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button className="bg-black hover:bg-gray-800 text-white">Change Password</Button>
          </div>
        </TabsContent>

        <TabsContent value="2fa" className="space-y-6 mt-4">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Two-factor authentication adds an extra layer of security to your account. In addition to your password,
              you'll need to enter a code from your phone.
            </p>

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-medium">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Set up authenticator app</h4>
                  <p className="text-sm text-gray-500 mb-2">
                    Use an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy.
                  </p>
                  <Button variant="outline" className="mt-1">
                    Set up authenticator
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-medium">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Set up SMS authentication</h4>
                  <p className="text-sm text-gray-500 mb-2">
                    Receive a code via SMS to verify your identity when signing in.
                  </p>
                  <Button variant="outline" className="mt-1">
                    Set up SMS
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-medium">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Get backup codes</h4>
                  <p className="text-sm text-gray-500 mb-2">
                    Generate backup codes to use when you don't have access to your phone.
                  </p>
                  <Button variant="outline" className="mt-1">
                    Generate backup codes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-10 pt-6 border-t">
        <h4 className="text-base font-medium text-red-600 mb-2">Danger Zone</h4>

        {!showDeleteConfirm ? (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </Button>
          </div>
        ) : (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Are you absolutely sure?</AlertTitle>
            <AlertDescription>
              This action cannot be undone. This will permanently delete your account and remove your data from our
              servers.
            </AlertDescription>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" className="w-full sm:w-auto">
                Yes, Delete My Account
              </Button>
            </div>
          </Alert>
        )}
      </div>
    </div>
  )
}
