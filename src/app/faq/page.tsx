import { redirect } from 'next/navigation';
const WP = process.env.WP_URL || 'https://memorize.mainwebsite.ch';
export default function FaqPage() { redirect(`${WP}/faq`); }
