'use client'

import { useI18n } from '@/contexts/i18nContext'

/**
 * Custom hook for translations with namespace support
 * Usage examples:
 * - const { t } = useTranslation()
 * - t('common:navigation.dashboard') // "Dashboard" or "대시보드"
 * - t('pages:cases.title') // "Cases" or "사건"
 */
export const useTranslation = () => {
  const { t: i18nT, language, setLanguage } = useI18n()

  const t = (key: string, options?: any) => {
    // Handle namespace:key format
    if (key.includes(':')) {
      const [namespace, ...keyParts] = key.split(':')
      const actualKey = keyParts.join(':')
      return i18nT(`${namespace}:${actualKey}`, options)
    }
    
    // Default to common namespace if no namespace provided
    return i18nT(`common:${key}`, options)
  }

  return {
    t,
    language,
    setLanguage,
  }
}

export default useTranslation
