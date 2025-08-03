import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styled from 'styled-components/native';
import { useTheme } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { GlassCard } from '../components/GlassCard';
import { HapticButton } from '../components/HapticButton';
import { Header } from '../components/Header';
import { fetchScans, ScanResult } from '../api/client';

const Container = styled(View)<{ backgroundColor: string }>`
  flex: 1;
  background-color: ${props => props.backgroundColor};
`;

const TabContainer = styled(View)<{ backgroundColor: string }>`
  flex-direction: row;
  background-color: ${props => props.backgroundColor};
  margin: 16px;
  border-radius: 12px;
  padding: 4px;
`;

const TabButton = styled(TouchableOpacity)<{ 
  backgroundColor: string; 
  isActive: boolean;
}>`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  background-color: ${props => props.isActive ? props.backgroundColor : 'transparent'};
  align-items: center;
`;

const TabText = styled(Text)<{ color: string; isActive: boolean }>`
  color: ${props => props.color};
  font-size: 14px;
  font-weight: ${props => props.isActive ? '600' : '400'};
`;

const ContentContainer = styled(View)`
  flex: 1;
  padding: 0 16px;
`;

const ScanCard = styled(GlassCard)`
  margin-bottom: 16px;
  flex-direction: row;
  align-items: center;
`;

const ScanImage = styled(View)<{ backgroundColor: string }>`
  width: 80px;
  height: 80px;
  border-radius: 12px;
  background-color: ${props => props.backgroundColor};
  margin-right: 16px;
  align-items: center;
  justify-content: center;
`;

const ScanImageText = styled(Text)`
  font-size: 32px;
`;

const ScanInfo = styled(View)`
  flex: 1;
`;

const ScanName = styled(Text)<{ color: string }>`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.color};
  margin-bottom: 4px;
`;

const ScanDescription = styled(Text)<{ color: string }>`
  font-size: 14px;
  color: ${props => props.color};
  margin-bottom: 8px;
`;

const ScanDetails = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ScanValue = styled(Text)<{ color: string }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.color};
`;

const ScanDate = styled(Text)<{ color: string }>`
  font-size: 12px;
  color: ${props => props.color};
`;

const ConfidenceBadge = styled(View)<{ backgroundColor: string }>`
  background-color: ${props => props.backgroundColor};
  padding: 4px 8px;
  border-radius: 12px;
  margin-left: 8px;
`;

const ConfidenceText = styled(Text)<{ color: string }>`
  font-size: 10px;
  color: ${props => props.color};
  font-weight: 600;
`;

const EmptyState = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const EmptyStateIcon = styled(Text)`
  font-size: 64px;
  margin-bottom: 16px;
`;

const EmptyStateTitle = styled(Text)<{ color: string }>`
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.color};
  text-align: center;
  margin-bottom: 8px;
`;

const EmptyStateText = styled(Text)<{ color: string }>`
  font-size: 16px;
  color: ${props => props.color};
  text-align: center;
  margin-bottom: 24px;
`;

const StatsHeader = styled(GlassCard)`
  margin-bottom: 16px;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
`;

const StatItem = styled(View)`
  align-items: center;
`;

const StatValue = styled(Text)<{ color: string }>`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.color};
`;

const StatLabel = styled(Text)<{ color: string }>`
  font-size: 12px;
  color: ${props => props.color};
  margin-top: 4px;
`;

interface CollectionsScreenProps {
  navigation: any;
}

export const CollectionsScreen: React.FC<CollectionsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { preferences } = usePreferences();
  const [activeTab, setActiveTab] = useState<'topValue' | 'all'>('all');
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadScans = async () => {
    try {
      setIsLoading(true);
      const response = await fetchScans(100, 0); // Load up to 100 scans
      
      if (response.success && response.data) {
        setScans(response.data);
      }
    } catch (error) {
      console.error('Error loading scans:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadScans();
  };

  // Load scans when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadScans();
    }, [])
  );

  const getFilteredScans = () => {
    if (activeTab === 'topValue') {
      return [...scans].sort((a, b) => b.value - a.value).slice(0, 10);
    }
    return scans.sort((a, b) => new Date(b.scanDate).getTime() - new Date(a.scanDate).getTime());
  };

  const getTotalValue = () => {
    return scans.reduce((total, scan) => total + scan.value, 0);
  };

  const getAverageValue = () => {
    return scans.length > 0 ? getTotalValue() / scans.length : 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return theme.success;
    if (confidence >= 0.6) return theme.warning;
    return theme.error;
  };

  const getScanTypeEmoji = () => {
    const emojiMap: Record<string, string> = {
      coin: '🪙',
      card: '🃏',
      bird: '🐦',
      stamp: '📮',
    };
    return emojiMap[preferences.scanType] || '📦';
  };

  const handleScanPress = () => {
    navigation.navigate('Scan');
  };

  const filteredScans = getFilteredScans();

  return (
    <Container backgroundColor={theme.background}>
      <Header title="Collections" />
      
      {scans.length > 0 && (
        <View style={{ padding: 16 }}>
          <StatsHeader>
            <StatItem>
              <StatValue color={theme.text}>{scans.length}</StatValue>
              <StatLabel color={theme.textSecondary}>Items</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue color={theme.text}>${getTotalValue().toLocaleString()}</StatValue>
              <StatLabel color={theme.textSecondary}>Total Value</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue color={theme.text}>${getAverageValue().toFixed(0)}</StatValue>
              <StatLabel color={theme.textSecondary}>Avg Value</StatLabel>
            </StatItem>
          </StatsHeader>
        </View>
      )}

      <TabContainer backgroundColor={theme.surface}>
        <TabButton
          backgroundColor={theme.primary}
          isActive={activeTab === 'all'}
          onPress={() => setActiveTab('all')}
        >
          <TabText color={activeTab === 'all' ? '#FFFFFF' : theme.text} isActive={activeTab === 'all'}>
            All Scans
          </TabText>
        </TabButton>
        <TabButton
          backgroundColor={theme.primary}
          isActive={activeTab === 'topValue'}
          onPress={() => setActiveTab('topValue')}
        >
          <TabText color={activeTab === 'topValue' ? '#FFFFFF' : theme.text} isActive={activeTab === 'topValue'}>
            Top Value
          </TabText>
        </TabButton>
      </TabContainer>

      <ContentContainer>
        {filteredScans.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon>{getScanTypeEmoji()}</EmptyStateIcon>
            <EmptyStateTitle color={theme.text}>
              No {preferences.scanType}s yet
            </EmptyStateTitle>
            <EmptyStateText color={theme.textSecondary}>
              Start building your collection by scanning your first {preferences.scanType}
            </EmptyStateText>
            <HapticButton
              title={`Scan ${preferences.scanType}`}
              onPress={handleScanPress}
              size="large"
            />
          </EmptyState>
        ) : (
          <FlatList
            data={filteredScans}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => (
              <ScanCard>
                <ScanImage backgroundColor={theme.surface}>
                  <ScanImageText>{getScanTypeEmoji()}</ScanImageText>
                </ScanImage>
                <ScanInfo>
                  <ScanName color={theme.text}>{item.name}</ScanName>
                  <ScanDescription color={theme.textSecondary} numberOfLines={2}>
                    {item.description}
                  </ScanDescription>
                  <ScanDetails>
                    <ScanValue color={theme.text}>
                      ${item.value} {item.currency}
                    </ScanValue>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <ScanDate color={theme.textSecondary}>
                        {formatDate(item.scanDate)}
                      </ScanDate>
                      <ConfidenceBadge backgroundColor={getConfidenceColor(item.confidence)}>
                        <ConfidenceText color="#FFFFFF">
                          {Math.round(item.confidence * 100)}%
                        </ConfidenceText>
                      </ConfidenceBadge>
                    </View>
                  </ScanDetails>
                </ScanInfo>
              </ScanCard>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ContentContainer>

      {scans.length > 0 && (
        <View style={{ 
          position: 'absolute', 
          bottom: 100, 
          right: 20,
        }}>
          <HapticButton
            title="Scan Another"
            onPress={handleScanPress}
            style={{
              width: 120,
              backgroundColor: theme.accent,
            }}
          />
        </View>
      )}
    </Container>
  );
}; 