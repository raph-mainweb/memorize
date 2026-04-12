import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const { primary, secondary, navy } = await req.json();

    // Basic hex validation
    const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    if ((primary && !hexRegex.test(primary)) ||
        (secondary && !hexRegex.test(secondary)) ||
        (navy && !hexRegex.test(navy))) {
      return NextResponse.json({ error: 'Ungültige Hex-Farbe.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const valuePayload = {
      primary:   primary   || '#968cb5',
      secondary: secondary || '#eae6f4',
      navy:      navy      || '#1e2b5e',
    };

    const { error } = await supabase
      .from('system_settings')
      .upsert({ key: 'brand_colors', value: valuePayload }, { onConflict: 'key' });

    // INVALIDATE CACHE across the entire application layout
    revalidatePath('/', 'layout');

    return NextResponse.json({ ok: true, colors: valuePayload });
  } catch (err) {
    console.error('[brand-colors] Error:', err);
    return NextResponse.json({ error: 'Fehler beim Speichern.' }, { status: 500 });
  }
}
