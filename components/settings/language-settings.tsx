'use client'

import React from 'react'
import { useI18n, Language } from '@/contexts/i18nContext'
import { toast } from '@/hooks/use-toast'

const LanguageSettings: React.FC = () => {
  const { language, setLanguage, t } = useI18n()

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
    toast({
      title: t('common:settings.language'),
      description: t('common:settings.languageChanged'),
    })
  }

  const languages = [
    { code: 'en' as Language, name: t('common:common.english'), flag: '🇺🇸' },
    { code: 'ko' as Language, name: t('common:common.korean'), flag: '🇰🇷' },
  ]

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          {t('common:settings.language')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('common:settings.selectLanguage')}
        </p>
      </div>

      <div className="space-y-4">
        {languages.map((lang) => (
          <div
            key={lang.code}
            className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
              language === lang.code
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleLanguageChange(lang.code)}
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">{lang.flag}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{lang.name}</p>
                <p className="text-xs text-gray-500 capitalize">{lang.code}</p>
              </div>
            </div>
            {language === lang.code && (
              <div className="absolute right-4">
                <svg
                  className="h-5 w-5 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          {t('common:settings.languageChanged')}
        </p>
      </div>
    </div>
  )
}

export default LanguageSettings
