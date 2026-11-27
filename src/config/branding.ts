export const BRAND_CONFIG = {
  appName: 'Voice Access',
  shortTagline: 'Voice-first digital access in Indian languages',
  hackathonTrack: 'Accessible Voice Interface Prototype',
  demoSecurityPinHint: '1234',
  supportedLanguages: [
    {
      code: 'en-IN' as const,
      label: 'English (India)',
      nativeLabel: 'English',
      speechLocale: 'en-IN',
      status: 'Active',
    },
    {
      code: 'te-IN' as const,
      label: 'Telugu',
      nativeLabel: 'తెలుగు',
      speechLocale: 'te-IN',
      status: 'Active',
    },
    {
      code: 'mixed' as const,
      label: 'Mixed (Telugu + English)',
      nativeLabel: 'తెలుగు / English',
      speechLocale: 'en-IN',
      status: 'Active',
    },
  ],
  extensibleLanguages: ['Hindi (hi-IN)', 'Tamil (ta-IN)', 'Kannada (kn-IN)', 'Malayalam (ml-IN)'],
} as const;
