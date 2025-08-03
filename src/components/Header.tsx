import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
  transparent?: boolean;
}

const HeaderContainer = styled(View)<{
  backgroundColor: string;
  paddingTop: number;
}>`
  background-color: ${props => props.backgroundColor};
  padding-top: ${props => props.paddingTop}px;
  padding-horizontal: 16px;
  padding-bottom: 12px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  
  /* iOS shadow */
  shadow-color: rgba(0, 0, 0, 0.1);
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  
  /* Android shadow */
  elevation: 4;
`;

const HeaderTitle = styled(Text)<{
  color: string;
}>`
  color: ${props => props.color};
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  flex: 1;
`;

const BackButton = styled(TouchableOpacity)`
  padding: 8px;
  margin-left: -8px;
`;

const BackButtonText = styled(Text)<{
  color: string;
}>`
  color: ${props => props.color};
  font-size: 16px;
  font-weight: 500;
`;

const RightContainer = styled(View)`
  min-width: 32px;
  align-items: flex-end;
`;

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightElement,
  transparent = false,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar 
        barStyle={theme.background === '#FFFFFF' ? 'dark-content' : 'light-content'}
        backgroundColor={transparent ? 'transparent' : theme.background}
        translucent={transparent}
      />
      <HeaderContainer
        backgroundColor={transparent ? 'transparent' : theme.background}
        paddingTop={insets.top}
      >
        {showBackButton ? (
          <BackButton onPress={onBackPress} activeOpacity={0.7}>
            <BackButtonText color={theme.primary}>← Back</BackButtonText>
          </BackButton>
        ) : (
          <View style={{ width: 32 }} />
        )}
        
        <HeaderTitle color={theme.text}>{title}</HeaderTitle>
        
        <RightContainer>
          {rightElement}
        </RightContainer>
      </HeaderContainer>
    </>
  );
}; 