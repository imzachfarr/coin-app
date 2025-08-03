import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { lightColors, darkColors, ColorTheme, ColorMode } from '@/theme/colors';
import { getPreference, setPreference, STORAGE_KEYS } from '@/utils/storage';

interface ThemeContextType {
  theme: ColorTheme;
  colorMode: ColorMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [colorMode, setColorMode] = useState<ColorMode>('light');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme from storage or system preference
  const initializeTheme = async () => {
    try {
      // Get saved theme preference
      const savedTheme = await getPreference<ColorMode>(STORAGE_KEYS.THEME_MODE, 'auto' as ColorMode);
      
      if (savedTheme === 'auto' || !savedTheme) {
        // Use system preference
        const systemTheme = Appearance.getColorScheme();
        setColorMode(systemTheme === 'dark' ? 'dark' : 'light');
      } else {
        setColorMode(savedTheme);
      }
    } catch (error) {
      console.error('Error initializing theme:', error);
      // Fallback to system theme
      const systemTheme = Appearance.getColorScheme();
      setColorMode(systemTheme === 'dark' ? 'dark' : 'light');
    } finally {
      setIsInitialized(true);
    }
  };

  // Handle system theme changes
  const handleSystemThemeChange = async (preferences: { colorScheme: ColorSchemeName }) => {
    const savedTheme = await getPreference<ColorMode>(STORAGE_KEYS.THEME_MODE, 'auto' as ColorMode);
    
    // Only follow system changes if user hasn't set a manual preference
    if (savedTheme === 'auto' || !savedTheme) {
      setColorMode(preferences.colorScheme === 'dark' ? 'dark' : 'light');
    }
  };

  const toggleTheme = async () => {
    const newMode: ColorMode = colorMode === 'light' ? 'dark' : 'light';
    setColorMode(newMode);
    await setPreference(STORAGE_KEYS.THEME_MODE, newMode);
  };

  const setTheme = async (mode: ColorMode) => {
    setColorMode(mode);
    await setPreference(STORAGE_KEYS.THEME_MODE, mode);
  };

  useEffect(() => {
    initializeTheme();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(handleSystemThemeChange);
    return () => subscription?.remove();
  }, []);

  // Don't render until theme is initialized
  if (!isInitialized) {
    return null;
  }

  const theme = colorMode === 'dark' ? darkColors : lightColors;
  const isDark = colorMode === 'dark';

  const value: ThemeContextType = {
    theme,
    colorMode,
    isDark,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 