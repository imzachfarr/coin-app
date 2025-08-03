const rateLimit = require('express-rate-limit');
const { supabase } = require('../services/supabaseService');

/**
 * Custom rate limiter that checks premium status
 * Free users: 5 scans per 15 minutes
 * Premium users: 100 scans per 15 minutes
 */

// Store for tracking premium status to avoid repeated DB calls
const premiumStatusCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const checkPremiumStatus = async (deviceId) => {
  try {
    // Check cache first
    const cached = premiumStatusCache.get(deviceId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.isPremium;
    }

    // Query Supabase for premium status
    const { data, error } = await supabase
      .from('settings')
      .select('premium_unlocked')
      .eq('device_id', deviceId)
      .single();

    const isPremium = !error && data?.premium_unlocked === true;
    
    // Cache the result
    premiumStatusCache.set(deviceId, {
      isPremium,
      timestamp: Date.now()
    });

    return isPremium;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false; // Default to free tier on error
  }
};

// Create rate limiter with dynamic limits
const createRateLimiter = () => {
  return rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    keyGenerator: (req) => {
      // Use device ID as the key for rate limiting
      return req.headers['x-device-id'] || req.headers['device-id'] || req.ip;
    },
    max: async (req) => {
      const deviceId = req.headers['x-device-id'] || req.headers['device-id'];
      
      if (!deviceId) {
        return 10; // Very limited for requests without device ID
      }

      const isPremium = await checkPremiumStatus(deviceId);
      
      if (isPremium) {
        return parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
      } else {
        return parseInt(process.env.RATE_LIMIT_FREE_MAX_REQUESTS) || 5;
      }
    },
    message: (req) => {
      const deviceId = req.headers['x-device-id'] || req.headers['device-id'];
      return {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please upgrade to premium for higher limits.',
        deviceId: deviceId || 'unknown',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
      };
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health check
    skip: (req) => req.path === '/health' || req.path === '/',
    // Removed deprecated onLimitReached option
  });
};

// Scan-specific rate limiter (more restrictive)
const scanRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (req) => req.deviceId || req.ip,
  max: async (req) => {
    if (!req.deviceId) return 2;
    
    const isPremium = await checkPremiumStatus(req.deviceId);
    return isPremium ? 50 : 3; // Even more restrictive for actual scans
  },
  message: {
    error: 'Scan limit exceeded',
    message: 'You have exceeded your scan limit. Please upgrade to premium for unlimited scans.',
    upgradeInfo: {
      monthly: '$2.99/month',
      yearly: '$39.99/year',
      trialAvailable: true
    }
  }
});

// Clear cache periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of premiumStatusCache.entries()) {
    if (now - value.timestamp > CACHE_TTL * 2) {
      premiumStatusCache.delete(key);
    }
  }
}, CACHE_TTL);

module.exports = {
  generalRateLimit: createRateLimiter(),
  scanRateLimit: scanRateLimiter,
  checkPremiumStatus
}; 