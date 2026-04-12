-- Migration: Insert default brand_colors setting into system_settings
-- Run this in the Supabase SQL Editor

INSERT INTO system_settings (key, value)
VALUES (
  'brand_colors',
  jsonb_build_object(
    'primary', '#968cb5',
    'secondary', '#eae6f4',
    'navy', '#1e2b5e'
  )
)
ON CONFLICT (key) DO NOTHING;
