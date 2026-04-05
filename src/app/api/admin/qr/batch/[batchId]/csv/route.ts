import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const batchId = decodeURIComponent(params.batchId);
  const db = createAdminClient();

  const { data: codes, error } = await db
    .from('medallion_codes')
    .select('code, qr_url, batch, production_status, inventory_status, status, serial_number, notes, created_at, exported_at, produced_at, connected_at, shipped_at, products(title)')
    .eq('batch', batchId)
    .order('created_at', { ascending: true });

  if (error || !codes || codes.length === 0) {
    return NextResponse.json({ error: 'Charge nicht gefunden' }, { status: 404 });
  }

  const headers = [
    'Code', 'QR_URL', 'Design', 'Charge',
    'Prod_Status', 'Inv_Status', 'Legacy_Status',
    'Seriennummer', 'Notizen',
    'Erstellt', 'Exportiert', 'Produziert', 'Verbunden', 'Versendet'
  ];

  const rows = codes.map(c => {
    const product = c.products as unknown as { title: string } | null;
    return [
      c.code,
      c.qr_url || '',
      product?.title || '',
      c.batch || batchId,
      c.production_status || '',
      c.inventory_status || '',
      c.status || '',
      c.serial_number || '',
      c.notes || '',
      c.created_at || '',
      c.exported_at || '',
      c.produced_at || '',
      c.connected_at || '',
      c.shipped_at || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const safeFilename = batchId.replace(/[^a-zA-Z0-9-_]/g, '_');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeFilename}.csv"`,
    },
  });
}
