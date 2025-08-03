/**
 * Device Authentication Middleware
 * Extracts device_id from request headers and validates it
 * Sets req.deviceId and req.scanType for downstream use
 */

const authDevice = (req, res, next) => {
  try {
    // Extract device ID from headers
    const deviceId = req.headers['x-device-id'] || req.headers['device-id'];
    
    if (!deviceId) {
      return res.status(401).json({
        error: 'Device ID is required',
        message: 'Please provide a valid device ID in the x-device-id header'
      });
    }

    // Validate device ID format (should be UUID or similar)
    const deviceIdRegex = /^[a-zA-Z0-9\-_]{10,50}$/;
    if (!deviceIdRegex.test(deviceId)) {
      return res.status(400).json({
        error: 'Invalid device ID format',
        message: 'Device ID must be alphanumeric with dashes/underscores, 10-50 characters'
      });
    }

    // Extract scan type (default to 'coin' as per rules)
    const scanType = req.headers['x-scan-type'] || req.headers['scan-type'] || process.env.SCAN_TYPE || 'coin';
    
    // Validate scan type
    const allowedScanTypes = ['coin', 'card', 'bird', 'stamp', 'art', 'jewelry'];
    if (!allowedScanTypes.includes(scanType.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid scan type',
        message: `Scan type must be one of: ${allowedScanTypes.join(', ')}`
      });
    }

    // Set device context for downstream middleware and routes
    req.deviceId = deviceId;
    req.scanType = scanType.toLowerCase();
    
    // Log for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 Device authenticated: ${deviceId} (${scanType})`);
    }

    next();
  } catch (error) {
    console.error('Auth device middleware error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'Failed to authenticate device'
    });
  }
};

module.exports = authDevice; 