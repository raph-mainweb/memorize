import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET() {
  const db = createAdminClient();
  const { data: products } = await db
    .from('products')
    .select('id, title, short_description, price_in_cents, gallery_images')
    .eq('is_active', true)
    .order('price_in_cents', { ascending: true });

  return NextResponse.json({ products: products || [] });
}
