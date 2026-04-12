-- Migration: Insert default brand_logo setting into system_settings
-- Run this in the Supabase SQL Editor

INSERT INTO system_settings (key, value)
VALUES (
  'brand_logo',
  jsonb_build_object(
    'url',  null,
    'text', 'Nachklang'
  )
)
ON CONFLICT (key) DO NOTHING;
