# Database Setup Instructions

## 1. Set up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Run the SQL script

## 2. Verify Tables Created

After running the schema, you should see these tables:
- `public.scans` - Stores scan results
- `public.settings` - Stores device settings
- `public.collections` - Stores user collections

## 3. Test Database Connection

Run this curl command to test if the database is working:

```bash
curl -X GET http://192.168.50.42:4000/api/scan \
  -H "x-device-id: test-device-123" \
  -H "x-scan-type: coin"
```

You should get an empty array `[]` instead of a database error.

## 4. Restart Backend

After setting up the database, restart your backend:

```bash
cd backend
npm start
```

## 5. Test Frontend Connection

Now your frontend should be able to connect to the backend without "Network Error" messages. 