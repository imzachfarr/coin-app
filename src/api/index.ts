// Re-export all API functions for easy importing
export {
  // API Client
  apiClient,
  makeApiCall,
  
  // Scan Functions
  scanImage,
  fetchScans,
  fetchScanById,
  calculateTotalValue,
  
  // Purchase Functions
  restorePurchase,
  
  // Health Check
  healthCheck,
  
  // Types
  type ApiResponse,
  type ScanResult,
  type ScanRequest,
} from './client'; 