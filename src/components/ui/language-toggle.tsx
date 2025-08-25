"use client"

import * as React from "react"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/hooks/use-language"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  const toggleLanguage = () => {
    const nextLanguage = language === "en" ? "zh" : "en"
    setLanguage(nextLanguage)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="transition-colors font-medium w-[68px] justify-between px-2"
      title={language === "en" ? "切换到中文" : "Switch to English"}
    >
      <Languages className="h-4 w-4 flex-shrink-0" />
      <span className="text-xs w-6 text-center flex-shrink-0">
        {language === "en" ? "中文" : "EN"}
      </span>
    </Button>
  )
}