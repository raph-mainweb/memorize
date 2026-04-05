import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('product_id') as string;

    if (!file) {
      return NextResponse.json({ error: 'Kein Bild vorhanden.' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `products/${productId || 'temp'}/${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const db = createAdminClient();
    const { data, error } = await db.storage
      .from('memorial-media') // reuse existing bucket
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = db.storage
      .from('memorial-media')
      .getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('Image upload error:', err);
    return NextResponse.json({ error: 'Upload fehlgeschlagen.' }, { status: 500 });
  }
}
