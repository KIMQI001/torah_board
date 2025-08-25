"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { Wallet } from "lucide-react"
import { useState } from "react"
import { useLanguage } from "@/hooks/use-language"

export function Header() {
  const [isConnected, setIsConnected] = useState(false)
  const { t } = useLanguage()

  const connectWallet = () => {
    setIsConnected(!isConnected)
  }

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-6">
        <div className="ml-auto flex items-center space-x-4">
          <LanguageToggle />
          <ThemeToggle />
          
          <Button 
            variant={isConnected ? "secondary" : "default"} 
            onClick={connectWallet}
            className="flex items-center space-x-2 min-w-[140px] justify-center"
          >
            <Wallet className="h-4 w-4 flex-shrink-0" />
            <span className="whitespace-nowrap">{t(isConnected ? 'common.connected' : 'common.connectWallet')}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}