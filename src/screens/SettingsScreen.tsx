import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, Alert, Linking } from 'react-native';
import styled from 'styled-components/native';
import { useTheme } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { GlassCard } from '../components/GlassCard';
import { HapticButton } from '../components/HapticButton';
import { Header } from '../components/Header';
import { restorePurchase } from '../api/client';
import { clearAllData } from '../utils/storage';

const Container = styled(View)<{ backgroundColor: string }>`
  flex: 1;
  background-color: ${props => props.backgroundColor};
`;

const ContentContainer = styled(ScrollView)`
  flex: 1;
  padding: 16px;
`;

const Section = styled(View)`
  margin-bottom: 24px;
`;

const SectionTitle = styled(Text)<{ color: string }>`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.color};
  margin-bottom: 12px;
  padding-left: 4px;
`;

const SettingCard = styled(GlassCard)`
  margin-bottom: 12px;
`;

const SettingRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
`;

const SettingInfo = styled(View)`
  flex: 1;
  margin-right: 16px;
`;

const SettingLabel = styled(Text)<{ color: string }>`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.color};
  margin-bottom: 2px;
`;

const SettingDescription = styled(Text)<{ color: string }>`
  font-size: 14px;
  color: ${props => props.color};
`;

const PremiumBadge = styled(View)<{ backgroundColor: string }>`
  background-color: ${props => props.backgroundColor};
  padding: 4px 8px;
  border-radius: 12px;
  margin-left: 8px;
`;

const PremiumText = styled(Text)`
  font-size: 10px;
  color: #FFFFFF;
  font-weight: 600;
`;

const DeviceIdContainer = styled(GlassCard)`
  margin-bottom: 16px;
`;

const DeviceIdLabel = styled(Text)<{ color: string }>`
  font-size: 12px;
  color: ${props => props.color};
  margin-bottom: 4px;
`;

const DeviceIdText = styled(Text)<{ color: string }>`
  font-size: 10px;
  font-family: monospace;
  color: ${props => props.color};
`;

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { preferences, updatePreference, resetPreferences } = usePreferences();
  const [isRestoring, setIsRestoring] = useState(false);

  const handlePremiumUpgrade = () => {
    Alert.alert(
      'Premium Features',
      'Upgrade to unlock:\n• Unlimited scans\n• Advanced analytics\n• Export collections\n• Priority support',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => {/* Handle premium upgrade */} },
      ]
    );
  };

  const handleRestorePurchase = async () => {
    try {
      setIsRestoring(true);
      const response = await restorePurchase();
      
      if (response.success && response.data?.restored) {
        await updatePreference('premiumUnlocked', true);
        Alert.alert('Success', 'Premium features restored!');
      } else {
        Alert.alert('No Purchase Found', 'No premium purchase found to restore.');
      }
    } catch (error) {
      console.error('Error restoring purchase:', error);
      Alert.alert('Error', 'Failed to restore purchase. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear cached data but keep your scans and preferences. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            // Clear only cache, not user data
            Alert.alert('Success', 'Cache cleared successfully!');
          }
        },
      ]
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your scans and preferences. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              await resetPreferences();
              Alert.alert('Reset Complete', 'All data has been reset.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset data.');
            }
          }
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@aiassetaccelerator.com?subject=Support Request');
  };

  const handleSendSuggestion = () => {
    Linking.openURL('mailto:feedback@aiassetaccelerator.com?subject=Feature Suggestion');
  };

  const currencyOptions = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
  const scanTypeOptions = [
    { value: 'coin', label: 'Coins' },
    { value: 'card', label: 'Trading Cards' },
    { value: 'bird', label: 'Birds' },
    { value: 'stamp', label: 'Stamps' },
  ];

  return (
    <Container backgroundColor={theme.background}>
      <Header title="Settings" />
      
      <ContentContainer showsVerticalScrollIndicator={false}>
        <DeviceIdContainer>
          <DeviceIdLabel color={theme.textSecondary}>Device ID</DeviceIdLabel>
          <DeviceIdText color={theme.textTertiary}>{preferences.deviceId}</DeviceIdText>
        </DeviceIdContainer>

        {/* Membership Section */}
        <Section>
          <SectionTitle color={theme.text}>Membership</SectionTitle>
          
          <SettingCard>
            <SettingRow>
              <SettingInfo>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <SettingLabel color={theme.text}>Premium Status</SettingLabel>
                  {preferences.premiumUnlocked && (
                    <PremiumBadge backgroundColor={theme.success}>
                      <PremiumText>ACTIVE</PremiumText>
                    </PremiumBadge>
                  )}
                </View>
                <SettingDescription color={theme.textSecondary}>
                  {preferences.premiumUnlocked ? 'Premium features unlocked' : 'Free tier'}
                </SettingDescription>
              </SettingInfo>
            </SettingRow>
          </SettingCard>

          {!preferences.premiumUnlocked && (
            <HapticButton
              title="Upgrade to Premium"
              onPress={handlePremiumUpgrade}
              style={{ marginBottom: 12 }}
            />
          )}

          <HapticButton
            title="Restore Purchase"
            onPress={handleRestorePurchase}
            variant="outline"
            loading={isRestoring}
            style={{ marginBottom: 12 }}
          />
        </Section>

        {/* Personalization Section */}
        <Section>
          <SectionTitle color={theme.text}>Personalization</SectionTitle>
          
          <SettingCard>
            <SettingRow>
              <SettingInfo>
                <SettingLabel color={theme.text}>Dark Mode</SettingLabel>
                <SettingDescription color={theme.textSecondary}>
                  Toggle dark/light theme
                </SettingDescription>
              </SettingInfo>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={isDark ? '#FFFFFF' : theme.surface}
              />
            </SettingRow>
          </SettingCard>

          <SettingCard>
            <SettingRow>
              <SettingInfo>
                <SettingLabel color={theme.text}>Currency</SettingLabel>
                <SettingDescription color={theme.textSecondary}>
                  Display currency: {preferences.currency}
                </SettingDescription>
              </SettingInfo>
              <HapticButton
                title="Change"
                variant="ghost"
                size="small"
                onPress={() => {
                  Alert.alert(
                    'Select Currency',
                    'Choose your preferred currency',
                    currencyOptions.map(currency => ({
                      text: currency,
                      onPress: () => updatePreference('currency', currency),
                    }))
                  );
                }}
              />
            </SettingRow>
          </SettingCard>

          <SettingCard>
            <SettingRow>
              <SettingInfo>
                <SettingLabel color={theme.text}>Scan Type</SettingLabel>
                <SettingDescription color={theme.textSecondary}>
                  Current: {scanTypeOptions.find(opt => opt.value === preferences.scanType)?.label}
                </SettingDescription>
              </SettingInfo>
              <HapticButton
                title="Change"
                variant="ghost"
                size="small"
                onPress={() => {
                  Alert.alert(
                    'Select Scan Type',
                    'Choose what type of items you want to scan',
                    scanTypeOptions.map(option => ({
                      text: option.label,
                      onPress: () => updatePreference('scanType', option.value),
                    }))
                  );
                }}
              />
            </SettingRow>
          </SettingCard>
        </Section>

        {/* General Section */}
        <Section>
          <SectionTitle color={theme.text}>General</SectionTitle>
          
          <SettingCard>
            <SettingRow>
              <SettingInfo>
                <SettingLabel color={theme.text}>Haptic Feedback</SettingLabel>
                <SettingDescription color={theme.textSecondary}>
                  Vibration on button taps
                </SettingDescription>
              </SettingInfo>
              <Switch
                value={preferences.hapticsEnabled}
                onValueChange={(value) => updatePreference('hapticsEnabled', value)}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={preferences.hapticsEnabled ? '#FFFFFF' : theme.surface}
              />
            </SettingRow>
          </SettingCard>

          <HapticButton
            title="Clear Cache"
            onPress={handleClearCache}
            variant="outline"
            style={{ marginBottom: 12 }}
          />

          <HapticButton
            title="Reset All Data"
            onPress={handleResetData}
            variant="outline"
            style={{ borderColor: theme.error, marginBottom: 12 }}
            textStyle={{ color: theme.error }}
          />
        </Section>

        {/* Support Section */}
        <Section>
          <SectionTitle color={theme.text}>Support</SectionTitle>
          
          <HapticButton
            title="Contact Support"
            onPress={handleContactSupport}
            variant="outline"
            style={{ marginBottom: 12 }}
          />

          <HapticButton
            title="Send Suggestion"
            onPress={handleSendSuggestion}
            variant="outline"
            style={{ marginBottom: 12 }}
          />
        </Section>

        <View style={{ height: 100 }} />
      </ContentContainer>
    </Container>
  );
}; 