const { createClient } = require('@supabase/supabase-js');

// Validate required environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is required');
}

// Create Supabase client with service role key for backend operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

/**
 * Helper function to handle RLS (Row Level Security) by device_id
 * This ensures all queries are scoped to the authenticated device
 */
const withDeviceId = (query, deviceId) => {
  if (!deviceId) {
    throw new Error('Device ID is required for database operations');
  }
  return query.eq('device_id', deviceId);
};

/**
 * Database helper functions
 */

// Scans table operations
const scansService = {
  // Create a new scan
  create: async (deviceId, scanData) => {
    const { data, error } = await supabase
      .from('scans')
      .insert({
        device_id: deviceId,
        ...scanData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all scans for a device
  getAll: async (deviceId, limit = 100, offset = 0) => {
    const { data, error } = await withDeviceId(
      supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      deviceId
    );
    
    if (error) throw error;
    return data;
  },

  // Get scan by ID
  getById: async (deviceId, scanId) => {
    const { data, error } = await withDeviceId(
      supabase
        .from('scans')
        .select('*')
        .eq('id', scanId),
      deviceId
    ).single();
    
    if (error) throw error;
    return data;
  },

  // Update scan
  update: async (deviceId, scanId, updates) => {
    const { data, error } = await withDeviceId(
      supabase
        .from('scans')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', scanId),
      deviceId
    ).select().single();
    
    if (error) throw error;
    return data;
  },

  // Delete scan
  delete: async (deviceId, scanId) => {
    const { error } = await withDeviceId(
      supabase
        .from('scans')
        .delete()
        .eq('id', scanId),
      deviceId
    );
    
    if (error) throw error;
    return true;
  },

  // Get total value for device
  getTotalValue: async (deviceId) => {
    const { data, error } = await supabase
      .rpc('calculate_total_value', { target_device_id: deviceId });
    
    if (error) throw error;
    return data;
  }
};

// Settings table operations
const settingsService = {
  // Get settings for device
  get: async (deviceId) => {
    const { data, error } = await withDeviceId(
      supabase
        .from('settings')
        .select('*'),
      deviceId
    ).single();
    
    // If no settings exist, create default ones
    if (error && error.code === 'PGRST116') {
      return await settingsService.create(deviceId, {});
    }
    
    if (error) throw error;
    return data;
  },

  // Create settings for device
  create: async (deviceId, settings = {}) => {
    const defaultSettings = {
      device_id: deviceId,
      premium_unlocked: false,
      currency: 'USD',
      theme: 'system',
      haptics_enabled: true,
      notifications_enabled: true,
      ...settings,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('settings')
      .insert(defaultSettings)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update settings
  update: async (deviceId, updates) => {
    const { data, error } = await withDeviceId(
      supabase
        .from('settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        }),
      deviceId
    ).select().single();
    
    if (error) throw error;
    return data;
  },

  // Update premium status
  updatePremiumStatus: async (deviceId, isPremium) => {
    return await settingsService.update(deviceId, {
      premium_unlocked: isPremium,
      premium_updated_at: new Date().toISOString()
    });
  }
};

// Collections table operations (for grouping scans)
const collectionsService = {
  // Create collection
  create: async (deviceId, collectionData) => {
    const { data, error } = await supabase
      .from('collections')
      .insert({
        device_id: deviceId,
        ...collectionData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all collections for device
  getAll: async (deviceId) => {
    const { data, error } = await withDeviceId(
      supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false }),
      deviceId
    );
    
    if (error) throw error;
    return data;
  }
};

// Storage operations
const storageService = {
  // Upload image to Supabase Storage
  uploadImage: async (deviceId, imageBuffer, fileName) => {
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'scans_bucket';
    const filePath = `${deviceId}/${Date.now()}-${fileName}`;
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, imageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return {
      path: data.path,
      publicUrl: publicUrlData.publicUrl
    };
  },

  // Delete image from storage
  deleteImage: async (filePath) => {
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'scans_bucket';
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) throw error;
    return true;
  }
};

// Health check for Supabase connection
const healthCheck = async () => {
  try {
    const { data, error } = await supabase
      .from('scans')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    return { healthy: !error, error: error?.message };
  } catch (err) {
    return { healthy: false, error: err.message };
  }
};

module.exports = {
  supabase,
  scansService,
  settingsService,
  collectionsService,
  // New admin-config service
  appConfigService: {
    getLatest: async () => {
      const { data, error } = await supabase
        .from('app_configs')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    upsert: async (config) => {
      // Keep only one row by inserting a new row and optionally cleaning old ones
      const { data, error } = await supabase
        .from('app_configs')
        .insert({ ...config, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },
  storageService,
  healthCheck,
  withDeviceId
}; 