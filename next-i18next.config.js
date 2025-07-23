module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ko'],
    localeDetection: false, // Disable automatic locale detection
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  saveMissing: false,
  strictMode: true,
  serializeConfig: false,
  react: {
    useSuspense: false,
  },
}
