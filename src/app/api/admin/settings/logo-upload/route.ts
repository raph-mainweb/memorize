import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei übergeben.' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Ungültiger Dateityp. Erlaubt: SVG, PNG, JPG, WebP.' }, { status: 400 });
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Datei zu gross. Maximum: 2 MB.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `logo.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage (bucket: brand-assets)
    const { error: uploadError } = await supabase.storage
      .from('brand-assets')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,        // overwrite existing logo
      });

    if (uploadError) {
      console.error('[logo-upload] Storage error:', uploadError);
      return NextResponse.json({ error: `Storage-Fehler: ${uploadError.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(fileName);

    // Cache-bust: append timestamp
    const urlWithBust = `${publicUrl}?v=${Date.now()}`;

    // Update system_settings
    const valuePayload = { url: urlWithBust, text: 'Nachklang' };
    const { error: dbError } = await supabase
      .from('system_settings')
      .update({ value: valuePayload })
      .eq('key', 'brand_logo');

    if (dbError) {
      // Try insert if update found nothing
      await supabase.from('system_settings').insert({ key: 'brand_logo', value: valuePayload });
    }

    return NextResponse.json({ url: urlWithBust });
  } catch (err) {
    console.error('[logo-upload] Unexpected error:', err);
    return NextResponse.json({ error: 'Unbekannter Fehler beim Upload.' }, { status: 500 });
  }
}
