export interface ColorTheme {
  // Primary Colors
  primary: string;
  primaryLight: string; 
  primaryDark: string;
  
  // Accent Colors
  accent: string;
  error: string;
  success: string;
  warning: string;
  
  // Background Colors
  background: string;
  surface: string;
  card: string;
  
  // Text Colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Border & Divider
  border: string;
  divider: string;
  
  // Glassmorphic effect colors
  glassBackground: string;
  glassBorder: string;
  
  // Tab bar
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export const lightColors: ColorTheme = {
  // Primary Colors - Modern Blue/Purple gradient
  primary: '#6C5CE7',
  primaryLight: '#A29BFE', 
  primaryDark: '#5A4FCF',
  
  // Accent Colors
  accent: '#FDCB6E',
  error: '#FF6B6B',
  success: '#55EFC4',
  warning: '#FDCB6E',
  
  // Background Colors
  background: '#FFFFFF',
  surface: '#F8F9FA',
  card: '#FFFFFF',
  
  // Text Colors
  text: '#2D3748',
  textSecondary: '#718096',
  textTertiary: '#A0AEC0',
  
  // Border & Divider
  border: '#E2E8F0',
  divider: '#EDF2F7',
  
  // Glassmorphic effect
  glassBackground: 'rgba(255, 255, 255, 0.25)',
  glassBorder: 'rgba(255, 255, 255, 0.18)',
  
  // Tab bar
  tabBarBackground: 'rgba(255, 255, 255, 0.95)',
  tabBarActive: '#6C5CE7',
  tabBarInactive: '#A0AEC0',
};

export const darkColors: ColorTheme = {
  // Primary Colors
  primary: '#A29BFE',
  primaryLight: '#DDDDF7',
  primaryDark: '#6C5CE7',
  
  // Accent Colors
  accent: '#FDCB6E',
  error: '#FF7675',
  success: '#00B894',
  warning: '#FDCB6E',
  
  // Background Colors
  background: '#1A202C',
  surface: '#2D3748',
  card: '#2D3748',
  
  // Text Colors
  text: '#F7FAFC',
  textSecondary: '#E2E8F0',
  textTertiary: '#A0AEC0',
  
  // Border & Divider
  border: '#4A5568',
  divider: '#2D3748',
  
  // Glassmorphic effect
  glassBackground: 'rgba(45, 55, 72, 0.25)',
  glassBorder: 'rgba(255, 255, 255, 0.18)',
  
  // Tab bar
  tabBarBackground: 'rgba(45, 55, 72, 0.95)',
  tabBarActive: '#A29BFE',
  tabBarInactive: '#A0AEC0',
};

export type ColorMode = 'light' | 'dark'; 