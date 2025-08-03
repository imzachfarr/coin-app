import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  getOrCreateDeviceId, 
  getPreference, 
  setPreference, 
  STORAGE_KEYS 
} from '@/utils/storage';

export interface UserPreferences {
  deviceId: string;
  premiumUnlocked: boolean;
  hapticsEnabled: boolean;
  hasSeenOnboarding: boolean;
  currency: string;
  scanType: string; // For theme-agnostic asset types (coins, cards, birds, etc.)
}

interface PreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  updatePreference: <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => Promise<void>;
  setPremiumUnlocked: (unlocked: boolean) => Promise<void>;
  setHasSeenOnboarding: (seen: boolean) => Promise<void>;
  resetPreferences: () => Promise<void>;
}

const defaultPreferences: UserPreferences = {
  deviceId: '',
  premiumUnlocked: false,
  hapticsEnabled: true,
  hasSeenOnboarding: false,
  currency: 'USD',
  scanType: 'coin', // Default to coins, but can be changed to birds, cards, etc.
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

interface PreferencesProviderProps {
  children: ReactNode;
}

export const PreferencesProvider: React.FC<PreferencesProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      
      // Load or create device ID
      const deviceId = await getOrCreateDeviceId();
      
      // Load all preferences
      const [
        premiumUnlocked,
        hapticsEnabled,
        hasSeenOnboarding,
        currency,
        scanType,
      ] = await Promise.all([
        getPreference(STORAGE_KEYS.PREMIUM_UNLOCKED, false),
        getPreference(STORAGE_KEYS.HAPTICS_ENABLED, true),
        getPreference(STORAGE_KEYS.HAS_SEEN_ONBOARDING, false),
        getPreference('currency', 'USD'),
        getPreference('scan_type', 'coin'),
      ]);

      setPreferences({
        deviceId,
        premiumUnlocked,
        hapticsEnabled,
        hasSeenOnboarding,
        currency,
        scanType,
      });
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Set default preferences on error
      const deviceId = await getOrCreateDeviceId();
      setPreferences({
        ...defaultPreferences,
        deviceId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ): Promise<void> => {
    try {
      // Map preference keys to storage keys
      const storageKeyMap: Record<keyof UserPreferences, string> = {
        deviceId: STORAGE_KEYS.DEVICE_ID,
        premiumUnlocked: STORAGE_KEYS.PREMIUM_UNLOCKED,
        hapticsEnabled: STORAGE_KEYS.HAPTICS_ENABLED,
        hasSeenOnboarding: STORAGE_KEYS.HAS_SEEN_ONBOARDING,
        currency: 'currency',
        scanType: 'scan_type',
      };

      const storageKey = storageKeyMap[key];
      await setPreference(storageKey, value);
      
      setPreferences(prev => ({
        ...prev,
        [key]: value,
      }));
    } catch (error) {
      console.error(`Error updating preference ${key}:`, error);
      throw error;
    }
  };

  const setPremiumUnlocked = async (unlocked: boolean): Promise<void> => {
    await updatePreference('premiumUnlocked', unlocked);
  };

  const setHasSeenOnboarding = async (seen: boolean): Promise<void> => {
    await updatePreference('hasSeenOnboarding', seen);
  };

  const resetPreferences = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Keep device ID but reset other preferences
      const deviceId = preferences.deviceId;
      const resetPrefs = {
        ...defaultPreferences,
        deviceId,
      };
      
      // Update all preferences
      await Promise.all([
        setPreference(STORAGE_KEYS.PREMIUM_UNLOCKED, false),
        setPreference(STORAGE_KEYS.HAPTICS_ENABLED, true),
        setPreference(STORAGE_KEYS.HAS_SEEN_ONBOARDING, false),
        setPreference('currency', 'USD'),
        setPreference('scan_type', 'coin'),
      ]);
      
      setPreferences(resetPrefs);
    } catch (error) {
      console.error('Error resetting preferences:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const value: PreferencesContextType = {
    preferences,
    isLoading,
    updatePreference,
    setPremiumUnlocked,
    setHasSeenOnboarding,
    resetPreferences,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = (): PreferencesContextType => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}; 