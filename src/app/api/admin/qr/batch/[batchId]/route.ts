import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const batchId = decodeURIComponent(params.batchId);
  const db = createAdminClient();

  const { data: codes, error } = await db
    .from('medallion_codes')
    .select('id, code, qr_url, products(title)')
    .eq('batch', batchId)
    .order('created_at', { ascending: true });

  if (error || !codes || codes.length === 0) {
    return NextResponse.json({ error: 'Charge nicht gefunden oder leer' }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://memorize-liart.vercel.app';
  const zip = new JSZip();
  const now = new Date().toISOString();

  // Generate SVG for each code and add to ZIP
  const promises = codes.map(async (record) => {
    const code = record.code;
    const url = record.qr_url || `${siteUrl}/m/${code}`;

    const svg = await QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 4,
      width: 512,
    });

    const product = record.products as unknown as { title: string } | null;
    const designSlug = product?.title
      ? product.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      : 'medallion';
    const filename = `${designSlug}-${code}.svg`;

    zip.file(filename, svg);
  });

  await Promise.all(promises);

  // Add a manifest README
  const manifest = [
    `Charge: ${batchId}`,
    `Exportiert: ${now}`,
    `Anzahl Codes: ${codes.length}`,
    ``,
    `URL-Schema: ${siteUrl}/m/[CODE]`,
    ``,
    `Codes:`,
    ...codes.map(c => `  ${c.code}  →  ${siteUrl}/m/${c.code}`),
  ].join('\n');
  zip.file('_CHARGE_INFO.txt', manifest);

  // Mark all codes as exported in DB
  const ids = codes.map(c => c.id);
  await db
    .from('medallion_codes')
    .update({ production_status: 'exported', exported_at: now })
    .in('id', ids)
    .eq('production_status', 'generated'); // Only advance if still 'generated'

  const zipBuffer = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  const safeFilename = batchId.replace(/[^a-zA-Z0-9-_]/g, '_');

  return new NextResponse(zipBuffer.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${safeFilename}.zip"`,
      'Cache-Control': 'no-store',
    },
  });
}
