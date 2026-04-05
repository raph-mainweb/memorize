-- 1. Admin Rechte vergeben (Setzt is_admin auf true für den Nutzer)
UPDATE profiles 
SET is_admin = true 
WHERE id = (SELECT id FROM auth.users WHERE email = 'raphael.ae24@gmail.com');


-- 2. System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- Standard Preis (49 CHF) für "Nur Freischaltung" (ohne Medaillon)
INSERT INTO system_settings (key, value) VALUES (
    'unlock_price', 
    '{"amount": 4900, "currency": "chf", "name": "Gedenkseite Freischaltung"}'::jsonb
) ON CONFLICT DO NOTHING;


-- 3. Products table (Für die physischen Medaillons)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    usp JSONB DEFAULT '[]'::jsonb,
    price_in_cents INT NOT NULL DEFAULT 0,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    stripe_price_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow adding missing columns to existing products table
DO $$ BEGIN
  BEGIN ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT; EXCEPTION WHEN duplicate_column THEN null; END;
  BEGIN ALTER TABLE products ADD COLUMN IF NOT EXISTS usp JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN null; END;
  BEGIN ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN null; END;
  BEGIN ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true; EXCEPTION WHEN duplicate_column THEN null; END;
  BEGIN ALTER TABLE products ADD COLUMN IF NOT EXISTS stripe_price_id TEXT; EXCEPTION WHEN duplicate_column THEN null; END;
END $$;

-- 4. Update bestehender Tabellen
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE medallion_codes ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE medallion_orders ADD COLUMN status TEXT DEFAULT 'pending';
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE medallion_orders ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE medallion_orders ADD COLUMN memorial_id UUID;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;

-- 5. Extended medallion_codes columns for full QR lifecycle tracking
-- Run this in Supabase SQL Editor
DO $$
BEGIN
    -- Unique constraint on code column (tokens must be unique)
    BEGIN
        ALTER TABLE medallion_codes ADD CONSTRAINT medallion_codes_code_unique UNIQUE (code);
    EXCEPTION WHEN duplicate_table THEN null;
    END;

    -- Full redirect URL stored for convenience
    BEGIN ALTER TABLE medallion_codes ADD COLUMN IF NOT EXISTS qr_url TEXT; EXCEPTION WHEN duplicate_column THEN null; END;

    -- Production lifecycle
    BEGIN ALTER TABLE medallion_codes ADD COLUMN IF NOT EXISTS production_status TEXT DEFAULT 'generated' CHECK (production_status IN ('generated','exported','produced')); EXCEPTION WHEN duplicate_column THEN null; END;

    -- Inventory / assignment lifecycle
    BEGIN ALTER TABLE medallion_codes ADD COLUMN IF NOT EXISTS inventory_status TEXT DEFAULT 'in_stock' CHECK (inventory_status IN ('in_stock','reserved','assigned','connected','shipped','activated')); EXCEPTION WHEN duplicate_column THEN null; END;

    -- Who it's assigned to (customer user_id)
    BEGIN ALTER TABLE medallion_codes ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_column THEN null; END;

    -- Which memorial page it's linked to
    BEGIN ALTER TABLE medallion_codes ADD COLUMN IF NOT EXISTS assigned_page_id UUID REFERENCES memorial_pages(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_column THEN null; END;

    -- Lifecycle timestamps
    BEGIN ALTER TABLE medallion_codes ADD COLUMN IF NOT EXISTS exported_at TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN null; END;
    BEGIN ALTER TABLE medallion_codes ADD COLUMN IF NOT EXISTS produced_at TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN null; END;
    BEGIN ALTER TABLE medallion_codes ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN null; END;

    -- Optional metadata
    BEGIN ALTER TABLE medallion_codes ADD COLUMN IF NOT EXISTS serial_number TEXT; EXCEPTION WHEN duplicate_column THEN null; END;
    BEGIN ALTER TABLE medallion_codes ADD COLUMN IF NOT EXISTS notes TEXT; EXCEPTION WHEN duplicate_column THEN null; END;
END $$;

-- Backfill qr_url for existing codes that don't have one yet
UPDATE medallion_codes
SET qr_url = concat('https://memorize-liart.vercel.app/m/', code)
WHERE qr_url IS NULL AND code IS NOT NULL;


-- 6. Shipping address fields on profiles
-- Run this in Supabase SQL Editor
DO $$
BEGIN
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT; EXCEPTION WHEN duplicate_column THEN null; END;
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT; EXCEPTION WHEN duplicate_column THEN null; END;
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_line1 TEXT; EXCEPTION WHEN duplicate_column THEN null; END;
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_line2 TEXT; EXCEPTION WHEN duplicate_column THEN null; END;
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code TEXT; EXCEPTION WHEN duplicate_column THEN null; END;
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT; EXCEPTION WHEN duplicate_column THEN null; END;
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'CH'; EXCEPTION WHEN duplicate_column THEN null; END;
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT; EXCEPTION WHEN duplicate_column THEN null; END;
END $$;

-- Also run schema reload after:
-- NOTIFY pgrst, 'reload schema';

-- 7. Extend medallion_orders table with missing columns
-- Run in Supabase SQL Editor:
DO $$
BEGIN
    BEGIN ALTER TABLE medallion_orders ADD COLUMN IF NOT EXISTS memorial_id UUID; EXCEPTION WHEN duplicate_column THEN null; END;
    BEGIN ALTER TABLE medallion_orders ADD COLUMN IF NOT EXISTS product_id UUID; EXCEPTION WHEN duplicate_column THEN null; END;
    BEGIN ALTER TABLE medallion_orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'; EXCEPTION WHEN duplicate_column THEN null; END;
    BEGIN ALTER TABLE medallion_orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT; EXCEPTION WHEN duplicate_column THEN null; END;
    BEGIN ALTER TABLE medallion_codes ADD COLUMN IF NOT EXISTS assigned_user_id UUID; EXCEPTION WHEN duplicate_column THEN null; END;
    BEGIN ALTER TABLE medallion_codes ADD COLUMN IF NOT EXISTS assigned_page_id UUID; EXCEPTION WHEN duplicate_column THEN null; END;
    BEGIN ALTER TABLE medallion_codes ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN null; END;
    BEGIN ALTER TABLE medallion_codes ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN null; END;
END $$;

-- NOTIFY pgrst, 'reload schema';

