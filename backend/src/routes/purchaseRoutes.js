const express = require('express');
const router = express.Router();

// Import middleware
const authDevice = require('../middleware/authDevice');

// Import controllers
const {
  handleWebhook,
  restorePurchase,
  getSubscriptionStatus
} = require('../controllers/purchaseController');

/**
 * Purchase Routes
 * Handle RevenueCat webhooks and subscription management
 */

/**
 * @route   POST /api/purchase/webhook
 * @desc    Handle RevenueCat webhook events
 * @access  Public (webhook endpoint)
 * @headers x-revenuecat-signature: string
 * @body    RevenueCat webhook payload
 */
router.post('/webhook', handleWebhook);

// Apply device authentication to remaining routes
router.use(authDevice);

/**
 * @route   POST /api/purchase/restore
 * @desc    Restore purchases for a device
 * @access  Device authenticated
 * @body    { receipt_data?: string, product_ids?: string[] }
 */
router.post('/restore', restorePurchase);

/**
 * @route   GET /api/purchase/status
 * @desc    Get current subscription status for device
 * @access  Device authenticated
 */
router.get('/status', getSubscriptionStatus);

/**
 * @route   GET /api/purchase/products
 * @desc    Get available subscription products
 * @access  Device authenticated
 */
router.get('/products', (req, res) => {
  // Return available RevenueCat products
  const products = [
    {
      id: 'free_trial_7_day',
      type: 'trial',
      duration: '7 days',
      price: 0,
      currency: 'USD',
      description: '7-day free trial with unlimited scans',
      features: [
        'Unlimited scans',
        'AI-powered analysis',
        'Value estimates',
        'Scan history',
        'Export functionality'
      ]
    },
    {
      id: 'monthly_2_99',
      type: 'subscription',
      duration: 'monthly',
      price: 2.99,
      currency: 'USD',
      description: 'Monthly subscription with unlimited scans',
      features: [
        'Unlimited scans',
        'AI-powered analysis',
        'Value estimates',
        'Scan history',
        'Export functionality',
        'Priority support'
      ]
    },
    {
      id: 'yearly_39_99',
      type: 'subscription',
      duration: 'yearly',
      price: 39.99,
      currency: 'USD',
      description: 'Yearly subscription - Save 86%!',
      savings: '86%',
      monthlyEquivalent: 3.33,
      features: [
        'Unlimited scans',
        'AI-powered analysis',
        'Value estimates',
        'Scan history',
        'Export functionality',
        'Priority support',
        'Advanced analytics',
        'Collection insights'
      ]
    }
  ];

  res.json({
    success: true,
    products,
    freeTrialAvailable: true,
    currency: 'USD'
  });
});

/**
 * @route   GET /api/purchase/benefits
 * @desc    Get premium benefits and feature comparison
 * @access  Device authenticated
 */
router.get('/benefits', (req, res) => {
  const benefits = {
    free: {
      title: 'Free Plan',
      scansPerDay: 5,
      features: [
        'Basic AI analysis',
        'Limited scan history (last 10)',
        'Basic value estimates'
      ],
      limitations: [
        '5 scans per day',
        'Limited support',
        'No export functionality'
      ]
    },
    premium: {
      title: 'Premium Plan',
      scansPerDay: 'Unlimited',
      features: [
        'Advanced AI analysis',
        'Unlimited scan history',
        'Detailed value estimates',
        'Market trend insights',
        'Export to CSV/PDF',
        'Collection analytics',
        'Priority support',
        'Offline sync'
      ],
      limitations: []
    }
  };

  res.json({
    success: true,
    benefits,
    upgradeReasons: [
      'Scan as many items as you want',
      'Get more detailed analysis',
      'Track your collection value over time',
      'Export your data anytime',
      'Get priority customer support'
    ]
  });
});

// Error handling middleware for purchase routes
router.use((error, req, res, next) => {
  console.error('❌ Purchase route error:', error);
  
  // Handle RevenueCat webhook specific errors
  if (error.message?.includes('signature')) {
    return res.status(401).json({
      error: 'Webhook Authentication Failed',
      message: 'Invalid webhook signature'
    });
  }
  
  if (error.message?.includes('webhook')) {
    return res.status(400).json({
      error: 'Webhook Processing Error',
      message: 'Failed to process webhook event'
    });
  }
  
  if (error.message?.includes('subscription')) {
    return res.status(400).json({
      error: 'Subscription Error',
      message: 'There was an issue with your subscription. Please contact support.'
    });
  }
  
  // Pass to global error handler
  next(error);
});

module.exports = router; 