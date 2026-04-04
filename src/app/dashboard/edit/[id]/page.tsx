import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import BuilderClient from './BuilderClient';

export default async function EditMemorialPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch the specific memorial
  const { data: memorial, error } = await supabase
    .from('memorial_pages')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !memorial) {
    console.error(error);
    notFound();
  }

  // Ensure user owns this page
  if (memorial.user_id !== user.id) {
    redirect('/dashboard');
  }

  return <BuilderClient initialData={memorial} />;
}
