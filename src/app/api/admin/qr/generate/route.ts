import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { randomBytes } from 'crypto';

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I,O,0,1 to avoid confusion
const TOKEN_LENGTH = 8;

function generateToken(): string {
  const bytes = randomBytes(TOKEN_LENGTH);
  return Array.from(bytes).map(b => CHARSET[b % CHARSET.length]).join('');
}

export async function POST(req: NextRequest) {
  // Admin-only
  const userClient = createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminDb = createAdminClient();
  const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { product_id, count, batch_name } = body as { product_id?: string; count: number; batch_name: string };

  if (!count || count < 1 || count > 500) {
    return NextResponse.json({ error: 'count muss zwischen 1 und 500 liegen' }, { status: 400 });
  }
  if (!batch_name?.trim()) {
    return NextResponse.json({ error: 'batch_name erforderlich' }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://memorize-liart.vercel.app';

  // Generate unique tokens (retry on collision)
  const tokens: string[] = [];
  let attempts = 0;
  while (tokens.length < count && attempts < count * 5) {
    const token = generateToken();
    if (!tokens.includes(token)) tokens.push(token);
    attempts++;
  }

  // Check DB for existing tokens to guarantee uniqueness
  const { data: existing } = await adminDb
    .from('medallion_codes')
    .select('code')
    .in('code', tokens);

  const existingSet = new Set((existing || []).map((r: { code: string }) => r.code));
  let uniqueTokens = tokens.filter(t => !existingSet.has(t));

  // If collisions reduced our count, generate more
  while (uniqueTokens.length < count) {
    const extra = generateToken();
    if (!uniqueTokens.includes(extra) && !existingSet.has(extra)) {
      uniqueTokens.push(extra);
    }
  }
  uniqueTokens = uniqueTokens.slice(0, count);

  // Build insert payload
  const rows = uniqueTokens.map(token => ({
    code: token,
    qr_url: `${siteUrl}/m/${token}`,
    status: 'available',
    production_status: 'generated',
    inventory_status: 'in_stock',
    batch: batch_name.trim(),
    product_id: product_id || null,
  }));

  const { data: inserted, error } = await adminDb
    .from('medallion_codes')
    .insert(rows)
    .select('id, code, qr_url, batch, production_status, inventory_status');

  if (error) {
    console.error('[QR Generate]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ codes: inserted, batch: batch_name, count: inserted?.length });
}
