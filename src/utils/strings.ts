// Localized strings for easy theming and internationalization
export const strings = {
  // App Name
  appName: 'AI Asset Accelerator',
  
  // Common Actions
  scan: 'Scan',
  identify: 'Identify',
  save: 'Save',
  cancel: 'Cancel',
  ok: 'OK',
  back: 'Back',
  next: 'Next',
  done: 'Done',
  loading: 'Loading...',
  retry: 'Retry',
  
  // Navigation
  home: 'Home',
  scanner: 'Scanner',
  collections: 'Collections',
  settings: 'Settings',
  
  // Home Screen
  homeHeadline: (scanType: string) => `Identify and track your ${scanType}s with AI precision`,
  identifyButton: (scanType: string) => `Identify ${scanType}`,
  totalCollectionValue: 'Total Collection Value',
  recentScans: 'Recent Scans',
  noScansYet: (scanType: string) => `No scans yet. Start by identifying your first ${scanType}!`,
  startScanning: 'Start Scanning',
  
  // Scan Screen
  scanningTips: 'Scanning Tips',
  positionInCircle: (scanType: string) => `Position your ${scanType} in the circle`,
  scanComplete: 'Scan Complete!',
  scanFailed: 'Scan Failed',
  analyzing: (scanType: string) => `Analyzing your ${scanType}...`,
  cameraPermissionRequired: 'Camera Permission Required',
  cameraPermissionMessage: 'Please allow camera access to scan your items.',
  cameraAccessRequired: (scanType: string) => `Camera access is required to scan your ${scanType}s.`,
  requestPermission: 'Request Permission',
  
  // Collections Screen
  items: 'Items',
  totalValue: 'Total Value',
  averageValue: 'Avg Value',
  allScans: 'All Scans',
  topValue: 'Top Value',
  scanAnother: 'Scan Another',
  noItemsYet: (scanType: string) => `No ${scanType}s yet`,
  startBuildingCollection: (scanType: string) => `Start building your collection by scanning your first ${scanType}`,
  
  // Settings Screen
  deviceId: 'Device ID',
  membership: 'Membership',
  personalization: 'Personalization',
  general: 'General',
  support: 'Support',
  premiumStatus: 'Premium Status',
  premiumActive: 'ACTIVE',
  premiumFeatures: 'Premium features unlocked',
  freeTier: 'Free tier',
  upgradeToPremium: 'Upgrade to Premium',
  restorePurchase: 'Restore Purchase',
  darkMode: 'Dark Mode',
  toggleTheme: 'Toggle dark/light theme',
  currency: 'Currency',
  displayCurrency: (currency: string) => `Display currency: ${currency}`,
  scanType: 'Scan Type',
  currentScanType: (scanType: string) => `Current: ${scanType}`,
  hapticFeedback: 'Haptic Feedback',
  vibrationOnTaps: 'Vibration on button taps',
  clearCache: 'Clear Cache',
  resetAllData: 'Reset All Data',
  contactSupport: 'Contact Support',
  sendSuggestion: 'Send Suggestion',
  
  // Scan Types
  scanTypes: {
    coin: 'coin',
    coins: 'coins',
    card: 'card',
    cards: 'cards',
    bird: 'bird',
    birds: 'birds',
    stamp: 'stamp',
    stamps: 'stamps',
  },
  
  // Scan Type Labels
  scanTypeLabels: {
    coin: 'Coins',
    card: 'Trading Cards',
    bird: 'Birds',
    stamp: 'Stamps',
  },
  
  // Error Messages
  error: 'Error',
  networkError: 'Network Error',
  serverError: 'Server Error',
  checkConnection: 'Please check your internet connection and try again.',
  tryAgainLater: 'Please try again later.',
  
  // Success Messages
  success: 'Success',
  cacheCleared: 'Cache cleared successfully!',
  premiumRestored: 'Premium features restored!',
  resetComplete: 'All data has been reset.',
  
  // Confirmation Messages
  confirmClearCache: 'This will clear cached data but keep your scans and preferences. Continue?',
  confirmResetData: 'This will permanently delete all your scans and preferences. This cannot be undone!',
  
  // Premium Features
  premiumFeaturesDescription: 'Upgrade to unlock:\n• Unlimited scans\n• Advanced analytics\n• Export collections\n• Priority support',
  noPurchaseFound: 'No premium purchase found to restore.',
  
  // Currencies
  currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
  
  // Scanning Tips
  scanningTipsText: (scanType: string) => `• Place your ${scanType} in the center circle\n• Ensure good lighting\n• Keep the camera steady\n• Use a plain background if possible`,
}; 