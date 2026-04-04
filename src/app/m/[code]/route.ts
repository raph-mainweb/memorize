import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  const code = params.code?.toUpperCase();

  // Validate format (e.g., A7K3 implies 4 alphanumeric limit)
  if (!code || !/^[A-Z0-9]{4}$/.test(code)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const supabaseAdmin = createAdminClient();
    
    // Admin query overrides frontend RLS lock.
    const { data, error } = await supabaseAdmin
      .from('medallion_codes')
      .select('status, memorial_pages ( slug )')
      .eq('code', code)
      .single();

    if (error || !data) {
      console.warn(`[Redirect Engine] Code not found or DB error: ${code}`);
      return NextResponse.redirect(new URL('/m/nicht-aktiviert', request.url));
    }

    if (data.status === 'available') {
      // Valid physically printed code, but not yet sold via Stripe webhook
      return NextResponse.redirect(new URL('/m/nicht-aktiviert', request.url));
    }

    // Must be assigned, shipped, or delivered. Safely extract slug:
    // @ts-ignore - Supabase type casting array vs object representation inside Next
    const pageSlug = data.memorial_pages?.slug || (Array.isArray(data.memorial_pages) ? data.memorial_pages[0]?.slug : undefined);
    
    if (pageSlug) {
      return NextResponse.redirect(new URL(`/gedenken/${pageSlug}`, request.url));
    } else {
      // Edge-case: Code assigned but the relationship to memorial_page is broken/null
      console.error(`[Redirect Engine] Code ${code} assigned but no memorial_slug resolved`);
      return NextResponse.redirect(new URL('/m/nicht-aktiviert', request.url));
    }

  } catch (err) {
    console.error(`[Redirect Engine] Fatal Error:`, err);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
