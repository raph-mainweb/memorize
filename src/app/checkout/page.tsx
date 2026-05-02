/**
 * /checkout — Server Component
 * Prüft Login-Status, lädt Profil-Daten, rendert CheckoutForm (Client)
 */

import { createClient } from '@/utils/supabase/server';
import CheckoutForm from './CheckoutForm';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { cart?: string };
}) {
  const cartParam = searchParams.cart || '';

  // Check if user is logged in and fetch profile
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, address_line1, address_line2, postal_code, city, country, phone')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <CheckoutForm
      cartParam={cartParam}
      user={user ? { id: user.id, email: user.email || '' } : null}
      profile={profile}
    />
  );
}
