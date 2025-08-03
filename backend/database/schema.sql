-- AI Asset Accelerator Database Schema
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
ALTER TABLE IF EXISTS public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.collections ENABLE ROW LEVEL SECURITY;

-- Create scans table
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

-- Create settings table
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

-- Create collections table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scans_device_id ON public.scans(device_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settings_device_id ON public.settings(device_id);
CREATE INDEX IF NOT EXISTS idx_collections_device_id ON public.collections(device_id);

-- Row Level Security Policies

-- Scans table policies
CREATE POLICY IF NOT EXISTS "Users can view their own scans" ON public.scans
    FOR SELECT USING (device_id = current_setting('request.headers')::json->>'x-device-id');

CREATE POLICY IF NOT EXISTS "Users can insert their own scans" ON public.scans
    FOR INSERT WITH CHECK (device_id = current_setting('request.headers')::json->>'x-device-id');

CREATE POLICY IF NOT EXISTS "Users can update their own scans" ON public.scans
    FOR UPDATE USING (device_id = current_setting('request.headers')::json->>'x-device-id');

CREATE POLICY IF NOT EXISTS "Users can delete their own scans" ON public.scans
    FOR DELETE USING (device_id = current_setting('request.headers')::json->>'x-device-id');

-- Settings table policies
CREATE POLICY IF NOT EXISTS "Users can view their own settings" ON public.settings
    FOR SELECT USING (device_id = current_setting('request.headers')::json->>'x-device-id');

CREATE POLICY IF NOT EXISTS "Users can insert their own settings" ON public.settings
    FOR INSERT WITH CHECK (device_id = current_setting('request.headers')::json->>'x-device-id');

CREATE POLICY IF NOT EXISTS "Users can update their own settings" ON public.settings
    FOR UPDATE USING (device_id = current_setting('request.headers')::json->>'x-device-id');

-- Collections table policies
CREATE POLICY IF NOT EXISTS "Users can view their own collections" ON public.collections
    FOR SELECT USING (device_id = current_setting('request.headers')::json->>'x-device-id');

CREATE POLICY IF NOT EXISTS "Users can insert their own collections" ON public.collections
    FOR INSERT WITH CHECK (device_id = current_setting('request.headers')::json->>'x-device-id');

CREATE POLICY IF NOT EXISTS "Users can update their own collections" ON public.collections
    FOR UPDATE USING (device_id = current_setting('request.headers')::json->>'x-device-id');

CREATE POLICY IF NOT EXISTS "Users can delete their own collections" ON public.collections
    FOR DELETE USING (device_id = current_setting('request.headers')::json->>'x-device-id');

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('scans_bucket', 'scans_bucket', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for scans_bucket
CREATE POLICY IF NOT EXISTS "Users can upload their own images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'scans_bucket' AND 
        (storage.foldername(name))[1] = current_setting('request.headers')::json->>'x-device-id'
    );

CREATE POLICY IF NOT EXISTS "Users can view their own images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'scans_bucket' AND 
        (storage.foldername(name))[1] = current_setting('request.headers')::json->>'x-device-id'
    );

CREATE POLICY IF NOT EXISTS "Users can delete their own images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'scans_bucket' AND 
        (storage.foldername(name))[1] = current_setting('request.headers')::json->>'x-device-id'
    ); 