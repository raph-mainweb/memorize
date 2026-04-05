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
    usp JSONB,
    price_in_cents INT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
