'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function sendMagicLink(formData: FormData) {
  const supabase = createClient()
  let origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'
  origin = origin.startsWith('http') ? origin : `https://${origin}`
  
  const email = formData.get('email') as string

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      // Should create new user implicitly if it doesn't exist
      shouldCreateUser: true,
    },
  })

  if (error) {
    console.error('MagicLink Error:', error.message)
    redirect('/auth/login?error=true')
  }

  // Show a success state in the UI so they know to check their email
  redirect('/auth/login?success=true')
}

export async function signout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signInWithGoogle() {
  const supabase = createClient()
  let origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'
  origin = origin.startsWith('http') ? origin : `https://${origin}`
  
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
