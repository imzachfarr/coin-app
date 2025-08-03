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

const setupDatabase = async () => {
  console.log('🚀 Setting up database tables...');
  
  try {
    // Test connection by trying to insert a test record
    console.log('📋 Testing scans table...');
    const { data, error } = await supabase
      .from('scans')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('❌ Tables do not exist. Please run the SQL manually in Supabase:');
      console.log('');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of database/schema.sql');
      console.log('4. Run the SQL script');
      console.log('');
      console.log('Or use the Supabase CLI:');
      console.log('supabase db reset');
    } else if (error) {
      console.log('⚠️  Other database error:', error.message);
    } else {
      console.log('✅ Database tables exist and are accessible');
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  }
};

setupDatabase(); 