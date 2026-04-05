import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { title, short_description, description, price_in_cents, usp, gallery_images, is_active, stripe_price_id } = body;

    const db = createAdminClient();
    const { data, error } = await db.from('products').update({
      title,
      short_description: short_description || null,
      description: description || null,
      price_in_cents,
      usp: usp || [],
      gallery_images: gallery_images || [],
      is_active: is_active ?? true,
      stripe_price_id: stripe_price_id || null,
    }).eq('id', params.id).select().single();

    if (error) {
      console.error('Product update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product: data });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const db = createAdminClient();
    const { error } = await db.from('products').delete().eq('id', params.id);

    if (error) {
      console.error('Product delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
