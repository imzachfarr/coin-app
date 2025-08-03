import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import styled from 'styled-components/native';
import { useTheme } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';

interface HapticButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticType?: Haptics.ImpactFeedbackStyle;
}

const StyledButton = styled(TouchableOpacity)<{
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  paddingVertical: number;
  paddingHorizontal: number;
  opacity: number;
}>`
  background-color: ${props => props.backgroundColor};
  border-color: ${props => props.borderColor};
  border-width: ${props => props.borderWidth}px;
  border-radius: ${props => props.borderRadius}px;
  padding-vertical: ${props => props.paddingVertical}px;
  padding-horizontal: ${props => props.paddingHorizontal}px;
  opacity: ${props => props.opacity};
  align-items: center;
  justify-content: center;
  flex-direction: row;
`;

const StyledText = styled(Text)<{
  color: string;
  fontSize: number;
  fontWeight: string;
}>`
  color: ${props => props.color};
  font-size: ${props => props.fontSize}px;
  font-weight: ${props => props.fontWeight};
  text-align: center;
`;

export const HapticButton: React.FC<HapticButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  hapticType = Haptics.ImpactFeedbackStyle.Medium,
}) => {
  const { theme } = useTheme();
  const { preferences } = usePreferences();

  const handlePress = async () => {
    if (disabled || loading) return;

    // Trigger haptic feedback if enabled
    if (preferences.hapticsEnabled) {
      try {
        await Haptics.impactAsync(hapticType);
      } catch (error) {
        // Haptics may fail on some devices/simulators
        console.log('Haptic feedback not available');
      }
    }

    onPress();
  };

  // Define button styles based on variant
  const getButtonStyles = () => {
    const baseStyles = {
      borderRadius: 12,
      paddingVertical: size === 'small' ? 8 : size === 'large' ? 16 : 12,
      paddingHorizontal: size === 'small' ? 16 : size === 'large' ? 32 : 24,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: theme.primary,
          borderColor: theme.primary,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: 1,
        };
      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderColor: theme.primary,
          borderWidth: 1,
        };
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
        };
      default:
        return {
          ...baseStyles,
          backgroundColor: theme.primary,
          borderColor: theme.primary,
          borderWidth: 0,
        };
    }
  };

  // Define text styles based on variant
  const getTextStyles = () => {
    const baseStyles = {
      fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
      fontWeight: '600',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          color: '#FFFFFF',
        };
      case 'secondary':
        return {
          ...baseStyles,
          color: theme.text,
        };
      case 'outline':
      case 'ghost':
        return {
          ...baseStyles,
          color: theme.primary,
        };
      default:
        return {
          ...baseStyles,
          color: '#FFFFFF',
        };
    }
  };

  const buttonStyles = getButtonStyles();
  const textStyles = getTextStyles();

  return (
    <StyledButton
      backgroundColor={buttonStyles.backgroundColor}
      borderColor={buttonStyles.borderColor}
      borderWidth={buttonStyles.borderWidth}
      borderRadius={buttonStyles.borderRadius}
      paddingVertical={buttonStyles.paddingVertical}
      paddingHorizontal={buttonStyles.paddingHorizontal}
      opacity={disabled || loading ? 0.6 : 1}
      onPress={handlePress}
      disabled={disabled || loading}
      style={style}
      activeOpacity={0.8}
    >
      <StyledText
        color={textStyles.color}
        fontSize={textStyles.fontSize}
        fontWeight={textStyles.fontWeight}
        style={textStyle}
      >
        {loading ? 'Loading...' : title}
      </StyledText>
    </StyledButton>
  );
}; 