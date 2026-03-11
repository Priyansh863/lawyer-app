"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Menu,
  X,
} from "lucide-react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import { useTranslation } from "@/hooks/useTranslation"
import NotificationBell from "@/components/notifications/NotificationBell"
import { useNotifications } from "@/contexts/NotificationContext"
import { Badge } from "@/components/ui/badge"

interface NavItemProps {
  href: string
  label: string
  isActive: boolean
  badge?: number
}

function NavItem({ href, label, isActive, badge }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between px-4 py-2 rounded-sm text-sm font-bold transition-all duration-200",
        isActive
          ? "bg-[#0F172A] text-white shadow-md active:scale-95"
          : "text-slate-700 hover:text-slate-900 hover:bg-slate-50",
      )}
    >
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge className="bg-red-600 text-white border-none h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] hover:bg-red-600">
          {badge > 99 ? '99+' : badge}
        </Badge>
      )}
    </Link>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const user = useSelector((state: RootState) => state.auth.user)
  const { t } = useTranslation()
  const { unreadCount } = useNotifications()

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
    { href: "/dashboard", label: t('navigation.dashboard') },
    { href: "/notifications", label: t('navigation.notifications') },
    { href: "/cases", label: t('navigation.cases') },
    { href: "/client", label: user?.account_type === "lawyer" ? t('navigation.clients') : t('navigation.lawyers') },
    { href: "/documents", label: t('navigation.documents') },
    { href: "/posts", label: t('navigation.postsAndContent') },
    // { href: "/profile", label: t('navigation.profile') },
    // { href: "/bookmarks", label: t('navigation.bookmarks') },
    { href: "/chat", label: t('navigation.chat') },
    { href: "/video-consultations", label: t('navigation.videoConsultations') },
    { href: "/qa", label: t('navigation.qa') },
    { href: "/token", label: t('navigation.token') },
    { href: "/settings", label: t('navigation.settings') },
  ]

  return (
    <>
      {/* Mobile Header with only Hamburger and Notification Bell */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b z-40 flex items-center justify-between px-4">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          <NotificationBell />
        </div>
      )}

      {/* Mobile Overlay - covers the entire screen with higher z-index */}
      {isMobile && isOpen && <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setIsOpen(false)} />}

      {/* Sidebar with even higher z-index */}
      <aside
        className={cn(
          "bg-white border-r border-slate-200 z-[60] transition-all duration-300 ease-in-out",
          isMobile ? "fixed top-0 left-0 h-full w-64" : "sticky top-0 h-screen w-64",
          isMobile && !isOpen && "transform -translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header with border positioned higher */}
          <div className="h-16 flex items-center px-8 border-b border-slate-200">
            <h1 className="text-2xl font-serif font-bold text-[#0F172A] tracking-tight">Lawgg</h1>
          </div>
          <nav
            className="flex-1 p-4 space-y-0.5 overflow-y-auto"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
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
                label={item.label}
                isActive={pathname === item.href || (item.href === "/cases" && pathname.startsWith("/cases"))}
                badge={item.href === '/notifications' ? unreadCount : undefined}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}