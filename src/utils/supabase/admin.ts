import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * CAUTION: B.L.A.S.T Layer 3 Administrative Client
 * This client circumvents ALL Row Level Security (RLS) protections.
 * Never import or use this client in any UI or frontend code.
 * Exclusively strictly used for isolated backend Webhooks and utility Redirects 
 * to handle secure Stock-Model DB operations internally.
 */
export function createAdminClient() {
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!adminKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.');
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    adminKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
