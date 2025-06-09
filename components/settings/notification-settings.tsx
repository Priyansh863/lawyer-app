"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function NotificationSettings() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-6">Notification Settings</h3>

      <div className="space-y-6">
        <div>
          <h4 className="text-base font-medium mb-4">Email Notifications</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="case-updates" className="text-base font-normal">
                  Case Updates
                </Label>
                <p className="text-sm text-gray-500">Receive email notifications for case updates</p>
              </div>
              <Switch id="case-updates" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="client-messages" className="text-base font-normal">
                  Client Messages
                </Label>
                <p className="text-sm text-gray-500">Receive email notifications when clients send messages</p>
              </div>
              <Switch id="client-messages" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="document-uploads" className="text-base font-normal">
                  Document Uploads
                </Label>
                <p className="text-sm text-gray-500">Receive email notifications for new document uploads</p>
              </div>
              <Switch id="document-uploads" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="billing-notifications" className="text-base font-normal">
                  Billing Notifications
                </Label>
                <p className="text-sm text-gray-500">Receive email notifications for billing and invoices</p>
              </div>
              <Switch id="billing-notifications" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketing-emails" className="text-base font-normal">
                  Marketing Emails
                </Label>
                <p className="text-sm text-gray-500">Receive promotional emails and newsletters</p>
              </div>
              <Switch id="marketing-emails" />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-base font-medium mb-4">Push Notifications</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-case-updates" className="text-base font-normal">
                  Case Updates
                </Label>
                <p className="text-sm text-gray-500">Receive push notifications for case updates</p>
              </div>
              <Switch id="push-case-updates" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-client-messages" className="text-base font-normal">
                  Client Messages
                </Label>
                <p className="text-sm text-gray-500">Receive push notifications when clients send messages</p>
              </div>
              <Switch id="push-client-messages" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-document-uploads" className="text-base font-normal">
                  Document Uploads
                </Label>
                <p className="text-sm text-gray-500">Receive push notifications for new document uploads</p>
              </div>
              <Switch id="push-document-uploads" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button className="bg-black hover:bg-gray-800 text-white">Save Preferences</Button>
      </div>
    </div>
  )
}
