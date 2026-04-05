import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, short_description, description, price_in_cents, usp, gallery_images, is_active, stripe_price_id } = body;

    if (!title || price_in_cents === undefined) {
      return NextResponse.json({ error: 'Titel und Preis sind Pflichtfelder.' }, { status: 400 });
    }

    const db = createAdminClient();
    const { data, error } = await db.from('products').insert({
      title,
      short_description: short_description || null,
      description: description || null,
      price_in_cents,
      usp: usp || [],
      gallery_images: gallery_images || [],
      is_active: is_active ?? true,
      stripe_price_id: stripe_price_id || null,
    }).select().single();

    if (error) {
      console.error('Product insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
