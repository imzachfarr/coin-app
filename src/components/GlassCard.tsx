import React from 'react';
import { View, ViewStyle } from 'react-native';
import styled from 'styled-components/native';
import { useTheme } from '../contexts/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  margin?: number;
  borderRadius?: number;
  blur?: boolean;
}

const StyledCard = styled(View)<{
  backgroundColor: string;
  borderColor: string;
  borderRadius: number;
  padding: number;
  margin: number;
}>`
  background-color: ${props => props.backgroundColor};
  border: 1px solid ${props => props.borderColor};
  border-radius: ${props => props.borderRadius}px;
  padding: ${props => props.padding}px;
  margin: ${props => props.margin}px;
  
  /* iOS shadow */
  shadow-color: rgba(0, 0, 0, 0.1);
  shadow-offset: 0px 4px;
  shadow-opacity: 0.15;
  shadow-radius: 12px;
  
  /* Android shadow */
  elevation: 8;
`;

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  padding = 16,
  margin = 0,
  borderRadius = 12,
  blur = true,
}) => {
  const { theme } = useTheme();

  return (
    <StyledCard
      backgroundColor={theme.glassBackground}
      borderColor={theme.glassBorder}
      borderRadius={borderRadius}
      padding={padding}
      margin={margin}
      style={style}
    >
      {children}
    </StyledCard>
  );
}; 