"use client"

import { ReactNode } from 'react'
import { LanguageContext, useLanguageState } from '@/hooks/use-language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const languageState = useLanguageState()

  return (
    <LanguageContext.Provider value={languageState}>
      {children}
    </LanguageContext.Provider>
  )
}