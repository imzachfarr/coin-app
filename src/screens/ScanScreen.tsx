import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import styled from 'styled-components/native';
import { useTheme } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { HapticButton } from '../components/HapticButton';
import { scanImage } from '../api/client';

const { width, height } = Dimensions.get('window');

const Container = styled(View)<{ backgroundColor: string }>`
  flex: 1;
  background-color: ${props => props.backgroundColor};
`;

const CameraContainer = styled(View)`
  flex: 1;
  position: relative;
`;

const StyledCameraView = styled(CameraView)`
  flex: 1;
`;

const CameraOverlay = styled(View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
`;

const CircleOverlay = styled(LinearGradient)<{ borderColor: string }>`
  width: 280px;
  height: 280px;
  border-radius: 140px;
  border: 3px solid ${props => props.borderColor};
`;

const OverlayText = styled(Text)<{ color: string }>`
  position: absolute;
  top: -50px;
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.color};
  text-align: center;
  width: 280px;
`;

const ControlsContainer = styled(View)<{ backgroundColor: string }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${props => props.backgroundColor};
  padding: 20px;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
`;

const ControlButton = styled(TouchableOpacity)<{ backgroundColor: string }>`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background-color: ${props => props.backgroundColor};
  justify-content: center;
  align-items: center;
`;

const CaptureButton = styled(TouchableOpacity)<{ backgroundColor: string; borderColor: string }>`
  width: 70px;
  height: 70px;
  border-radius: 35px;
  background-color: ${props => props.backgroundColor};
  border: 3px solid ${props => props.borderColor};
  justify-content: center;
  align-items: center;
`;

const ButtonText = styled(Text)`
  font-size: 24px;
`;

const LoadingOverlay = styled(View)<{ backgroundColor: string }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.backgroundColor};
  justify-content: center;
  align-items: center;
`;

const LoadingText = styled(Text)<{ color: string }>`
  font-size: 18px;
  font-weight: 500;
  color: ${props => props.color};
  margin-top: 16px;
`;

const PermissionContainer = styled(View)<{ backgroundColor: string }>`
  flex: 1;
  background-color: ${props => props.backgroundColor};
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const PermissionText = styled(Text)<{ color: string }>`
  font-size: 16px;
  color: ${props => props.color};
  text-align: center;
  margin-bottom: 24px;
`;

interface ScanScreenProps {
  navigation: any;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { preferences } = usePreferences();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to scan your items.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {/* Open settings */} },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      setHasPermission(false);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isLoading) return;

    try {
      setIsLoading(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      await processImage(photo.uri);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
      setIsLoading(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow photo library access.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsLoading(true);
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const processImage = async (imageUri: string) => {
    try {
      const response = await scanImage(imageUri, preferences.scanType);
      
      if (response.success && response.data) {
        // Navigate to results or show success
        Alert.alert(
          'Scan Complete!',
          `Identified: ${response.data.name}\nValue: $${response.data.value}`,
          [
            { text: 'OK', onPress: () => navigation.navigate('Collections') }
          ]
        );
      } else {
        Alert.alert('Scan Failed', response.error || 'Could not identify the item.');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      // Show a mock success for demo purposes when backend is not available
      Alert.alert(
        'Demo Mode',
        'Backend not connected. This is a demo scan.\n\nMock Result: Rare Coin\nValue: $150',
        [
          { text: 'OK', onPress: () => navigation.navigate('Collections') }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFlash = () => {
    setFlashMode(flashMode === 'off' ? 'on' : 'off');
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleHelp = () => {
    Alert.alert(
      'Scanning Tips',
      `• Place your ${preferences.scanType} in the center circle\n• Ensure good lighting\n• Keep the camera steady\n• Use a plain background if possible`,
      [{ text: 'OK' }]
    );
  };

  if (hasPermission === null) {
    return (
      <Container backgroundColor={theme.background}>
        <LoadingOverlay backgroundColor="rgba(0,0,0,0.5)">
          <LoadingText color={theme.text}>Requesting camera permission...</LoadingText>
        </LoadingOverlay>
      </Container>
    );
  }

  if (hasPermission === false) {
    return (
      <PermissionContainer backgroundColor={theme.background}>
        <PermissionText color={theme.text}>
          Camera access is required to scan your {preferences.scanType}s. 
          Please enable camera permissions in your device settings.
        </PermissionText>
        <HapticButton
          title="Request Permission"
          onPress={requestPermissions}
        />
      </PermissionContainer>
    );
  }

  return (
    <Container backgroundColor={theme.background}>
      <CameraContainer>
        <StyledCameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
          flash={flashMode}
        />
        
        <CameraOverlay>
          <CircleOverlay 
            borderColor={theme.primary}
            colors={['rgba(255, 149, 0, 0.3)', 'rgba(255, 107, 53, 0.3)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <OverlayText color="#FFFFFF">
              Position your {preferences.scanType} in the circle
            </OverlayText>
          </CircleOverlay>
        </CameraOverlay>

        <ControlsContainer backgroundColor={theme.glassBackground}>
          <ControlButton 
            backgroundColor={theme.surface}
            onPress={pickFromGallery}
          >
            <ButtonText>📷</ButtonText>
          </ControlButton>

          <CaptureButton
            backgroundColor={theme.primary}
            borderColor="#FFFFFF"
            onPress={takePicture}
            disabled={isLoading}
          >
            <ButtonText>📸</ButtonText>
          </CaptureButton>

          <ControlButton
            backgroundColor={theme.surface}
            onPress={toggleFlash}
          >
            <ButtonText>
              {flashMode === 'off' ? '🔦' : '💡'}
            </ButtonText>
          </ControlButton>
        </ControlsContainer>

        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 50,
            left: 20,
            padding: 10,
            backgroundColor: theme.glassBackground,
            borderRadius: 20,
          }}
          onPress={handleClose}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 50,
            right: 20,
            padding: 10,
            backgroundColor: theme.glassBackground,
            borderRadius: 20,
          }}
          onPress={handleHelp}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>❓</Text>
        </TouchableOpacity>
      </CameraContainer>

      {isLoading && (
        <LoadingOverlay backgroundColor="rgba(0,0,0,0.8)">
          <ButtonText>🔄</ButtonText>
          <LoadingText color="#FFFFFF">
            Analyzing your {preferences.scanType}...
          </LoadingText>
        </LoadingOverlay>
      )}
    </Container>
  );
}; 