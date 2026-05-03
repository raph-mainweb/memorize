import GuestBuilderClient from './GuestBuilderClient';

// Kein Auth-Check, keine DB-Abfrage — der Gast-Builder startet komplett leer.
export default function GuestBuilderPage() {
  return <GuestBuilderClient />;
}
