import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const db = createAdminClient();

  const { data: record } = await db
    .from('medallion_codes')
    .select('code, qr_url, batch, products(title)')
    .eq('code', code)
    .single();

  if (!record) {
    return NextResponse.json({ error: 'Code nicht gefunden' }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://memorize-liart.vercel.app';
  const url = record.qr_url || `${siteUrl}/m/${code}`;

  try {
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

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[SVG Generate]', err);
    return NextResponse.json({ error: 'SVG-Generierung fehlgeschlagen' }, { status: 500 });
  }
}
