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

const setupStorage = async () => {
  console.log('🚀 Setting up Supabase Storage...');
  
  try {
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'scans_bucket';
    
    // Create storage bucket
    console.log(`📦 Creating storage bucket: ${bucketName}`);
    const { data: bucketData, error: bucketError } = await supabase.storage
      .createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });
    
    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Storage bucket already exists');
      } else {
        console.error('❌ Failed to create storage bucket:', bucketError);
        return;
      }
    } else {
      console.log('✅ Storage bucket created successfully');
    }

    // Set up storage policies for RLS
    console.log('🔒 Setting up storage policies...');
    
    // Policy to allow authenticated users to upload files
    const uploadPolicy = `
      CREATE POLICY "Allow authenticated uploads" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = '${bucketName}' AND
        auth.role() = 'authenticated'
      );
    `;
    
    // Policy to allow public read access
    const readPolicy = `
      CREATE POLICY "Allow public read access" ON storage.objects
      FOR SELECT USING (bucket_id = '${bucketName}');
    `;
    
    // Policy to allow users to delete their own files
    const deletePolicy = `
      CREATE POLICY "Allow authenticated deletes" ON storage.objects
      FOR DELETE USING (
        bucket_id = '${bucketName}' AND
        auth.role() = 'authenticated'
      );
    `;

    try {
      await supabase.rpc('exec_sql', { sql: uploadPolicy });
      console.log('✅ Upload policy created');
    } catch (error) {
      console.log('⚠️  Upload policy might already exist:', error.message);
    }

    try {
      await supabase.rpc('exec_sql', { sql: readPolicy });
      console.log('✅ Read policy created');
    } catch (error) {
      console.log('⚠️  Read policy might already exist:', error.message);
    }

    try {
      await supabase.rpc('exec_sql', { sql: deletePolicy });
      console.log('✅ Delete policy created');
    } catch (error) {
      console.log('⚠️  Delete policy might already exist:', error.message);
    }

    console.log('🎉 Storage setup complete!');
    console.log(`📝 Storage bucket: ${bucketName}`);
    console.log('💡 You can now upload images to the storage bucket');
    
  } catch (error) {
    console.error('❌ Storage setup failed:', error);
    console.log('💡 You may need to create the bucket manually in Supabase dashboard');
    console.log('   Go to Storage > Create bucket > Name: scans_bucket > Public bucket');
  }
};

setupStorage(); 