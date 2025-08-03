-- Fix Database Schema - Add Missing Columns
-- Run this in your Supabase SQL editor

-- Add missing columns to scans table with correct names
ALTER TABLE IF EXISTS public.scans 
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) DEFAULT 0.8;

ALTER TABLE IF EXISTS public.scans 
ADD COLUMN IF NOT EXISTS image_path TEXT;

ALTER TABLE IF EXISTS public.scans 
ADD COLUMN IF NOT EXISTS raw_json JSONB DEFAULT '{}';

ALTER TABLE IF EXISTS public.scans 
ADD COLUMN IF NOT EXISTS parsed_attributes JSONB DEFAULT '{}';

ALTER TABLE IF EXISTS public.scans 
ADD COLUMN IF NOT EXISTS analysis_model TEXT DEFAULT 'gpt-4o';

ALTER TABLE IF EXISTS public.scans 
ADD COLUMN IF NOT EXISTS analysis_version TEXT DEFAULT '1.0';

-- Add any other missing columns that might be needed
ALTER TABLE IF EXISTS public.scans 
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';

ALTER TABLE IF EXISTS public.scans 
ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE IF EXISTS public.scans 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.scans 
ADD COLUMN IF NOT EXISTS last_processed_at TIMESTAMP WITH TIME ZONE;

-- Update the updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for scans table
DROP TRIGGER IF EXISTS update_scans_updated_at ON public.scans;
CREATE TRIGGER update_scans_updated_at
    BEFORE UPDATE ON public.scans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for settings table
DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for collections table
DROP TRIGGER IF EXISTS update_collections_updated_at ON public.collections;
CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON public.collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'scans' 
AND table_schema = 'public'
ORDER BY ordinal_position; 