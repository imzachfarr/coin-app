const crypto = require('crypto');
const { settingsService } = require('../services/supabaseService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Verify RevenueCat webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - X-REVENUECAT-SIGNATURE header
 * @returns {boolean} Whether signature is valid
 */
function verifyWebhookSignature(payload, signature) {
  if (!process.env.REVENUECAT_WEBHOOK_SECRET) {
    console.warn('⚠️ REVENUECAT_WEBHOOK_SECRET not set - skipping signature verification');
    return true; // Skip verification in development
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.REVENUECAT_WEBHOOK_SECRET)
      .update(payload, 'utf8')
      .digest('hex');
    
    const receivedSignature = signature?.replace('sha256=', '') || '';
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );
  } catch (error) {
    console.error('❌ Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Handle RevenueCat webhook events
 * POST /api/purchase/webhook
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-revenuecat-signature'];
  const rawBody = JSON.stringify(req.body);

  console.log('📥 Received RevenueCat webhook');

  // Verify webhook signature
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('❌ Invalid webhook signature');
    return res.status(401).json({
      error: 'Invalid signature',
      message: 'Webhook signature verification failed'
    });
  }

  const { event } = req.body;

  if (!event) {
    return res.status(400).json({
      error: 'Invalid webhook payload',
      message: 'Missing event data'
    });
  }

  try {
    await processWebhookEvent(event);
    
    console.log('✅ Webhook processed successfully');
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    throw error;
  }
});

/**
 * Process different RevenueCat webhook events
 * @param {Object} event - RevenueCat event data
 */
async function processWebhookEvent(event) {
  const { type, app_user_id, product_id, purchased_at, expiration_at } = event;
  
  console.log(`🎯 Processing ${type} event for user: ${app_user_id}`);

  // app_user_id should be the device_id in our system
  const deviceId = app_user_id;
  
  if (!deviceId) {
    throw new Error('Missing device ID in webhook event');
  }

  switch (type) {
    case 'INITIAL_PURCHASE':
      await handleInitialPurchase(deviceId, product_id, purchased_at, expiration_at);
      break;
      
    case 'RENEWAL':
      await handleRenewal(deviceId, product_id, purchased_at, expiration_at);
      break;
      
    case 'CANCELLATION':
      await handleCancellation(deviceId, product_id);
      break;
      
    case 'EXPIRATION':
      await handleExpiration(deviceId, product_id);
      break;
      
    case 'BILLING_ISSUE':
      await handleBillingIssue(deviceId, product_id);
      break;
      
    case 'PRODUCT_CHANGE':
      await handleProductChange(deviceId, product_id, purchased_at, expiration_at);
      break;

    case 'TRIAL_STARTED':
      await handleTrialStarted(deviceId, product_id, expiration_at);
      break;

    case 'TRIAL_CANCELLED':
      await handleTrialCancelled(deviceId, product_id);
      break;
      
    default:
      console.log(`ℹ️ Unhandled event type: ${type}`);
  }
}

/**
 * Handle initial purchase event
 */
async function handleInitialPurchase(deviceId, productId, purchasedAt, expirationAt) {
  console.log(`💳 Initial purchase: ${productId} for device: ${deviceId}`);
  
  try {
    // Update premium status
    await settingsService.update(deviceId, {
      premium_unlocked: true,
      subscription_product_id: productId,
      subscription_purchased_at: purchasedAt,
      subscription_expires_at: expirationAt,
      subscription_status: 'active'
    });
    
    console.log('✅ Premium status activated');
  } catch (error) {
    console.error('❌ Failed to activate premium status:', error);
    throw error;
  }
}

/**
 * Handle subscription renewal
 */
async function handleRenewal(deviceId, productId, purchasedAt, expirationAt) {
  console.log(`🔄 Subscription renewal: ${productId} for device: ${deviceId}`);
  
  try {
    await settingsService.update(deviceId, {
      premium_unlocked: true,
      subscription_renewed_at: purchasedAt,
      subscription_expires_at: expirationAt,
      subscription_status: 'active'
    });
    
    console.log('✅ Subscription renewed');
  } catch (error) {
    console.error('❌ Failed to process renewal:', error);
    throw error;
  }
}

/**
 * Handle subscription cancellation
 */
async function handleCancellation(deviceId, productId) {
  console.log(`❌ Subscription cancelled: ${productId} for device: ${deviceId}`);
  
  try {
    // Note: Don't immediately revoke premium - let it expire naturally
    await settingsService.update(deviceId, {
      subscription_status: 'cancelled',
      subscription_cancelled_at: new Date().toISOString()
    });
    
    console.log('✅ Cancellation recorded');
  } catch (error) {
    console.error('❌ Failed to process cancellation:', error);
    throw error;
  }
}

/**
 * Handle subscription expiration
 */
async function handleExpiration(deviceId, productId) {
  console.log(`⏰ Subscription expired: ${productId} for device: ${deviceId}`);
  
  try {
    await settingsService.update(deviceId, {
      premium_unlocked: false,
      subscription_status: 'expired',
      subscription_expired_at: new Date().toISOString()
    });
    
    console.log('✅ Premium status revoked');
  } catch (error) {
    console.error('❌ Failed to process expiration:', error);
    throw error;
  }
}

/**
 * Handle billing issues
 */
async function handleBillingIssue(deviceId, productId) {
  console.log(`💳 Billing issue: ${productId} for device: ${deviceId}`);
  
  try {
    await settingsService.update(deviceId, {
      subscription_status: 'billing_issue',
      billing_issue_detected_at: new Date().toISOString()
    });
    
    console.log('✅ Billing issue recorded');
  } catch (error) {
    console.error('❌ Failed to process billing issue:', error);
    throw error;
  }
}

/**
 * Handle product changes (upgrade/downgrade)
 */
async function handleProductChange(deviceId, newProductId, purchasedAt, expirationAt) {
  console.log(`🔄 Product change to: ${newProductId} for device: ${deviceId}`);
  
  try {
    await settingsService.update(deviceId, {
      premium_unlocked: true,
      subscription_product_id: newProductId,
      subscription_changed_at: purchasedAt,
      subscription_expires_at: expirationAt,
      subscription_status: 'active'
    });
    
    console.log('✅ Product change processed');
  } catch (error) {
    console.error('❌ Failed to process product change:', error);
    throw error;
  }
}

/**
 * Handle trial started
 */
async function handleTrialStarted(deviceId, productId, expirationAt) {
  console.log(`🆓 Trial started: ${productId} for device: ${deviceId}`);
  
  try {
    await settingsService.update(deviceId, {
      premium_unlocked: true,
      subscription_product_id: productId,
      subscription_status: 'trial',
      trial_started_at: new Date().toISOString(),
      subscription_expires_at: expirationAt
    });
    
    console.log('✅ Trial activated');
  } catch (error) {
    console.error('❌ Failed to activate trial:', error);
    throw error;
  }
}

/**
 * Handle trial cancellation
 */
async function handleTrialCancelled(deviceId, productId) {
  console.log(`❌ Trial cancelled: ${productId} for device: ${deviceId}`);
  
  try {
    await settingsService.update(deviceId, {
      premium_unlocked: false,
      subscription_status: 'trial_cancelled',
      trial_cancelled_at: new Date().toISOString()
    });
    
    console.log('✅ Trial cancelled');
  } catch (error) {
    console.error('❌ Failed to process trial cancellation:', error);
    throw error;
  }
}

/**
 * Manually restore purchases for a device
 * POST /api/purchase/restore
 */
const restorePurchase = asyncHandler(async (req, res) => {
  const { deviceId } = req;
  const { receipt_data, product_ids } = req.body;

  console.log(`🔄 Restoring purchases for device: ${deviceId}`);

  if (!receipt_data && !product_ids) {
    return res.status(400).json({
      error: 'Invalid restore request',
      message: 'Please provide receipt_data or product_ids'
    });
  }

  try {
    // In a real implementation, you would verify the receipt with RevenueCat
    // For now, we'll just check if the device has any subscription history
    
    const settings = await settingsService.get(deviceId);
    
    if (settings?.subscription_product_id && settings?.subscription_status !== 'expired') {
      // Restore premium if subscription is still valid
      await settingsService.update(deviceId, {
        premium_unlocked: true,
        subscription_restored_at: new Date().toISOString()
      });
      
      res.json({
        success: true,
        premium_unlocked: true,
        message: 'Premium subscription restored successfully'
      });
    } else {
      res.json({
        success: true,
        premium_unlocked: false,
        message: 'No active subscription found to restore'
      });
    }

  } catch (error) {
    console.error('❌ Purchase restore error:', error);
    throw error;
  }
});

/**
 * Get current subscription status
 * GET /api/purchase/status
 */
const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const { deviceId } = req;

  console.log(`📊 Getting subscription status for device: ${deviceId}`);

  try {
    const settings = await settingsService.get(deviceId);
    
    const subscriptionInfo = {
      premium_unlocked: settings?.premium_unlocked || false,
      subscription_status: settings?.subscription_status || 'none',
      subscription_product_id: settings?.subscription_product_id || null,
      subscription_expires_at: settings?.subscription_expires_at || null,
      trial_available: !settings?.trial_started_at, // Trial only available if never started
      days_remaining: null
    };

    // Calculate days remaining if subscription exists
    if (settings?.subscription_expires_at) {
      const expirationDate = new Date(settings.subscription_expires_at);
      const now = new Date();
      const diffTime = expirationDate - now;
      subscriptionInfo.days_remaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    res.json({
      success: true,
      subscription: subscriptionInfo
    });

  } catch (error) {
    console.error('❌ Error getting subscription status:', error);
    throw error;
  }
});

module.exports = {
  handleWebhook,
  restorePurchase,
  getSubscriptionStatus,
  verifyWebhookSignature
}; 