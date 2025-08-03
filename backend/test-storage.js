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

const testStorage = async () => {
  console.log('🧪 Testing Supabase Storage...');
  
  try {
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'scans_bucket';
    
    // Test 1: Check if bucket exists
    console.log(`📦 Checking if bucket '${bucketName}' exists...`);
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError);
      return;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    if (bucketExists) {
      console.log('✅ Storage bucket exists');
    } else {
      console.log('❌ Storage bucket does not exist');
      return;
    }
    
    // Test 2: Try to upload a test file
    console.log('📤 Testing file upload...');
    const testDeviceId = 'test_device_123';
    const testFileName = `test-${Date.now()}.jpg`;
    
    // Create a minimal test image (1x1 pixel JPEG)
    const testImageBuffer = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
      0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x8A, 0x00,
      0x00, 0xFF, 0xD9
    ]);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(`${testDeviceId}/${testFileName}`, testImageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
      return;
    }
    
    console.log('✅ File upload test successful');
    
    // Test 3: Try to get public URL
    console.log('🔗 Testing public URL generation...');
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(`${testDeviceId}/${testFileName}`);
    
    if (publicUrlData.publicUrl) {
      console.log('✅ Public URL generation successful');
      console.log(`📝 Test URL: ${publicUrlData.publicUrl}`);
    } else {
      console.log('❌ Public URL generation failed');
    }
    
    // Test 4: Clean up test file
    console.log('🧹 Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([`${testDeviceId}/${testFileName}`]);
    
    if (deleteError) {
      console.log('⚠️  Failed to clean up test file:', deleteError.message);
    } else {
      console.log('✅ Test file cleaned up');
    }
    
    console.log('🎉 Storage test completed successfully!');
    console.log('💡 Your storage bucket is working correctly.');
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
  }
};

testStorage(); 