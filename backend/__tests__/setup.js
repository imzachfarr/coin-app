// Jest setup file for AI Asset Accelerator Backend tests

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.REVENUECAT_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.SCAN_TYPE = 'coin';

// Global test setup
beforeAll(async () => {
  // Setup code that runs before all tests
  console.log('🧪 Setting up tests...');
});

afterAll(async () => {
  // Cleanup code that runs after all tests
  console.log('🧹 Cleaning up tests...');
});

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeEach(() => {
  // Reset console mocks before each test
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterEach(() => {
  // Restore console methods after each test
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

// Global test utilities
global.testUtils = {
  // Mock device ID for tests
  mockDeviceId: 'test-device-123',
  
  // Mock scan data
  mockScanData: {
    id: 'scan-123',
    device_id: 'test-device-123',
    image_url: 'https://example.com/image.jpg',
    scan_type: 'coin',
    value_estimate: 25.50,
    confidence_score: 0.85,
    created_at: '2024-01-01T00:00:00.000Z'
  },
  
  // Mock analysis result
  mockAnalysis: {
    valueEstimate: 25.50,
    confidence: 0.85,
    attributes: {
      country: 'United States',
      denomination: 'Quarter',
      year: '2020',
      condition: 'Fine'
    },
    scanType: 'coin',
    analyzedAt: '2024-01-01T00:00:00.000Z',
    model: 'gpt-4o'
  },
  
  // Mock settings data
  mockSettings: {
    device_id: 'test-device-123',
    premium_unlocked: false,
    subscription_status: 'none',
    currency: 'USD',
    theme: 'system',
    haptics_enabled: true,
    notifications_enabled: true
  },
  
  // Helper to create mock Express request
  createMockRequest: (overrides = {}) => ({
    headers: {},
    body: {},
    params: {},
    query: {},
    deviceId: 'test-device-123',
    scanType: 'coin',
    ...overrides
  }),
  
  // Helper to create mock Express response
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
  },
  
  // Helper to create mock Express next function
  createMockNext: () => jest.fn(),
  
  // Helper to wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to generate random strings
  randomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
};

// Increase timeout for async tests
jest.setTimeout(30000);

// Suppress specific console warnings during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' && 
    args[0].includes('Warning: ReactDOM.render is deprecated')
  ) {
    return;
  }
  originalWarn.call(console, ...args);
}; 