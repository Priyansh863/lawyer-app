"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import { useTranslation } from "@/hooks/useTranslation"
import { useNotifications } from "@/contexts/NotificationContext"
import { Badge } from "@/components/ui/badge"

interface NavItemProps {
  href: string
  label: string
  isActive: boolean
  badge?: number
  onClick?: () => void
}

function NavItem({ href, label, isActive, badge, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
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

export function SidebarContent({ onNavItemClick }: { onNavItemClick?: () => void }) {
  const pathname = usePathname()
  const user = useSelector((state: RootState) => state.auth.user)
  const { t } = useTranslation()
  const { unreadCount } = useNotifications()

  const navItems = [
    { href: "/dashboard", label: t('navigation.dashboard') },
    { href: "/notifications", label: t('navigation.notifications') },
    { href: "/cases", label: t('navigation.cases') },
    { href: "/client", label: user?.account_type === "lawyer" ? t('navigation.clients') : t('navigation.lawyers') },
    { href: "/documents", label: t('navigation.documents') },
    { href: "/posts", label: t('navigation.postsAndContent') },
    { href: "/chat", label: t('navigation.chat') },
    { href: "/video-consultations", label: t('navigation.videoConsultations') },
    { href: "/qa", label: t('navigation.qa') },
    { href: "/token", label: t('navigation.token') },
    { href: "/settings", label: t('navigation.settings') },
  ]

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="h-16 flex items-center px-8 border-b border-slate-200">
        <h1 className="text-2xl font-serif font-bold text-[#0F172A] tracking-tight">Lawgg</h1>
      </div>
      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            isActive={pathname === item.href || (item.href === "/cases" && pathname.startsWith("/cases"))}
            badge={item.href === '/notifications' ? unreadCount : undefined}
            onClick={onNavItemClick}
          />
        ))}
      </nav>
    </div>
  )
}

export default function Sidebar() {
  return (
    <aside className="hidden md:block sticky top-0 h-screen w-64 bg-white border-r border-slate-200 z-[60]">
      <SidebarContent />
    </aside>
  )
}