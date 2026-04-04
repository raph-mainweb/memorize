import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendStockAlertEmail(currentStock: number) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: adminEmail,
      subject: `🚨 ACHTUNG: Nachklang.ch Medaillon-Stock Kritisch (${currentStock} Stk.)`,
      html: `<p>Der Bestand an verfügbaren QR-Medaillons ist unter die Warn-Grenze gefallen.</p>
             <p>Aktueller Bestand: <strong>${currentStock}</strong> Stück.</p>
             <p>Bitte bestelle umgehend einen neuen Batch beim China-Lieferanten und trage ihn über das Admin-Panel ein.</p>`,
    });
  } catch (err) {
    console.error('[Resend Error] Action failed:', err);
  }
}
