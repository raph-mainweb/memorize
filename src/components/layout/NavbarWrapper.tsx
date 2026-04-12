import { createAdminClient } from '@/utils/supabase/admin';
import Navbar from './Navbar';

// Server Component: fetches logo settings from DB, passes to client Navbar
export default async function NavbarWrapper() {
  let logoUrl: string | null = null;
  let logoText: string | null = null;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'brand_logo')
      .maybeSingle();

    if (data?.value) {
      logoUrl  = data.value.url   || null;
      logoText = data.value.text  || null;
    }
  } catch {
    // Graceful fallback — show text logo if DB unreachable
  }

  return <Navbar logoUrl={logoUrl} logoText={logoText} />;
}
