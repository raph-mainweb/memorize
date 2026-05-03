'use server';

import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createProduct(formData: FormData) {
  const db = createAdminClient();

  const title = formData.get('title') as string;
  const priceRaw = Number(formData.get('price'));
  const price_in_cents = Math.round(priceRaw * 100);
  const short_description = formData.get('short_description') as string;
  const description = formData.get('description') as string;
  const usp_raw = formData.get('usp_json') as string;
  const gallery_raw = formData.get('gallery_json') as string;
  const is_active = formData.get('is_active') === 'on';
  const stripe_price_id = formData.get('stripe_price_id') as string;
  const wp_url = formData.get('wp_url') as string;

  let usp: string[] = [];
  let gallery_images: string[] = [];

  try { usp = JSON.parse(usp_raw || '[]'); } catch { usp = []; }
  try { gallery_images = JSON.parse(gallery_raw || '[]'); } catch { gallery_images = []; }

  const { data, error } = await db.from('products').insert({
    title,
    short_description: short_description || null,
    description: description || null,
    price_in_cents,
    usp,
    gallery_images,
    is_active,
    stripe_price_id: stripe_price_id || null,
    wp_url: wp_url || null,
  }).select('id').single();

  if (error) {
    console.error('[createProduct] Error:', error);
    throw new Error(error.message);
  }

  revalidatePath('/admin/products');
  redirect(`/admin/products/${data.id}`);
}

export async function updateProduct(id: string, formData: FormData) {
  const db = createAdminClient();

  const title = formData.get('title') as string;
  const priceRaw = Number(formData.get('price'));
  const price_in_cents = Math.round(priceRaw * 100);
  const short_description = formData.get('short_description') as string;
  const description = formData.get('description') as string;
  const usp_raw = formData.get('usp_json') as string;
  const gallery_raw = formData.get('gallery_json') as string;
  const is_active = formData.get('is_active') === 'on';
  const stripe_price_id = formData.get('stripe_price_id') as string;
  const wp_url = formData.get('wp_url') as string;

  let usp: string[] = [];
  let gallery_images: string[] = [];

  try { usp = JSON.parse(usp_raw || '[]'); } catch { usp = []; }
  try { gallery_images = JSON.parse(gallery_raw || '[]'); } catch { gallery_images = []; }

  const { error } = await db.from('products').update({
    title,
    short_description: short_description || null,
    description: description || null,
    price_in_cents,
    usp,
    gallery_images,
    is_active,
    stripe_price_id: stripe_price_id || null,
    wp_url: wp_url || null,
  }).eq('id', id);

  if (error) {
    console.error('[updateProduct] Error:', error);
    throw new Error(error.message);
  }

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}`);
  redirect(`/admin/products/${id}?saved=true`);
}

export async function deleteProduct(id: string) {
  const db = createAdminClient();
  const { error } = await db.from('products').delete().eq('id', id);

  if (error) {
    console.error('[deleteProduct] Error:', error);
    throw new Error(error.message);
  }

  revalidatePath('/admin/products');
  redirect('/admin/products');
}
