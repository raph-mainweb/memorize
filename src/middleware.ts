import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Next.js standard middleware logic for keeping the session fresh and extracting User data
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. Admin Shield
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Explicit DB check for the is_admin boolean using Admin Client bypassing RLS
    const supabaseAdmin = createAdminClient();
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileErr) {
      console.error(`[Security] DB Error fetching profile for ${user.id}:`, profileErr);
    }

    if (!profile || !profile.is_admin) {
      console.warn(`[Security] Unauthorized admin access attempt by ${user.id} (${user.email})`);
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // 2. Dashboard Shield
  // Prevents anonymous users from brute-forcing dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
      if (!user) {
         return NextResponse.redirect(new URL('/auth/login', request.url))
      }
  }

  return supabaseResponse
}

export const config = {
  // Execute middleware on all routes except static assets
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
