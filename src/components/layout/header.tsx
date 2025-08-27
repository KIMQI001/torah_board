"use client"

import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { WalletButton } from "@/components/wallet/WalletButton"
import { useLanguage } from "@/hooks/use-language"

export function Header() {
  const { t } = useLanguage()

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-6">
        <div className="ml-auto flex items-center space-x-4">
          <LanguageToggle />
          <ThemeToggle />
          <WalletButton className="min-w-[140px] justify-center" />
        </div>
      </div>
    </header>
  )
}