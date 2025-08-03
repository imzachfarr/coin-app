const request = require('supertest');
const express = require('express');
const scanRoutes = require('../src/routes/scanRoutes');

// Mock the services
jest.mock('../src/services/supabaseService');
jest.mock('../src/services/openaiService');
jest.mock('../src/middleware/authDevice');
jest.mock('../src/middleware/rateLimiter');

const { scansService } = require('../src/services/supabaseService');
const { analyzeImage } = require('../src/services/openaiService');
const authDevice = require('../src/middleware/authDevice');
const { scanRateLimit } = require('../src/middleware/rateLimiter');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/scan', scanRoutes);

// Mock middleware
authDevice.mockImplementation((req, res, next) => {
  req.deviceId = 'test-device-123';
  req.scanType = 'coin';
  next();
});

scanRateLimit.mockImplementation((req, res, next) => next());

describe('Scan API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/scan', () => {
    const mockAnalysis = {
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
    };

    const mockSavedScan = {
      id: 'scan-123',
      device_id: 'test-device-123',
      image_url: 'https://example.com/image.jpg',
      scan_type: 'coin',
      value_estimate: 25.50,
      confidence_score: 0.85,
      created_at: '2024-01-01T00:00:00.000Z'
    };

    it('should successfully analyze an image via base64', async () => {
      analyzeImage.mockResolvedValue(mockAnalysis);
      scansService.create.mockResolvedValue(mockSavedScan);

      const response = await request(app)
        .post('/api/scan')
        .send({
          imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2w==',
          fileName: 'test-coin.jpg'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.scan).toEqual(mockSavedScan);
      expect(response.body.analysis).toEqual(mockAnalysis);
    });

    it('should successfully analyze an image via URL', async () => {
      analyzeImage.mockResolvedValue(mockAnalysis);
      scansService.create.mockResolvedValue(mockSavedScan);

      const response = await request(app)
        .post('/api/scan')
        .send({
          imageUri: 'https://example.com/coin-image.jpg'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 if no image data provided', async () => {
      const response = await request(app)
        .post('/api/scan')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Image data required');
    });

    it('should handle OpenAI analysis errors', async () => {
      analyzeImage.mockRejectedValue(new Error('OpenAI API error'));

      const response = await request(app)
        .post('/api/scan')
        .send({
          imageUri: 'https://example.com/coin-image.jpg'
        });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/scan', () => {
    const mockScans = [
      {
        id: 'scan-1',
        device_id: 'test-device-123',
        scan_type: 'coin',
        value_estimate: 25.50,
        created_at: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'scan-2',
        device_id: 'test-device-123',
        scan_type: 'coin',
        value_estimate: 15.25,
        created_at: '2024-01-02T00:00:00.000Z'
      }
    ];

    it('should return all scans for a device', async () => {
      scansService.getAll.mockResolvedValue(mockScans);

      const response = await request(app)
        .get('/api/scan');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.scans).toEqual(mockScans);
      expect(response.body.summary.totalScans).toBe(2);
      expect(response.body.summary.totalValue).toBe(40.75);
    });

    it('should handle pagination parameters', async () => {
      scansService.getAll.mockResolvedValue(mockScans.slice(0, 1));

      const response = await request(app)
        .get('/api/scan')
        .query({ limit: 1, offset: 0 });

      expect(response.status).toBe(200);
      expect(scansService.getAll).toHaveBeenCalledWith('test-device-123', 1, 0);
    });

    it('should handle filter parameters', async () => {
      const filteredScans = mockScans.filter(scan => scan.value_estimate >= 20);
      scansService.getAll.mockResolvedValue(mockScans);

      const response = await request(app)
        .get('/api/scan')
        .query({ minValue: 20 });

      expect(response.status).toBe(200);
      expect(response.body.scans).toHaveLength(1);
    });
  });

  describe('GET /api/scan/:id', () => {
    const mockScan = {
      id: 'scan-123',
      device_id: 'test-device-123',
      scan_type: 'coin',
      value_estimate: 25.50,
      created_at: '2024-01-01T00:00:00.000Z'
    };

    it('should return a specific scan', async () => {
      scansService.getById.mockResolvedValue(mockScan);

      const response = await request(app)
        .get('/api/scan/scan-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.scan).toEqual(mockScan);
    });

    it('should return 404 if scan not found', async () => {
      scansService.getById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/scan/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Scan not found');
    });
  });

  describe('PUT /api/scan/:id', () => {
    const mockUpdatedScan = {
      id: 'scan-123',
      device_id: 'test-device-123',
      notes: 'Updated notes',
      tags: ['rare', 'valuable']
    };

    it('should update scan information', async () => {
      scansService.update.mockResolvedValue(mockUpdatedScan);

      const response = await request(app)
        .put('/api/scan/scan-123')
        .send({
          notes: 'Updated notes',
          tags: ['rare', 'valuable']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.scan).toEqual(mockUpdatedScan);
    });
  });

  describe('DELETE /api/scan/:id', () => {
    const mockScan = {
      id: 'scan-123',
      device_id: 'test-device-123',
      image_path: 'device-123/image.jpg'
    };

    it('should delete a scan', async () => {
      scansService.getById.mockResolvedValue(mockScan);
      scansService.delete.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/scan/scan-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Scan deleted successfully');
    });

    it('should return 404 if scan not found', async () => {
      scansService.getById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/scan/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Scan not found');
    });
  });

  describe('GET /api/scan/stats', () => {
    const mockScans = [
      { id: '1', scan_type: 'coin', value_estimate: 10 },
      { id: '2', scan_type: 'coin', value_estimate: 50 },
      { id: '3', scan_type: 'card', value_estimate: 100 }
    ];

    it('should return scan statistics', async () => {
      scansService.getAll.mockResolvedValue(mockScans);

      const response = await request(app)
        .get('/api/scan/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats.totalScans).toBe(3);
      expect(response.body.stats.totalValue).toBe(160);
      expect(response.body.stats.averageValue).toBe(160/3);
      expect(response.body.stats.scanTypes.coin).toBe(2);
      expect(response.body.stats.scanTypes.card).toBe(1);
    });
  });
}); 