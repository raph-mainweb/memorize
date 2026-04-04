-- ==============================================================================
-- B.L.A.S.T Layer 1: Schema & Architecture for Nachklang CH
-- Execute this manually in the Supabase Dashboard SQL Editor
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. memorial_pages
-- ------------------------------------------------------------------------------
CREATE TABLE memorial_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('human', 'pet')),
    is_live BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE memorial_pages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone." 
  ON memorial_pages FOR SELECT 
  USING (is_live = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own profiles." 
  ON memorial_pages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles." 
  ON memorial_pages FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles." 
  ON memorial_pages FOR DELETE 
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 2. media_items
-- ------------------------------------------------------------------------------
CREATE TABLE media_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    memorial_id UUID REFERENCES memorial_pages(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio')),
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Media is viewable if memorial is visible." 
  ON media_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM memorial_pages 
      WHERE memorial_pages.id = media_items.memorial_id 
      AND (memorial_pages.is_live = TRUE OR memorial_pages.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert media to their own memorials." 
  ON media_items FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorial_pages 
      WHERE memorial_pages.id = memorial_id AND memorial_pages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete media from their own memorials." 
  ON media_items FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM memorial_pages 
      WHERE memorial_pages.id = memorial_id AND memorial_pages.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- 3. contributions (e.g. Guestbook, Memories)
-- ------------------------------------------------------------------------------
CREATE TABLE contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    memorial_id UUID REFERENCES memorial_pages(id) ON DELETE CASCADE NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Allowed if approved + memorial is live, OR if you own the memorial
CREATE POLICY "Contributions viewable if approved or owner." 
  ON contributions FOR SELECT 
  USING (
    (is_approved = TRUE AND EXISTS (SELECT 1 FROM memorial_pages WHERE id = memorial_id AND is_live = TRUE))
    OR 
    EXISTS (SELECT 1 FROM memorial_pages WHERE id = memorial_id AND user_id = auth.uid())
  );

-- Anyone can submit a contribution (guestbook) - they default to unapproved
CREATE POLICY "Anyone can submit a contribution." 
  ON contributions FOR INSERT 
  WITH CHECK (is_approved = FALSE);

-- Only memorial owner can approve or delete
CREATE POLICY "Owners can approve/update contributions." 
  ON contributions FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM memorial_pages WHERE id = memorial_id AND user_id = auth.uid()));

CREATE POLICY "Owners can delete contributions." 
  ON contributions FOR DELETE 
  USING (EXISTS (SELECT 1 FROM memorial_pages WHERE id = memorial_id AND user_id = auth.uid()));

-- ------------------------------------------------------------------------------
-- 4. medallion_orders
-- ------------------------------------------------------------------------------
CREATE TABLE medallion_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    shipping_address TEXT NOT NULL,
    tracking_number TEXT,
    stripe_session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE medallion_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders." 
  ON medallion_orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders." 
  ON medallion_orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only service role / admin updates tracking numbers
-- Update policy intentionally omitted for public users

-- ------------------------------------------------------------------------------
-- 5. medallion_codes (The Core Stock-Model Table)
-- ------------------------------------------------------------------------------
CREATE TABLE medallion_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'shipped', 'delivered')),
    memorial_id UUID REFERENCES memorial_pages(id) NULL,
    order_id UUID REFERENCES medallion_orders(id) NULL,
    assigned_at TIMESTAMPTZ NULL,
    shipped_at TIMESTAMPTZ NULL,
    batch TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STRICT RLS: Do NOT create any policies for anon/authenticated. 
-- The entire table is inaccessible from the frontend browser.
-- It can exclusively be queried by the Next.js Server / Stripe Webhooks using the SERVER SERVICE ROLE KEY.
ALTER TABLE medallion_codes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_medallion_code ON medallion_codes(code);
CREATE INDEX idx_medallion_available ON medallion_codes(status) WHERE status='available';

-- ------------------------------------------------------------------------------
-- 6. payments
-- ------------------------------------------------------------------------------
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- e.g., 'unlock', 'subscription_setup'
    amount INT NOT NULL,
    status TEXT NOT NULL,
    stripe_session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments." ON payments FOR SELECT USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. subscriptions
-- ------------------------------------------------------------------------------
CREATE TABLE subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan TEXT NOT NULL, -- 'basic' or 'premium'
    status TEXT NOT NULL, -- 'active', 'canceled', 'past_due'
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscriptions." ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ==============================================================================
-- END OF SCHEMA
-- ==============================================================================
