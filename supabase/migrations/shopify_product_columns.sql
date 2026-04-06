-- ============================================================
-- medallion_codes: Zielarchitektur für Shopify-Produktzuordnung
-- ============================================================
--
-- ZIEL:
-- - Jeder QR-Code ist einer konkreten Shopify-Produkt-ID zugeordnet
-- - Öffentliche Verfügbarkeit kommt aus Shopify (nicht aus dieser Tabelle)
-- - medallion_codes = interne physische Einheiten für Fulfillment
--
-- STATUS-MODELL:
--   in_stock             → Neu, lagernd, noch keiner Bestellung zugeordnet
--   reserved_for_order   → Stripe Checkout Session gestartet (noch nicht bezahlt)
--   assigned             → Bestellung bezahlt, Code zugewiesen
--   shipped              → Physisch versendet
--   claimed_by_customer  → Vom Kunden gescannt + aktiviert
--   assigned_to_memorial → Mit Memorial-Seite verknüpft
--   inactive             → Deaktiviert / ausgemustert
--   lost_or_invalid      → Verloren / ungültig
-- ============================================================

DO $$
BEGIN

  -- 1. shopify_product_id: verknüpft Code mit konkretem Shopify-Produkt (numerische ID)
  --    Pflicht für produkttypspezifische Reservierung beim Kauf
  BEGIN ALTER TABLE medallion_codes
    ADD COLUMN IF NOT EXISTS shopify_product_id TEXT;
  EXCEPTION WHEN duplicate_column THEN null; END;

  -- 2. shopify_product_handle: lesbare Zuordnung (z.B. "qr-medaillon-herz")
  BEGIN ALTER TABLE medallion_codes
    ADD COLUMN IF NOT EXISTS shopify_product_handle TEXT;
  EXCEPTION WHEN duplicate_column THEN null; END;

  -- 3. order_id: Stripe / intern — Bestellreferenz
  BEGIN ALTER TABLE medallion_codes
    ADD COLUMN IF NOT EXISTS order_id UUID;
  EXCEPTION WHEN duplicate_column THEN null; END;

  -- 4. stripe_session_id: für Zuordnung nach Checkout
  BEGIN ALTER TABLE medallion_codes
    ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
  EXCEPTION WHEN duplicate_column THEN null; END;

  -- 5. Erweitertes Statusmodell für inventory_status
  --    Alte Werte bleiben gültig für Migration; neue werden ergänzt
  BEGIN
    ALTER TABLE medallion_codes
      DROP CONSTRAINT IF EXISTS medallion_codes_inventory_status_check;
    ALTER TABLE medallion_codes
      ADD CONSTRAINT medallion_codes_inventory_status_check
      CHECK (inventory_status IN (
        'in_stock',
        'reserved_for_order',
        'reserved',          -- Legacy-Kompatibilität
        'assigned',
        'shipped',
        'claimed_by_customer',
        'assigned_to_memorial',
        'connected',         -- Legacy-Kompatibilität
        'activated',         -- Legacy-Kompatibilität
        'inactive',
        'lost_or_invalid'
      ));
  EXCEPTION WHEN OTHERS THEN null; END;

  -- 6. reserved_at: Zeitstempel wenn Code für Bestellung reserviert wird
  BEGIN ALTER TABLE medallion_codes
    ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMPTZ;
  EXCEPTION WHEN duplicate_column THEN null; END;

  -- 7. assigned_at: Zeitstempel wenn Code einer Bestellung zugewiesen wird
  BEGIN ALTER TABLE medallion_codes
    ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
  EXCEPTION WHEN duplicate_column THEN null; END;

  -- 8. claimed_at: Zeitstempel wenn Kunde scannt + aktiviert
  BEGIN ALTER TABLE medallion_codes
    ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
  EXCEPTION WHEN duplicate_column THEN null; END;

END $$;

-- Indizes für schnelle produkttypspezifische Reservierungsabfragen
CREATE INDEX IF NOT EXISTS idx_medallion_codes_shopify_product_id
  ON medallion_codes (shopify_product_id)
  WHERE inventory_status = 'in_stock';

CREATE INDEX IF NOT EXISTS idx_medallion_codes_shopify_product_id_status
  ON medallion_codes (shopify_product_id, inventory_status);

-- medallion_orders: Shopify-Felder ergänzen
DO $$
BEGIN
  BEGIN ALTER TABLE medallion_orders
    ADD COLUMN IF NOT EXISTS shopify_product_id TEXT;
  EXCEPTION WHEN duplicate_column THEN null; END;

  BEGIN ALTER TABLE medallion_orders
    ADD COLUMN IF NOT EXISTS shopify_handle TEXT;
  EXCEPTION WHEN duplicate_column THEN null; END;

  BEGIN ALTER TABLE medallion_orders
    ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
  EXCEPTION WHEN duplicate_column THEN null; END;
END $$;

-- Schema-Cache neu laden
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- BATCH-BEISPIEL (nach Migration ausführbar):
-- INSERT INTO medallion_codes (code, qr_url, status, inventory_status,
--   shopify_product_id, shopify_product_handle, batch)
-- SELECT
--   'H' || LPAD(generate_series::text, 3, '0'),
--   'https://memorize-liart.vercel.app/m/H' || LPAD(generate_series::text, 3, '0'),
--   'available', 'in_stock',
--   '9876543210', 'qr-medaillon-herz', 'herz-batch-001'
-- FROM generate_series(1, 25);
-- ============================================================
