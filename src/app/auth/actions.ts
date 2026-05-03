'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

/**
 * Step 1: Send a 6-digit OTP code to the user's email.
 * Uses Supabase's native OTP (no emailRedirectTo = code, not link).
 */
export async function sendOtpCode(email: string): Promise<{ error?: string }> {
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      // No emailRedirectTo → Supabase sends a 6-digit code instead of a magic link
    },
  })

  if (error) {
    console.error('OTP Send Error:', error.message)
    return { error: error.message }
  }

  return {}
}

/**
 * Step 2: Verify the 6-digit OTP code and create a session.
 * Returns the user's role so the client can redirect appropriately.
 */
export async function verifyOtpCode(
  email: string,
  token: string
): Promise<{ error?: string; isAdmin?: boolean }> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error || !data.user) {
    console.error('OTP Verify Error:', error?.message)
    return { error: error?.message ?? 'Ungültiger oder abgelaufener Code.' }
  }

  // Check admin status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', data.user.id)
    .single()

  revalidatePath('/', 'layout')
  return { isAdmin: profile?.is_admin === true }
}

/**
 * Sign out the current user.
 */
export async function signout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

/**
 * Google OAuth — unchanged.
 */
export async function signInWithGoogle() {
  const supabase = createClient()
  const origin =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://memorize-liart.vercel.app'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('OAuth Error:', error.message)
    redirect('/auth/login?error=oauth_failed')
  }

  if (data.url) {
    redirect(data.url)
  }
}
