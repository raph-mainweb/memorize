import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export async function PATCH(req: NextRequest) {
  const userClient = createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminDb = createAdminClient();
  const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { ids, production_status, inventory_status, notes } = body as {
    ids: string[];
    production_status?: string;
    inventory_status?: string;
    notes?: string;
  };

  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: 'Keine IDs angegeben' }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {};
  const now = new Date().toISOString();

  if (production_status) {
    updatePayload.production_status = production_status;
    if (production_status === 'exported') updatePayload.exported_at = now;
    if (production_status === 'produced') updatePayload.produced_at = now;
  }

  if (inventory_status) {
    updatePayload.inventory_status = inventory_status;
    // Mirror to legacy status field for webhook compatibility
    const legacyMap: Record<string, string> = {
      in_stock: 'available',
      assigned: 'assigned',
      connected: 'assigned',
      shipped: 'shipped',
      activated: 'delivered',
    };
    updatePayload.status = legacyMap[inventory_status] || 'available';
    if (inventory_status === 'shipped') updatePayload.shipped_at = now;
    if (inventory_status === 'connected') updatePayload.connected_at = now;
  }

  if (notes !== undefined) {
    updatePayload.notes = notes;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: 'Keine Felder zum Aktualisieren' }, { status: 400 });
  }

  const { error, count } = await adminDb
    .from('medallion_codes')
    .update(updatePayload)
    .in('id', ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ updated: count, payload: updatePayload });
}
