"use client"
import type { Metadata } from "next"
import SettingsLayout from "@/components/layouts/settings-layout"
import ProfileSettings from "@/components/settings/profile-settings"
import LanguageSettings from "@/components/settings/language-settings"
import LawyerChargesSettings from "@/components/settings/lawyer-charges-settings"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"



export default function SettingsPage() {
  const profile = useSelector((state: RootState) => state.auth.user)



  return (
    <SettingsLayout>
      <div className="space-y-10" style={{ marginTop: "2.25rem" }}>
        <ProfileSettings />
        {profile?.account_type === 'lawyer' && <LawyerChargesSettings />}
        <LanguageSettings />
      </div>
    </SettingsLayout>
  )
}
