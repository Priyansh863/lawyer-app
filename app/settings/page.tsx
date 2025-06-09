import type { Metadata } from "next"
import SettingsLayout from "@/components/layouts/settings-layout"
import ProfileSettings from "@/components/settings/profile-settings"
import NotificationSettings from "@/components/settings/notification-settings"
import AccountSettings from "@/components/settings/account-settings"

export const metadata: Metadata = {
  title: "Settings | Legal Practice Management",
  description: "Manage your profile and application settings",
}

export default function SettingsPage() {
  return (
    <SettingsLayout>
      <div className="space-y-10">
        <ProfileSettings />
        <NotificationSettings />
        <AccountSettings />
      </div>
    </SettingsLayout>
  )
}
