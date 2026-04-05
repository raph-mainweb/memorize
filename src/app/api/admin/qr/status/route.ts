import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

// Middleware already protects /api/admin/* — no separate auth check needed here.
export async function PATCH(req: NextRequest) {
  const adminDb = createAdminClient();

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
    if (legacyMap[inventory_status]) {
      updatePayload.status = legacyMap[inventory_status];
    }
    if (inventory_status === 'shipped') updatePayload.shipped_at = now;
    if (inventory_status === 'connected') updatePayload.connected_at = now;
  }

  if (notes !== undefined) {
    updatePayload.notes = notes;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: 'Keine Felder zum Aktualisieren' }, { status: 400 });
  }

  console.log('[QR Status] Updating', ids.length, 'codes with', updatePayload);

  const { error, data } = await adminDb
    .from('medallion_codes')
    .update(updatePayload)
    .in('id', ids)
    .select('id');

  if (error) {
    console.error('[QR Status] DB error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('[QR Status] Updated', data?.length ?? 0, 'rows');
  return NextResponse.json({ updated: data?.length ?? 0, payload: updatePayload });
}
