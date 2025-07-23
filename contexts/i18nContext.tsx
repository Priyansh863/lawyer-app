'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'

// Import translation files
import enCommon from '../public/locales/en/common.json'
import enPages from '../public/locales/en/pages.json'
import koCommon from '../public/locales/ko/common.json'
import koPages from '../public/locales/ko/pages.json'

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        pages: enPages,
      },
      ko: {
        common: koCommon,
        pages: koPages,
      },
    },
    lng: 'ko', // default language
    fallbackLng: 'ko',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

export type Language = 'en' | 'ko'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, options?: any) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: ReactNode
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ko')
  const { t, i18n: i18nInstance } = useTranslation(['common', 'pages'])

  // Load saved language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ko')) {
        setLanguageState(savedLanguage)
        i18nInstance.changeLanguage(savedLanguage)
      }
    }
  }, [i18nInstance])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    i18nInstance.changeLanguage(lang)
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }

  const contextValue: I18nContextType = {
    language,
    setLanguage,
    t,
  }

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export default i18n
