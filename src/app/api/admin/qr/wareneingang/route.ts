import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  const userClient = createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminDb = createAdminClient();
  const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { codes } = body as { codes: Record<string, unknown>[] };

  if (!codes || codes.length === 0) {
    return NextResponse.json({ error: 'Keine Codes übergeben' }, { status: 400 });
  }

  const { data: inserted, error } = await adminDb
    .from('medallion_codes')
    .upsert(codes, { onConflict: 'code', ignoreDuplicates: true })
    .select('id, code, qr_url, batch, production_status, inventory_status');

  if (error) {
    console.error('[Wareneingang]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted, count: inserted?.length });
}
