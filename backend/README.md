# AI Asset Accelerator Backend API

A powerful Node.js/Express backend API for the AI Asset Accelerator mobile app. This service handles image analysis using OpenAI's GPT-4o Vision API, manages scan data with Supabase, and processes premium subscriptions via RevenueCat webhooks.

## 🚀 Features

- **AI-Powered Image Analysis** - GPT-4o Vision API integration for asset identification
- **Multi-Asset Support** - Coins, trading cards, birds, stamps, art, and jewelry
- **Device-Based Authentication** - No user accounts required
- **Premium Subscriptions** - RevenueCat integration with webhook processing
- **Rate Limiting** - Different limits for free and premium users
- **Image Storage** - Supabase Storage with automatic optimization
- **Comprehensive API** - RESTful endpoints with full CRUD operations
- **Docker Support** - Production-ready containerization
- **Test Coverage** - Comprehensive test suite with Jest

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase project
- OpenAI API key
- RevenueCat account (for subscriptions)

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd backend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your actual configuration values
```

### 3. Required Environment Variables

```env
# Essential Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=sk-your_openai_api_key
REVENUECAT_WEBHOOK_SECRET=your_webhook_secret
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:4000`

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── scanController.js
│   │   └── purchaseController.js
│   ├── middleware/           # Express middleware
│   │   ├── authDevice.js
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   ├── routes/              # API route definitions
│   │   ├── scanRoutes.js
│   │   └── purchaseRoutes.js
│   ├── services/            # Business logic
│   │   ├── supabaseService.js
│   │   └── openaiService.js
│   └── utils/               # Utilities
│       └── jsonSchema.js
├── __tests__/               # Test files
├── Dockerfile               # Container configuration
├── docker-compose.yml       # Multi-service setup
└── package.json
```

## 🔌 API Endpoints

### Health Check
```
GET /health
```

### Scan Operations
```
POST   /api/scan              # Upload and analyze image
GET    /api/scan              # List all scans
GET    /api/scan/stats        # Get scan statistics
GET    /api/scan/:id          # Get specific scan
PUT    /api/scan/:id          # Update scan
DELETE /api/scan/:id          # Delete scan
```

### Purchase Management
```
POST /api/purchase/webhook    # RevenueCat webhook
POST /api/purchase/restore    # Restore purchases
GET  /api/purchase/status     # Subscription status
GET  /api/purchase/products   # Available products
GET  /api/purchase/benefits   # Feature comparison
```

## 📝 API Usage Examples

### Scan an Image (Base64)

```bash
curl -X POST http://localhost:4000/api/scan \
  -H "Content-Type: application/json" \
  -H "x-device-id: your-device-id" \
  -H "x-scan-type: coin" \
  -d '{
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "fileName": "coin.jpg"
  }'
```

### Scan an Image (URL)

```bash
curl -X POST http://localhost:4000/api/scan \
  -H "Content-Type: application/json" \
  -H "x-device-id: your-device-id" \
  -H "x-scan-type: coin" \
  -d '{
    "imageUri": "https://example.com/coin-image.jpg"
  }'
```

### Get Scan Results

```bash
curl -X GET http://localhost:4000/api/scan \
  -H "x-device-id: your-device-id"
```

### Check Subscription Status

```bash
curl -X GET http://localhost:4000/api/purchase/status \
  -H "x-device-id: your-device-id"
```

## 🛠️ Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

### Docker Development

```bash
# Build and run with Docker Compose
npm run docker:run

# Stop services
npm run docker:down
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking (if using TypeScript)
npm run type-check
```

## 🚀 Deployment

### Railway Deployment

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Docker Deployment

```bash
# Build production image
npm run docker:build

# Run production container
docker run -p 4000:4000 --env-file .env ai-asset-accelerator-backend
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=4000
SUPABASE_URL=your_production_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_production_key
OPENAI_API_KEY=your_production_openai_key
REVENUECAT_WEBHOOK_SECRET=your_production_webhook_secret
```

## 📊 Supabase Database Schema

### Tables Required

```sql
-- Scans table
CREATE TABLE scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_path TEXT,
  scan_type TEXT NOT NULL,
  raw_json JSONB NOT NULL,
  parsed_attributes JSONB NOT NULL,
  value_estimate DECIMAL(10,2),
  confidence_score DECIMAL(3,2),
  analysis_model TEXT,
  analysis_version TEXT,
  notes TEXT,
  tags TEXT[],
  custom_attributes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  premium_unlocked BOOLEAN DEFAULT FALSE,
  subscription_status TEXT,
  subscription_product_id TEXT,
  subscription_purchased_at TIMESTAMP WITH TIME ZONE,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  currency TEXT DEFAULT 'USD',
  theme TEXT DEFAULT 'system',
  haptics_enabled BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collections table (optional)
CREATE TABLE collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  scan_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can only access their own scans" ON scans
  FOR ALL USING (device_id = current_setting('request.jwt.claims')::json->>'device_id');

CREATE POLICY "Users can only access their own settings" ON settings
  FOR ALL USING (device_id = current_setting('request.jwt.claims')::json->>'device_id');
```

### Storage Bucket

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('scans_bucket', 'scans_bucket', true);

-- Storage policies
CREATE POLICY "Users can upload their own images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'scans_bucket' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own images" ON storage.objects
  FOR SELECT USING (bucket_id = 'scans_bucket' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 🔧 Configuration

### Supported Scan Types

- `coin` - Numismatic analysis
- `card` - Trading card evaluation  
- `bird` - Ornithological identification
- `stamp` - Philatelic assessment
- `art` - Artwork appraisal
- `jewelry` - Jewelry evaluation

### Rate Limiting

- **Free Users**: 5 scans per 15 minutes
- **Premium Users**: 100 scans per 15 minutes
- **Premium Detection**: Automatic via Supabase settings

### Image Processing

- **Max Size**: 10MB
- **Formats**: JPG, JPEG, PNG, WebP
- **Optimization**: Automatic resizing to 1024x1024
- **Storage**: Supabase Storage with CDN

## 🐛 Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   - Check API key is valid
   - Verify rate limits not exceeded
   - Ensure image URL is accessible

2. **Supabase Connection Issues**
   - Verify URL and keys are correct
   - Check RLS policies are set up
   - Ensure service role key has proper permissions

3. **RevenueCat Webhook Issues**
   - Verify webhook secret matches
   - Check endpoint is publicly accessible
   - Review webhook logs in RevenueCat dashboard

### Debug Mode

```bash
NODE_ENV=development DEBUG_MODE=true npm run dev
```

### Logs

Check application logs for detailed error information:

```bash
# View real-time logs
tail -f logs/app.log

# Search for errors
grep "ERROR" logs/app.log
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4o Vision API
- Supabase for backend infrastructure
- RevenueCat for subscription management
- Express.js community

## 📞 Support

For support, email support@aiassetaccelerator.com or create an issue in the repository.

---

**Made with ❤️ by the AI Asset Accelerator Team** 