import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  DEVICE_ID: '@device_id',
  PREMIUM_UNLOCKED: '@premium_unlocked',
  HAPTICS_ENABLED: '@haptics_enabled',
  HAS_SEEN_ONBOARDING: '@has_seen_onboarding',
  THEME_MODE: '@theme_mode',
  CURRENCY: '@currency',
  SCAN_CACHE: '@scan_cache',
  OFFLINE_QUEUE: '@offline_queue',
} as const;

// Generic storage functions
export const storeData = async (key: string, value: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('Error storing data:', error);
    throw error;
  }
};

export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error getting data:', error);
    return null;
  }
};

export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing data:', error);
    throw error;
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};

// Device ID utilities
export const generateDeviceId = (): string => {
  return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await getData<string>(STORAGE_KEYS.DEVICE_ID);
    
    if (!deviceId) {
      deviceId = generateDeviceId();
      await storeData(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting or creating device ID:', error);
    // Fallback to generating a new ID if storage fails
    return generateDeviceId();
  }
};

// Preferences utilities
export const getPreference = async <T>(key: string, defaultValue: T): Promise<T> => {
  const value = await getData<T>(key);
  return value !== null ? value : defaultValue;
};

export const setPreference = async (key: string, value: any): Promise<void> => {
  await storeData(key, value);
};

// Cache utilities
export const getCachedData = async <T>(key: string): Promise<T | null> => {
  return await getData<T>(`${STORAGE_KEYS.SCAN_CACHE}_${key}`);
};

export const setCachedData = async (key: string, data: any, ttl?: number): Promise<void> => {
  const cacheEntry = {
    data,
    timestamp: Date.now(),
    ttl: ttl || 3600000, // Default 1 hour TTL
  };
  await storeData(`${STORAGE_KEYS.SCAN_CACHE}_${key}`, cacheEntry);
};

export const isCacheExpired = (cacheEntry: { timestamp: number; ttl: number }): boolean => {
  return Date.now() - cacheEntry.timestamp > cacheEntry.ttl;
};

// Offline queue utilities
export interface QueuedAction {
  id: string;
  type: 'scan' | 'restore_purchase';
  data: any;
  timestamp: number;
  retryCount: number;
}

export const addToOfflineQueue = async (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> => {
  const queue = await getData<QueuedAction[]>(STORAGE_KEYS.OFFLINE_QUEUE) || [];
  const newAction: QueuedAction = {
    ...action,
    id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    retryCount: 0,
  };
  
  queue.push(newAction);
  await storeData(STORAGE_KEYS.OFFLINE_QUEUE, queue);
};

export const getOfflineQueue = async (): Promise<QueuedAction[]> => {
  return await getData<QueuedAction[]>(STORAGE_KEYS.OFFLINE_QUEUE) || [];
};

export const removeFromOfflineQueue = async (actionId: string): Promise<void> => {
  const queue = await getData<QueuedAction[]>(STORAGE_KEYS.OFFLINE_QUEUE) || [];
  const filteredQueue = queue.filter(action => action.id !== actionId);
  await storeData(STORAGE_KEYS.OFFLINE_QUEUE, filteredQueue);
};

export const clearOfflineQueue = async (): Promise<void> => {
  await removeData(STORAGE_KEYS.OFFLINE_QUEUE);
}; 