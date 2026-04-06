-- ============================================================
-- Shopify Integration: Add shopify_product_id columns
-- Run in Supabase SQL Editor
--
-- Context:
-- Products are now managed in Shopify. The medallion_codes and
-- medallion_orders tables need shopify_product_id / shopify_handle
-- columns so inventory lookup and order tracking work correctly.
-- ============================================================

-- 1. medallion_codes: add shopify_product_id for inventory filtering
DO $$
BEGIN
    BEGIN
        ALTER TABLE medallion_codes
            ADD COLUMN IF NOT EXISTS shopify_product_id TEXT;
    EXCEPTION WHEN duplicate_column THEN null;
    END;
END $$;

-- Create index for fast inventory lookup by Shopify product
CREATE INDEX IF NOT EXISTS idx_medallion_codes_shopify_product_id
    ON medallion_codes (shopify_product_id)
    WHERE inventory_status = 'in_stock';

-- 2. medallion_orders: add shopify references (replaces product_id UUID)
DO $$
BEGIN
    BEGIN
        ALTER TABLE medallion_orders
            ADD COLUMN IF NOT EXISTS shopify_product_id TEXT;
    EXCEPTION WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE medallion_orders
            ADD COLUMN IF NOT EXISTS shopify_handle TEXT;
    EXCEPTION WHEN duplicate_column THEN null;
    END;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
