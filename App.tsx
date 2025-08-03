import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Context Providers
import { ThemeProvider } from './src/contexts/ThemeContext';
import { PreferencesProvider } from './src/contexts/PreferencesContext';

// Navigation
import { BottomTabs } from './src/navigation/BottomTabs';

export default function App() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <ThemeProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <BottomTabs />
          </NavigationContainer>
        </ThemeProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
} 