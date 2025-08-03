const fs = require('fs');
const path = require('path');

console.log('🚀 Database Migration Helper');
console.log('============================');
console.log('');
console.log('The database needs some additional columns. Please follow these steps:');
console.log('');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the following SQL commands:');
console.log('');
console.log('--- START SQL ---');

// Read and display the migration SQL
const migrationPath = path.join(__dirname, 'add-missing-columns.sql');
if (fs.existsSync(migrationPath)) {
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log(migrationSQL);
} else {
  console.log(`
-- Add missing columns to scans table

-- Add analysis_model column
ALTER TABLE IF EXISTS public.scans 
ADD COLUMN IF NOT EXISTS analysis_model TEXT DEFAULT 'gpt-4o';

-- Add ai_response_raw column for storing raw AI responses
ALTER TABLE IF EXISTS public.scans 
ADD COLUMN IF NOT EXISTS ai_response_raw JSONB DEFAULT '{}';

-- Add processing_status column
ALTER TABLE IF EXISTS public.scans 
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';

-- Add error_message column
ALTER TABLE IF EXISTS public.scans 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add retry_count column
ALTER TABLE IF EXISTS public.scans 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Add last_processed_at column
ALTER TABLE IF EXISTS public.scans 
ADD COLUMN IF NOT EXISTS last_processed_at TIMESTAMP WITH TIME ZONE;
`);
}

console.log('--- END SQL ---');
console.log('');
console.log('4. Click "Run" to execute the SQL');
console.log('5. Restart your backend server');
console.log('');
console.log('After running this migration, your scan uploads should work properly!'); 