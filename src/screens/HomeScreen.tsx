import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styled from 'styled-components/native';
import { useTheme } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { GlassCard } from '../components/GlassCard';
import { HapticButton } from '../components/HapticButton';
import { fetchScans, calculateTotalValue, ScanResult } from '../api/client';

const Container = styled(View)<{ backgroundColor: string }>`
  flex: 1;
  background-color: ${props => props.backgroundColor};
`;

const ContentContainer = styled(ScrollView)<{ backgroundColor: string }>`
  flex: 1;
  background-color: ${props => props.backgroundColor};
`;

const HeaderSection = styled(View)`
  padding: 32px 20px 24px;
  align-items: center;
`;

const Logo = styled(Text)<{ color: string }>`
  font-size: 28px;
  font-weight: 700;
  color: ${props => props.color};
  margin-bottom: 8px;
`;

const Headline = styled(Text)<{ color: string }>`
  font-size: 16px;
  color: ${props => props.color};
  text-align: center;
  margin-bottom: 24px;
`;

const TotalValueSection = styled(View)`
  padding: 0 20px 24px;
`;

const TotalValueCard = styled(GlassCard)`
  align-items: center;
  padding: 24px;
`;

const TotalValueLabel = styled(Text)<{ color: string }>`
  font-size: 14px;
  color: ${props => props.color};
  margin-bottom: 4px;
`;

const TotalValueAmount = styled(Text)<{ color: string }>`
  font-size: 32px;
  font-weight: 700;
  color: ${props => props.color};
`;

const RecentScansSection = styled(View)`
  padding: 0 20px 100px;
`;

const SectionTitle = styled(Text)<{ color: string }>`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.color};
  margin-bottom: 16px;
`;

const ScanCard = styled(GlassCard)`
  margin-bottom: 12px;
  flex-direction: row;
  align-items: center;
`;

const ScanImage = styled(View)<{ backgroundColor: string }>`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background-color: ${props => props.backgroundColor};
  margin-right: 16px;
  align-items: center;
  justify-content: center;
`;

const ScanImageText = styled(Text)`
  font-size: 24px;
`;

const ScanInfo = styled(View)`
  flex: 1;
`;

const ScanName = styled(Text)<{ color: string }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.color};
  margin-bottom: 4px;
`;

const ScanValue = styled(Text)<{ color: string }>`
  font-size: 14px;
  color: ${props => props.color};
`;

const EmptyState = styled(View)`
  align-items: center;
  padding: 40px 20px;
`;

const EmptyStateText = styled(Text)<{ color: string }>`
  font-size: 16px;
  color: ${props => props.color};
  text-align: center;
  margin-bottom: 24px;
`;

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { preferences } = usePreferences();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load recent scans and total value
      const [scansResponse, totalResponse] = await Promise.all([
        fetchScans(5, 0), // Get latest 5 scans
        calculateTotalValue(preferences.currency),
      ]);

      if (scansResponse.success && scansResponse.data) {
        setScans(scansResponse.data);
      }

      if (totalResponse.success && totalResponse.data) {
        setTotalValue(totalResponse.data.total);
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleIdentifyPress = () => {
    navigation.navigate('Scan');
  };

  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [preferences.currency])
  );

  const getScanTypeLabel = () => {
    const typeLabels: Record<string, string> = {
      coin: 'coins',
      card: 'cards',
      bird: 'birds',
      stamp: 'stamps',
    };
    return typeLabels[preferences.scanType] || 'items';
  };

  return (
    <Container backgroundColor={theme.background}>
      <ContentContainer
        backgroundColor={theme.background}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <HeaderSection>
          <Logo color={theme.text}>AI Asset Accelerator</Logo>
          <Headline color={theme.textSecondary}>
            Identify and track your {getScanTypeLabel()} with AI precision
          </Headline>
          
          <HapticButton
            title={`Identify ${preferences.scanType}`}
            onPress={handleIdentifyPress}
            size="large"
            style={{ width: '100%' }}
          />
        </HeaderSection>

        <TotalValueSection>
          <TotalValueCard>
            <TotalValueLabel color={theme.textSecondary}>
              Total Collection Value
            </TotalValueLabel>
            <TotalValueAmount color={theme.text}>
              ${totalValue.toLocaleString()}
            </TotalValueAmount>
          </TotalValueCard>
        </TotalValueSection>

        <RecentScansSection>
          <SectionTitle color={theme.text}>Recent Scans</SectionTitle>
          
          {scans.length === 0 ? (
            <EmptyState>
              <EmptyStateText color={theme.textSecondary}>
                No scans yet. Start by identifying your first {preferences.scanType}!
              </EmptyStateText>
              <HapticButton
                title="Start Scanning"
                onPress={handleIdentifyPress}
                variant="outline"
              />
            </EmptyState>
          ) : (
            scans.map((scan) => (
              <ScanCard key={scan.id}>
                <ScanImage backgroundColor={theme.surface}>
                  <ScanImageText>🪙</ScanImageText>
                </ScanImage>
                <ScanInfo>
                  <ScanName color={theme.text}>{scan.name}</ScanName>
                  <ScanValue color={theme.textSecondary}>
                    ${scan.value} {scan.currency}
                  </ScanValue>
                </ScanInfo>
              </ScanCard>
            ))
          )}
        </RecentScansSection>
      </ContentContainer>
    </Container>
  );
}; 