const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Import middleware
const authDevice = require('../middleware/authDevice');
const { scanRateLimit } = require('../middleware/rateLimiter');

// Import controllers
const {
  handleScan,
  listScans,
  getScanById,
  updateScan,
  deleteScan,
  getStats
} = require('../controllers/scanController');

/**
 * Scan Routes
 * All routes require device authentication
 */

// Apply device authentication to all scan routes
router.use(authDevice);

/**
 * @route   POST /api/scan
 * @desc    Upload and analyze an image
 * @access  Device authenticated
 * @body    { imageUri?: string, imageBase64?: string, fileName?: string } or multipart form data with image file
 * @headers x-device-id: string, x-scan-type?: string
 */
router.post('/', upload.single('image'), handleScan); // Temporarily disabled rate limiting

/**
 * @route   GET /api/scan
 * @desc    Get all scans for authenticated device
 * @access  Device authenticated
 * @query   limit?, offset?, sortBy?, sortOrder?, scanType?, minValue?, maxValue?
 */
router.get('/', listScans);

/**
 * @route   GET /api/scan/stats
 * @desc    Get scan statistics for authenticated device
 * @access  Device authenticated
 */
router.get('/stats', getStats);

/**
 * @route   GET /api/scan/:id
 * @desc    Get a specific scan by ID
 * @access  Device authenticated
 * @params  id: string
 */
router.get('/:id', getScanById);

/**
 * @route   PUT /api/scan/:id
 * @desc    Update scan information (notes, tags, etc.)
 * @access  Device authenticated
 * @params  id: string
 * @body    { notes?: string, tags?: string[], customAttributes?: object }
 */
router.put('/:id', updateScan);

/**
 * @route   DELETE /api/scan/:id
 * @desc    Delete a scan and its associated image
 * @access  Device authenticated
 * @params  id: string
 */
router.delete('/:id', deleteScan);

// Error handling middleware for scan routes
router.use((error, req, res, next) => {
  console.error('❌ Scan route error:', error);
  
  // Handle specific scan-related errors
  if (error.message?.includes('OpenAI')) {
    return res.status(502).json({
      error: 'AI Analysis Failed',
      message: 'Image analysis service is temporarily unavailable. Please try again later.',
      retryable: true
    });
  }
  
  if (error.message?.includes('image')) {
    return res.status(400).json({
      error: 'Image Processing Error',
      message: 'There was an issue processing your image. Please ensure it\'s a valid image file.',
      supportedFormats: ['JPG', 'JPEG', 'PNG', 'WebP']
    });
  }
  
  if (error.message?.includes('storage') || error.message?.includes('upload')) {
    return res.status(507).json({
      error: 'Storage Error',
      message: 'Unable to save your image. Please try again later.',
      retryable: true
    });
  }
  
  // Pass to global error handler
  next(error);
});

module.exports = router; 