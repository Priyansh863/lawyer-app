"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  FileText,
  Users,
  Bot,
  MessageSquare,
  Video,
  VoicemailIcon as VoiceIcon,
  TrendingUp,
  BookOpen,
  HelpCircle,
  Coins,
  CreditCard,
  Settings,
  Menu,
  X,
} from "lucide-react"
import { useSelector } from "react-redux"
import { useTranslation } from "@/hooks/useTranslation"

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
        isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-white/50",
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const user=useSelector((state: any) => state.auth.user)
  const { t } = useTranslation()
  console.log("User from Redux:", user)

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkIfMobile()

    // Set sidebar open state based on screen size
    setIsOpen(!isMobile)

    // Add event listener for resize
    window.addEventListener("resize", checkIfMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  // Update sidebar state when screen size changes
  useEffect(() => {
    setIsOpen(!isMobile)
  }, [isMobile])

  // Dispatch custom event when sidebar state changes
  useEffect(() => {
    // Only dispatch for mobile
    if (isMobile) {
      const event = new CustomEvent("sidebarChange", { detail: { isOpen } })
      window.dispatchEvent(event)
    }
  }, [isOpen, isMobile])

  const navItems = [
    { href: "/dashboard", icon: <LayoutDashboard size={18} />, label: t('navigation.dashboard') },
    { href: "/cases", icon: <FileText size={18} />, label: t('navigation.cases') },
    { href: "/client", icon: <Users size={18} />, label: user?.account_type === "lawyer" ? t('navigation.clients') : "Lawyers" },
    { href: "/documents", icon: <FileText size={18} />, label: t('navigation.documents') },
    ...(user?.account_type === "lawyer"
      ? [
          { href: "/ai-assistants", icon: <Bot size={18} />, label: t('navigation.aiAssistants') },
          { href: "/voice-summary", icon: <VoiceIcon size={18} />, label: t('navigation.voiceSummary') },
          { href: "/ai-marketing", icon: <TrendingUp size={18} />, label: t('navigation.aiMarketing') },
        ]
      : []),
    { href: "/chat", icon: <MessageSquare size={18} />, label: t('navigation.chat') },
    { href: "/video-consultations", icon: <Video size={18} />, label: t('navigation.videoConsultations') },
    { href: "/blog", icon: <BookOpen size={18} />, label: t('navigation.blog') },
    { href: "/qa", icon: <HelpCircle size={18} />, label: t('navigation.qa') },
    { href: "/token", icon: <Coins size={18} />, label: t('navigation.token') },
    { href: "/settings", icon: <Settings size={18} />, label: t('navigation.settings') },
  ]

  return (
    <>
      {/* Mobile Hamburger Button - positioned at the very top */}
      {isMobile && !isOpen && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b z-40 flex items-center px-4">
          <button onClick={() => setIsOpen(true)} className="p-2 rounded-md hover:bg-gray-100" aria-label="Open menu">
            <Menu size={24} />
          </button>
        </div>
      )}

      {/* Mobile Overlay - covers the entire screen with higher z-index */}
      {isMobile && isOpen && <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setIsOpen(false)} />}

      {/* Sidebar with even higher z-index */}
      <aside
        className={cn(
          "bg-[#F5F5F5] border-r border-gray-200 z-[60] transition-all duration-300 ease-in-out",
          isMobile ? "fixed top-0 left-0 h-full w-64" : "sticky top-0 h-screen w-64",
          isMobile && !isOpen && "transform -translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user?.profile_image ?? "/placeholder.svg?height=32&width=32"} alt="User" />
                <AvatarFallback>J</AvatarFallback>
              </Avatar>
              <span className="font-medium">{user?.first_name+ " " + user?.last_name || "User"}</span>
            </div>

            {/* Close button for mobile */}
            {isMobile && (
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            )}
          </div>
          <nav
            className="flex-1 p-4 space-y-1 overflow-y-auto"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              // WebkitScrollbar: { display: "none" },
            }}
          >
            <style jsx>{`
              nav::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}
