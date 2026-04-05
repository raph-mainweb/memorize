import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await req.json();
    const { first_name, last_name, address_line1, address_line2,
            postal_code, city, country, phone } = body;

    const adminDb = createAdminClient();
    const { error } = await adminDb.from('profiles').update({
      first_name: first_name || null,
      last_name: last_name || null,
      address_line1: address_line1 || null,
      address_line2: address_line2 || null,
      postal_code: postal_code || null,
      city: city || null,
      country: country || 'CH',
      phone: phone || null,
    }).eq('id', user.id);

    if (error) {
      console.error('[Profile/Address] Update error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
