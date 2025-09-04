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
  Users,
  Newspaper,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/hooks/use-language"
import { useState } from "react"

const sidebarItems = [
  {
    key: "nav.dashboard",
    href: "/",
    icon: Home,
  },
  {
    key: "nav.meme",
    icon: TrendingUp,
    hasSubmenu: true,
    submenu: [
      {
        key: "MemeOverview",
        href: "/meme",
        label: "Meme 概览"
      },
      {
        key: "LogEarn",
        href: "/meme/gmgn",
        label: "LogEarn"
      },
      {
        key: "MemeBot",
        href: "/meme/bot",
        label: "Bot 推送"
      }
    ]
  },
  {
    key: "nav.airdrop",
    icon: Gift,
    hasSubmenu: true,
    submenu: [
      {
        key: "AirdropOverview",
        href: "/airdrop",
        label: "空投概览"
      },
      {
        key: "ProjectHunting",
        href: "/airdrop/rootdata",
        label: "项目巡猎"
      }
    ]
  },
  {
    key: "nav.arbitrage",
    icon: ArrowLeftRight,
    hasSubmenu: true,
    submenu: [
      {
        key: "ArbitrageOverview",
        href: "/arbitrage",
        label: "套利概览"
      },
      {
        key: "Circular",
        href: "/arbitrage/circular",
        label: "Circular"
      },
      {
        key: "Jito",
        href: "/arbitrage/jito",
        label: "Jito Explorer"
      }
    ]
  },
  {
    key: "nav.news",
    icon: Newspaper,
    hasSubmenu: true,
    submenu: [
      {
        key: "PANews",
        href: "/news/panews",
        label: "PANews"
      },
      {
        key: "Odaily",
        href: "/news/odaily", 
        label: "Odaily"
      },
      {
        key: "RealTimeNews",
        href: "/news/realtime",
        label: "实时快讯"
      }
    ]
  },
  {
    key: "nav.spot",
    icon: DollarSign,
    hasSubmenu: true,
    submenu: [
      {
        key: "CryptoMarket",
        href: "/spot/coingecko",
        label: "市场数据"
      },
      {
        key: "TradingChart",
        href: "/spot/tradingview",
        label: "交易图表"
      },
      {
        key: "CoinGlass",
        href: "/spot/coinglass",
        label: "CoinGlass"
      },
      {
        key: "IndicatorData",
        href: "/spot/indicators",
        label: "交易指标"
      },
      {
        key: "HuggingDashboard",
        href: "/spot/hugging",
        label: "交易面板"
      }
    ]
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
    href: "/dao/browse",
    icon: Users,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [expandedItems, setExpandedItems] = useState<string[]>(['nav.news'])

  const toggleExpanded = (key: string) => {
    setExpandedItems(prev => 
      prev.includes(key) 
        ? prev.filter(item => item !== key)
        : [...prev, key]
    )
  }

  const isActive = (href: string, key: string) => {
    if (href) {
      return pathname === href || (href === '/dao/browse' && pathname.startsWith('/dao'))
    }
    // For news submenu items, check if current path starts with /news
    if (key === 'nav.news') {
      return pathname.startsWith('/news')
    }
    return false
  }

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
              <div key={item.key || item.href}>
                {item.hasSubmenu ? (
                  // 有子菜单的项目
                  <>
                    <button
                      onClick={() => toggleExpanded(item.key)}
                      className={cn(
                        "flex items-center w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive(item.href, item.key)
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {t(item.key)}
                      {expandedItems.includes(item.key) ? (
                        <ChevronDown className="ml-auto h-4 w-4" />
                      ) : (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
                    </button>
                    {expandedItems.includes(item.key) && item.submenu && (
                      <div className="ml-5 mt-1 space-y-0.5 border-l border-border/30 pl-3">
                        {item.submenu.map((subItem, index) => (
                          <Link
                            key={subItem.key}
                            href={subItem.href}
                            className={cn(
                              "group flex items-center rounded-md px-2 py-1.5 text-xs font-normal transition-all duration-150 hover:bg-accent/50",
                              pathname === subItem.href
                                ? "bg-accent/70 text-accent-foreground/90"
                                : "text-muted-foreground/70 hover:text-muted-foreground"
                            )}
                          >
                            <div className={cn(
                              "mr-2 h-1 w-1 rounded-full transition-all duration-150",
                              pathname === subItem.href
                                ? "bg-accent-foreground/60"
                                : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
                            )} />
                            <span className="text-xs">{subItem.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  // 普通菜单项
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      isActive(item.href, item.key)
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {t(item.key)}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}