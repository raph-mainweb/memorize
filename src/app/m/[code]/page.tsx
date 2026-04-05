import { createAdminClient } from '@/utils/supabase/admin';
import { redirect, notFound } from 'next/navigation';

// QR-Code Scan Redirect
// /m/[code] is the permanent URL on every physical medallion.
// The target memorial page is controlled in the database — never baked into the QR.

export default async function MedaillonRedirect({ params }: { params: { code: string } }) {
  const db = createAdminClient();

  // Fetch code record — try fallback to memorial_id for legacy records
  const { data: record } = await db
    .from('medallion_codes')
    .select('id, code, status, inventory_status, memorial_id, assigned_page_id')
    .eq('code', params.code.toUpperCase())
    .single();

  // Code not in system → 404
  if (!record) {
    notFound();
  }

  // Determine which page_id to look up (new field takes precedence over legacy)
  const pageId = (record as { assigned_page_id?: string | null; memorial_id?: string | null }).assigned_page_id
    || (record as { memorial_id?: string | null }).memorial_id;

  // No page linked → show inactive screen
  if (!pageId) {
    return <InactiveScreen code={params.code.toUpperCase()} />;
  }

  // Fetch the linked memorial page
  const { data: memorial } = await db
    .from('memorial_pages')
    .select('slug, is_live, name')
    .eq('id', pageId)
    .single();

  // Memorial deleted or not found → show inactive screen
  if (!memorial) {
    return <InactiveScreen code={params.code.toUpperCase()} />;
  }

  // Memorial exists but not yet public
  if (!memorial.is_live) {
    return <NotPublicScreen name={memorial.name} />;
  }

  // All good — redirect to public memorial
  redirect(`/gedenken/${memorial.slug}`);
}

function InactiveScreen({ code }: { code: string }) {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="font-serif text-3xl text-slate-900 mb-3">Medaillon noch nicht aktiviert</h1>
        <p className="text-slate-500 font-light leading-relaxed mb-6">
          Dieses Medaillon <span className="font-mono text-slate-700">({code})</span> wurde noch keiner
          Gedenkseite zugewiesen. Wenn du der Besitzer bist, verbinde es im Nachklang-Dashboard.
        </p>
        <a
          href="/dashboard"
          className="inline-block bg-slate-900 text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-slate-800 transition"
        >
          Zum Dashboard
        </a>
      </div>
    </div>
  );
}

function NotPublicScreen({ name }: { name: string }) {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h1 className="font-serif text-3xl text-slate-900 mb-3">Noch nicht veröffentlicht</h1>
        <p className="text-slate-500 font-light leading-relaxed">
          Die Gedenkseite für <strong className="text-slate-700">{name}</strong> ist noch nicht öffentlich zugänglich. Bitte später erneut versuchen.
        </p>
      </div>
    </div>
  );
}
