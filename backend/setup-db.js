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
    // Create scans table
    console.log('📋 Creating scans table...');
    const { error: scansError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.scans (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          device_id TEXT NOT NULL,
          scan_type TEXT NOT NULL DEFAULT 'coin',
          name TEXT NOT NULL,
          description TEXT,
          value_estimate DECIMAL(10,2),
          currency TEXT DEFAULT 'USD',
          confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
          attributes JSONB DEFAULT '{}',
          image_url TEXT,
          image_storage_path TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (scansError) {
      console.log('⚠️  Scans table might already exist:', scansError.message);
    } else {
      console.log('✅ Scans table created');
    }

    // Create settings table
    console.log('⚙️  Creating settings table...');
    const { error: settingsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          device_id TEXT UNIQUE NOT NULL,
          scan_type TEXT DEFAULT 'coin',
          currency TEXT DEFAULT 'USD',
          theme TEXT DEFAULT 'dark',
          premium_unlocked BOOLEAN DEFAULT FALSE,
          trial_start_date TIMESTAMP WITH TIME ZONE,
          trial_end_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (settingsError) {
      console.log('⚠️  Settings table might already exist:', settingsError.message);
    } else {
      console.log('✅ Settings table created');
    }

    // Create collections table
    console.log('📚 Creating collections table...');
    const { error: collectionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.collections (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          device_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          total_value DECIMAL(10,2) DEFAULT 0,
          scan_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (collectionsError) {
      console.log('⚠️  Collections table might already exist:', collectionsError.message);
    } else {
      console.log('✅ Collections table created');
    }

    // Create indexes
    console.log('🔍 Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_scans_device_id ON public.scans(device_id);
        CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_settings_device_id ON public.settings(device_id);
        CREATE INDEX IF NOT EXISTS idx_collections_device_id ON public.collections(device_id);
      `
    });
    
    if (indexError) {
      console.log('⚠️  Indexes might already exist:', indexError.message);
    } else {
      console.log('✅ Indexes created');
    }

    // Enable RLS
    console.log('🔒 Enabling Row Level Security...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE IF EXISTS public.scans ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.settings ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.collections ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (rlsError) {
      console.log('⚠️  RLS might already be enabled:', rlsError.message);
    } else {
      console.log('✅ Row Level Security enabled');
    }

    console.log('🎉 Database setup complete!');
    console.log('📝 Note: You may need to manually create RLS policies in Supabase dashboard');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('💡 Try running the SQL manually in Supabase SQL Editor');
  }
};

setupDatabase(); 