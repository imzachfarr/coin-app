import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Import screens
import { HomeScreen } from '../screens/HomeScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { CollectionsScreen } from '../screens/CollectionsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// Tab navigator types
export type BottomTabParamList = {
  Home: undefined;
  Scan: undefined;
  Collections: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

// React Native icon component using Text
const TabIcon = ({ name, size = 24, color }: { name: string; size?: number; color: string }) => {
  const iconMap: Record<string, string> = {
    Home: '🏠',
    Scan: '📷',
    Collections: '📚',
    Settings: '⚙️',
  };

  return (
    <Text style={{ fontSize: size, color }}>
      {iconMap[name] || '❓'}
    </Text>
  );
};

const BottomTabs: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBarBackground,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          height: Platform.OS === 'ios' ? 88 : 68,
          
          // Glassmorphic effect
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          
          // iOS blur effect (limited support in React Native Web)
          ...(Platform.OS === 'ios' && {
            backgroundColor: theme.tabBarBackground,
          }),
        },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: -4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="Home" size={size} color={color} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="Scan" size={size} color={color} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Collections"
        component={CollectionsScreen}
        options={{
          tabBarLabel: 'Collections',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="Collections" size={size} color={color} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="Settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabs;
export { BottomTabs }; 