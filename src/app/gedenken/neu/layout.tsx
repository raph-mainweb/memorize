/**
 * /gedenken/neu — Gast-Layout
 * Kein Auth-Gate. Kein Dashboard-Sidebar.
 * Schlankes Wrapper-Layout — der Builder bringt seine eigene Sidebar.
 */
export default function GuestBuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
