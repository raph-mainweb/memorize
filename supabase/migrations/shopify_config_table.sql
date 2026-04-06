-- ============================================================
-- Shopify OAuth Token Storage
--
-- Stores the Admin API access token obtained via OAuth flow.
-- Accessible only via Supabase Admin Client (service role).
-- RLS denies ALL public/anon/authenticated access.
--
-- Run in Supabase SQL Editor BEFORE triggering the OAuth flow.
-- ============================================================

CREATE TABLE IF NOT EXISTS shopify_config (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain TEXT        NOT NULL UNIQUE,
  access_token TEXT       NOT NULL,
  scope       TEXT,
  installed_at TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE shopify_config ENABLE ROW LEVEL SECURITY;

-- Block ALL public access (service role bypasses this automatically)
DROP POLICY IF EXISTS "deny_all_shopify_config" ON shopify_config;
CREATE POLICY "deny_all_shopify_config" ON shopify_config
  FOR ALL TO public USING (false);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
