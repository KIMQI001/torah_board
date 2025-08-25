"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  TrendingUp, 
  Gift, 
  ArrowLeftRight, 
  DollarSign, 
  BookOpen, 
  Wrench,
  Bitcoin,
  Network,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/hooks/use-language"

const sidebarItems = [
  {
    key: "nav.dashboard",
    href: "/",
    icon: Home,
  },
  {
    key: "nav.meme",
    href: "/meme",
    icon: TrendingUp,
  },
  {
    key: "nav.airdrop",
    href: "/airdrop",
    icon: Gift,
  },
  {
    key: "nav.arbitrage",
    href: "/arbitrage",
    icon: ArrowLeftRight,
  },
  {
    key: "nav.spot",
    href: "/spot",
    icon: DollarSign,
  },
  {
    key: "nav.journal",
    href: "/journal",
    icon: BookOpen,
  },
  {
    key: "nav.tools",
    href: "/tools",
    icon: Wrench,
  },
  {
    key: "nav.depin",
    href: "/depin",
    icon: Network,
  },
  {
    key: "nav.dao",
    href: "/dao",
    icon: Users,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <div className="pb-12 min-h-screen">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center mb-8">
            <Bitcoin className="h-8 w-8 mr-2" />
            <h2 className="text-2xl font-bold">{t('common.appTitle')}</h2>
          </div>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {t(item.key)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}