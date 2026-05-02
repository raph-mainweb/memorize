-- ============================================================
-- Nachklang v3: Schema-Erweiterungen für neue Customer Journey
-- ============================================================
-- Führe dieses Script in der Supabase SQL Editor aus.
-- Idempotent: Alle Befehle sind safe bei wiederholter Ausführung.
-- ============================================================

-- 1. QR-Guthaben auf User-Profil
--    Speichert wie viele unverbundene QR-Codes ein User hat
--    (wird bei Flow B1 und Flow E erhöht, bei Flow D Fall 3 verringert)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS qr_credits INTEGER NOT NULL DEFAULT 0;

-- 2. Aktivierungstoken-Tabelle (für Flow B2: Medaillon als Geschenk)
--    Ein Token wird beim Kauf erstellt (Webhook) und beim Aktivieren des QR verbraucht
CREATE TABLE IF NOT EXISTS activation_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID REFERENCES medallion_orders(id) ON DELETE SET NULL,
  token        UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  -- pending → used → (expired handled via expires_at check)
  status       TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'used', 'expired')),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 days'),
  used_at      TIMESTAMPTZ,
  used_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index für schnelle Token-Lookups beim QR-Scan
CREATE INDEX IF NOT EXISTS activation_tokens_token_idx ON activation_tokens(token);
CREATE INDEX IF NOT EXISTS activation_tokens_status_idx ON activation_tokens(status);

-- 3. RLS für activation_tokens
ALTER TABLE activation_tokens ENABLE ROW LEVEL SECURITY;

-- Service role hat vollen Zugriff (Webhook + Admin)
-- Anon/User können nur ihren eigenen Token lesen (nach Aktivierung)
CREATE POLICY IF NOT EXISTS "Service role full access"
  ON activation_tokens FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Kommentar zur Integration:
-- qr_credits: Erhöhen via Webhook (Flow B1, E), Verringern via DB-Funktion (Flow D Fall 3)
-- activation_tokens: Erstellen via Webhook (B2), Prüfen+Verbrauchen via /m/[code] (Flow D Fall 2)
-- ============================================================
