"use client"

import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { WalletButton } from "@/components/wallet/WalletButton"
import { useLanguage } from "@/hooks/use-language"
import { useLayout } from "@/contexts/LayoutContext"
import { Button } from "@/components/ui/button"
import { PanelLeft, Maximize2, Minimize2 } from "lucide-react"

export function Header() {
  const { t } = useLanguage()
  const { isSidebarHidden, isFullscreen, toggleSidebar, toggleFullscreen } = useLayout()

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-6">
        {/* 左侧控制按钮 */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="flex items-center space-x-2"
            title={isSidebarHidden ? "显示侧边栏 (Ctrl+B)" : "隐藏侧边栏 (Ctrl+B)"}
          >
            <PanelLeft className={`h-4 w-4 transition-transform ${isSidebarHidden ? 'rotate-180' : ''}`} />
            <span className="hidden md:inline">
              {isSidebarHidden ? "显示导航" : "隐藏导航"}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="flex items-center space-x-2"
            title={isFullscreen ? "退出全屏 (F11)" : "进入全屏 (F11)"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
            <span className="hidden md:inline">
              {isFullscreen ? "退出全屏" : "全屏模式"}
            </span>
          </Button>
        </div>

        {/* 右侧功能按钮 */}
        <div className="ml-auto flex items-center space-x-4">
          <LanguageToggle />
          <ThemeToggle />
          <WalletButton className="min-w-[140px] justify-center" />
        </div>
      </div>
    </header>
  )
}