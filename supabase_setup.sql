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
