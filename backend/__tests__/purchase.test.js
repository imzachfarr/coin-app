const request = require('supertest');
const express = require('express');
const crypto = require('crypto');
const purchaseRoutes = require('../src/routes/purchaseRoutes');

// Mock the services
jest.mock('../src/services/supabaseService');
jest.mock('../src/middleware/authDevice');

const { settingsService } = require('../src/services/supabaseService');
const authDevice = require('../src/middleware/authDevice');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/purchase', purchaseRoutes);

// Mock middleware
authDevice.mockImplementation((req, res, next) => {
  req.deviceId = 'test-device-123';
  next();
});

// Mock environment variables
process.env.REVENUECAT_WEBHOOK_SECRET = 'test-webhook-secret';

describe('Purchase API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/purchase/webhook', () => {
    const createWebhookSignature = (payload) => {
      return crypto
        .createHmac('sha256', process.env.REVENUECAT_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
    };

    it('should handle INITIAL_PURCHASE webhook', async () => {
      const webhookPayload = {
        event: {
          type: 'INITIAL_PURCHASE',
          app_user_id: 'test-device-123',
          product_id: 'monthly_2_99',
          purchased_at: '2024-01-01T00:00:00.000Z',
          expiration_at: '2024-02-01T00:00:00.000Z'
        }
      };

      const payload = JSON.stringify(webhookPayload);
      const signature = `sha256=${createWebhookSignature(payload)}`;

      settingsService.update.mockResolvedValue({
        device_id: 'test-device-123',
        premium_unlocked: true
      });

      const response = await request(app)
        .post('/api/purchase/webhook')
        .set('x-revenuecat-signature', signature)
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
      expect(settingsService.update).toHaveBeenCalledWith(
        'test-device-123',
        expect.objectContaining({
          premium_unlocked: true,
          subscription_product_id: 'monthly_2_99'
        })
      );
    });

    it('should handle EXPIRATION webhook', async () => {
      const webhookPayload = {
        event: {
          type: 'EXPIRATION',
          app_user_id: 'test-device-123',
          product_id: 'monthly_2_99'
        }
      };

      const payload = JSON.stringify(webhookPayload);
      const signature = `sha256=${createWebhookSignature(payload)}`;

      settingsService.update.mockResolvedValue({
        device_id: 'test-device-123',
        premium_unlocked: false
      });

      const response = await request(app)
        .post('/api/purchase/webhook')
        .set('x-revenuecat-signature', signature)
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(settingsService.update).toHaveBeenCalledWith(
        'test-device-123',
        expect.objectContaining({
          premium_unlocked: false,
          subscription_status: 'expired'
        })
      );
    });

    it('should reject webhook with invalid signature', async () => {
      const webhookPayload = {
        event: {
          type: 'INITIAL_PURCHASE',
          app_user_id: 'test-device-123',
          product_id: 'monthly_2_99'
        }
      };

      const response = await request(app)
        .post('/api/purchase/webhook')
        .set('x-revenuecat-signature', 'invalid-signature')
        .send(webhookPayload);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid signature');
    });

    it('should handle missing event data', async () => {
      const webhookPayload = {};
      const payload = JSON.stringify(webhookPayload);
      const signature = `sha256=${createWebhookSignature(payload)}`;

      const response = await request(app)
        .post('/api/purchase/webhook')
        .set('x-revenuecat-signature', signature)
        .send(webhookPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid webhook payload');
    });
  });

  describe('POST /api/purchase/restore', () => {
    it('should restore active subscription', async () => {
      settingsService.get.mockResolvedValue({
        device_id: 'test-device-123',
        subscription_product_id: 'monthly_2_99',
        subscription_status: 'active'
      });

      settingsService.update.mockResolvedValue({
        device_id: 'test-device-123',
        premium_unlocked: true
      });

      const response = await request(app)
        .post('/api/purchase/restore')
        .send({
          product_ids: ['monthly_2_99']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.premium_unlocked).toBe(true);
    });

    it('should handle no active subscription', async () => {
      settingsService.get.mockResolvedValue({
        device_id: 'test-device-123',
        subscription_status: 'expired'
      });

      const response = await request(app)
        .post('/api/purchase/restore')
        .send({
          product_ids: ['monthly_2_99']
        });

      expect(response.status).toBe(200);
      expect(response.body.premium_unlocked).toBe(false);
      expect(response.body.message).toContain('No active subscription');
    });

    it('should require receipt data or product IDs', async () => {
      const response = await request(app)
        .post('/api/purchase/restore')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid restore request');
    });
  });

  describe('GET /api/purchase/status', () => {
    it('should return subscription status', async () => {
      const mockSettings = {
        device_id: 'test-device-123',
        premium_unlocked: true,
        subscription_status: 'active',
        subscription_product_id: 'monthly_2_99',
        subscription_expires_at: '2024-02-01T00:00:00.000Z',
        trial_started_at: null
      };

      settingsService.get.mockResolvedValue(mockSettings);

      const response = await request(app)
        .get('/api/purchase/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.subscription.premium_unlocked).toBe(true);
      expect(response.body.subscription.trial_available).toBe(true);
    });

    it('should calculate days remaining', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const mockSettings = {
        device_id: 'test-device-123',
        premium_unlocked: true,
        subscription_expires_at: futureDate.toISOString()
      };

      settingsService.get.mockResolvedValue(mockSettings);

      const response = await request(app)
        .get('/api/purchase/status');

      expect(response.status).toBe(200);
      expect(response.body.subscription.days_remaining).toBeGreaterThan(10);
    });
  });

  describe('GET /api/purchase/products', () => {
    it('should return available products', async () => {
      const response = await request(app)
        .get('/api/purchase/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(3);
      expect(response.body.products[0].id).toBe('free_trial_7_day');
      expect(response.body.products[1].id).toBe('monthly_2_99');
      expect(response.body.products[2].id).toBe('yearly_39_99');
    });
  });

  describe('GET /api/purchase/benefits', () => {
    it('should return benefits comparison', async () => {
      const response = await request(app)
        .get('/api/purchase/benefits');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.benefits.free).toBeDefined();
      expect(response.body.benefits.premium).toBeDefined();
      expect(response.body.upgradeReasons).toBeInstanceOf(Array);
    });
  });
}); 