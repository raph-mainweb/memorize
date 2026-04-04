-- ==============================================================================
-- B.L.A.S.T Layer 1.5: Admin Architecture & User Profiles
-- Execute this manually in the Supabase Dashboard SQL Editor
-- ==============================================================================

-- 1. Create the persistent Profiles table bridging Auth to public data
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Turn on Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by owner." 
    ON profiles FOR SELECT USING (auth.uid() = id);

-- 3. Automate Profile Creation on Registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, is_admin)
  VALUES (new.id, FALSE);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ELEVATION COMMAND (Run this AFTER you have registered your first account)
-- ==============================================================================
-- UNCOMMENT AND RUN THIS, REPLACING YOUR EMAIL:
-- 
-- UPDATE profiles 
-- SET is_admin = TRUE 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'deine@email.ch');
-- ==============================================================================
