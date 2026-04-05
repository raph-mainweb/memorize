import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

export default async function OrdersPage() {
  const supabase = createAdminClient();
  
  const { data: pendingOrders } = await supabase
    .from('medallion_orders')
    .select('*, profiles(email), products(title), memorial_pages(slug, name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const { data: completedOrders } = await supabase
    .from('medallion_orders')
    .select('*, profiles(email)')
    .neq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50);

  async function fulfillOrder(formData: FormData) {
    'use server'
    const orderId = formData.get('order_id') as string;
    const memorialId = formData.get('memorial_id') as string;
    const codeRaw = (formData.get('code') as string).trim();

    if (!codeRaw) return;

    const db = createAdminClient();
    
    // 1. Find the code
    const { data: codeData } = await db.from('medallion_codes').select('id, status').eq('code', codeRaw).single();
    
    if (!codeData) {
      console.error('Code not found:', codeRaw);
      return; 
    }
    
    if (codeData.status !== 'available') {
      console.error('Code is already assigned or shipped:', codeRaw);
      return;
    }

    // 2. Assign Code to Memorial, Order, and change status
    await db.from('medallion_codes').update({
       status: 'assigned',
       memorial_id: memorialId || null,
       order_id: orderId,
       assigned_at: new Date().toISOString()
    }).eq('id', codeData.id);

    // 3. Mark Order as complete
    await db.from('medallion_orders').update({
       status: 'shipped'
    }).eq('id', orderId);

    revalidatePath('/admin/orders');
  }

  return (
    <div className="p-8 md:p-12">
      <header className="mb-12">
        <h1 className="text-4xl font-serif text-slate-900">Versand & Fulfillment</h1>
        <p className="text-slate-500 mt-2">Physische Medaillons scannen und an Kunden versenden.</p>
      </header>

      <div className="mb-12">
         <h2 className="text-xl font-serif text-slate-800 mb-6">Offene Bestellungen ({pendingOrders?.length || 0})</h2>
         <div className="grid gap-6">
           {pendingOrders?.map(order => (
             <div key={order.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 lg:flex items-center justify-between">
                <div className="mb-4 lg:mb-0">
                   <p className="text-sm font-bold text-slate-800">Bestellung: {order.id.split('-')[0]} &mdash; {(order as any).products?.title || 'Generisches Medaillon'}</p>
                   <p className="text-sm text-slate-500 mt-1">Kunde: {(order as any).profiles?.email || order.user_id}</p>
                   <p className="text-sm text-slate-500 mt-1">Für Gedenkseite: {(order as any).memorial_pages?.name || 'Keine Seite verknüpft'}</p>
                   <div className="mt-4 p-4 bg-stone-50 rounded-xl text-sm whitespace-pre-wrap font-mono text-slate-700">
                      {order.shipping_address?.replace(/\\n/g, '\n').replace(/"/g, '')}
                   </div>
                </div>
                
                <form action={fulfillOrder} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                   <input type="hidden" name="order_id" value={order.id} />
                   <input type="hidden" name="memorial_id" value={order.memorial_id || ''} />
                   
                   <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Medaillon scannen / tippen</label>
                   <div className="flex gap-2">
                     <input 
                       name="code" 
                       required 
                       placeholder="z.B. A1B2" 
                       className="px-4 py-2 w-32 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:border-sage-500 uppercase" 
                     />
                     <button type="submit" className="bg-sage-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sage-700 transition">Verknüpfen & Versenden</button>
                   </div>
                </form>
             </div>
           ))}
           {(!pendingOrders || pendingOrders.length === 0) && (
             <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl">Keine offenen Bestellungen.</div>
           )}
         </div>
      </div>
    </div>
  );
}
