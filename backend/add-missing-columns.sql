-- Add missing columns to scans table
-- Run this in your Supabase SQL editor

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