const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const migrateSchema = async () => {
  console.log('🚀 Running database migrations...');
  
  try {
    // Add analysis_model column to scans table
    console.log('📋 Adding analysis_model column to scans table...');
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE IF EXISTS public.scans 
        ADD COLUMN IF NOT EXISTS analysis_model TEXT DEFAULT 'gpt-4o';
      `
    });
    
    if (addColumnError) {
      console.log('⚠️  Column might already exist:', addColumnError.message);
    } else {
      console.log('✅ analysis_model column added to scans table');
    }

    // Add any other missing columns that might be needed
    console.log('📋 Adding additional columns to scans table...');
    const { error: additionalColumnsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE IF EXISTS public.scans 
        ADD COLUMN IF NOT EXISTS ai_response_raw JSONB DEFAULT '{}';
        
        ALTER TABLE IF EXISTS public.scans 
        ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';
        
        ALTER TABLE IF EXISTS public.scans 
        ADD COLUMN IF NOT EXISTS error_message TEXT;
      `
    });
    
    if (additionalColumnsError) {
      console.log('⚠️  Additional columns might already exist:', additionalColumnsError.message);
    } else {
      console.log('✅ Additional columns added to scans table');
    }

    console.log('🎉 Database migration complete!');
    
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    console.log('💡 Try running the SQL manually in Supabase SQL Editor');
  }
};

migrateSchema(); 