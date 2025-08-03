-- Create the scans table
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

-- Create the settings table
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

-- Create the collections table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scans_device_id ON public.scans(device_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settings_device_id ON public.settings(device_id);
CREATE INDEX IF NOT EXISTS idx_collections_device_id ON public.collections(device_id);

-- Enable Row Level Security
ALTER TABLE IF EXISTS public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.collections ENABLE ROW LEVEL SECURITY; 