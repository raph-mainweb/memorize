/**
 * POST /api/activation/validate
 *
 * Validates an activation token for the gift medallion flow (B2 / Flow D Fall 2).
 * Does NOT consume the token — consumption happens after user logs in and links the medallion.
 *
 * Request: { token: string, code?: string }
 * Response: { valid: true } | { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { token, code } = await req.json() as { token: string; code?: string };

    if (!token) {
      return NextResponse.json({ error: 'Token fehlt' }, { status: 400 });
    }

    const db = createAdminClient();

    const { data: tokenRecord, error } = await db
      .from('activation_tokens')
      .select('id, status, expires_at')
      .eq('token', token)
      .single();

    if (error || !tokenRecord) {
      return NextResponse.json({ error: 'Ungültiger Aktivierungscode.' }, { status: 404 });
    }

    if (tokenRecord.status !== 'pending') {
      return NextResponse.json({ error: 'Dieser Aktivierungscode wurde bereits verwendet.' }, { status: 409 });
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Dieser Aktivierungscode ist abgelaufen (90 Tage TTL).' }, { status: 410 });
    }

    console.log(`[validate-token] Valid token for code=${code || 'unknown'}`);
    return NextResponse.json({ valid: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
