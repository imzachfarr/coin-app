import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { getOrCreateDeviceId, addToOfflineQueue } from '@/utils/storage';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ScanResult {
  id: string;
  type: string;
  name: string;
  description: string;
  value: number;
  currency: string;
  confidence: number;
  attributes: Record<string, any>;
  imageUrl: string;
  scanDate: string;
}

export interface ScanRequest {
  imageUri: string;
  scanType?: string;
}

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const baseURL = process.env.BACKEND_URL || 'http://localhost:3000';
  
  const client = axios.create({
    baseURL,
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return client;
};

export const apiClient = createApiClient();

// Add device ID to all requests
let deviceId: string | null = null;

const initializeDeviceId = async () => {
  if (!deviceId) {
    deviceId = await getOrCreateDeviceId();
  }
  return deviceId;
};

// Request interceptor to add device ID header
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const id = await initializeDeviceId();
      config.headers['x-device-id'] = id;
      
      // Add auth headers if needed
      if (config.url?.includes('/premium') || config.url?.includes('/restore-purchase')) {
        // Add premium authentication if needed
      }
      
      return config;
    } catch (error) {
      console.error('Error adding device ID to request:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const { config, response } = error;
    
    // Network error handling
    if (!response) {
      const networkState = await NetInfo.fetch();
      
      if (!networkState.isConnected) {
        // Add to offline queue for retry
        if (config.method === 'post' && config.url?.includes('/scan')) {
          await addToOfflineQueue({
            type: 'scan',
            data: config.data,
          });
          
          Alert.alert(
            'Offline',
            'No internet connection. Your scan has been queued and will be processed when you\'re back online.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Network Error',
            'Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please try again later.',
          [{ text: 'OK' }]
        );
      }
      
      return Promise.reject(error);
    }

    // Handle specific HTTP status codes
    switch (response.status) {
      case 400:
        Alert.alert('Invalid Request', response.data?.message || 'Please check your input.');
        break;
      case 401:
        Alert.alert('Unauthorized', 'Please check your device registration.');
        break;
      case 403:
        Alert.alert('Premium Required', 'This feature requires a premium subscription.');
        break;
      case 429:
        Alert.alert('Rate Limited', 'Please wait before making another request.');
        break;
      case 500:
        Alert.alert('Server Error', 'Something went wrong on our end. Please try again.');
        break;
      default:
        if (response.status >= 500) {
          Alert.alert('Server Error', 'Please try again later.');
        }
    }

    return Promise.reject(error);
  }
);

// Retry logic for failed requests
const retryRequest = async (config: AxiosRequestConfig, retries = 3): Promise<any> => {
  try {
    return await apiClient(config);
  } catch (error) {
    if (retries > 0) {
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000));
      return retryRequest(config, retries - 1);
    }
    throw error;
  }
};

// Generic API call wrapper
export const makeApiCall = async <T>(
  config: AxiosRequestConfig,
  enableRetry = true
): Promise<ApiResponse<T>> => {
  try {
    const response = enableRetry 
      ? await retryRequest(config)
      : await apiClient(config);
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('API call failed:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Unknown error',
    };
  }
};

// API endpoint functions
export const scanImage = async (imageUri: string, scanType = 'coin'): Promise<ApiResponse<ScanResult>> => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'scan_image.jpg',
  } as any);
  formData.append('scanType', scanType);

  return makeApiCall<ScanResult>({
    method: 'POST',
    url: '/scan',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // 60 seconds for image processing
  });
};

export const fetchScans = async (limit = 50, offset = 0): Promise<ApiResponse<ScanResult[]>> => {
  return makeApiCall<ScanResult[]>({
    method: 'GET',
    url: '/scans',
    params: { limit, offset },
  });
};

export const fetchScanById = async (id: string): Promise<ApiResponse<ScanResult>> => {
  return makeApiCall<ScanResult>({
    method: 'GET',
    url: `/scans/${id}`,
  });
};

export const restorePurchase = async (): Promise<ApiResponse<{ restored: boolean }>> => {
  return makeApiCall<{ restored: boolean }>({
    method: 'POST',
    url: '/restore-purchase',
  });
};

export const calculateTotalValue = async (currency = 'USD'): Promise<ApiResponse<{ total: number; currency: string }>> => {
  return makeApiCall<{ total: number; currency: string }>({
    method: 'GET',
    url: '/scans/total-value',
    params: { currency },
  });
};

// Health check
export const healthCheck = async (): Promise<ApiResponse<{ status: string; timestamp: string }>> => {
  return makeApiCall<{ status: string; timestamp: string }>({
    method: 'GET',
    url: '/health',
  }, false); // Don't retry health checks
}; 