# Findings

## Research
- Read `Nachklang-CH-Projektübersicht-v3.docx` directly from extracted XML to bypass formatting issues.
- The platform stack is Next.js 14 App Router, Supabase, Tailwind, Stripe, Resend.

## Discoveries (The 5 Questions Answered)
1. **North Star**: Build a digital memorial platform (Nachklang CH) that connects to physical, pre-produced QR-code medallions stored in local stock.
2. **Integrations**: 
   - **Supabase**: Database, Authentication, Storage (Photos/Videos).
   - **Stripe**: Payments and Webhooks for the Stock-Model auto-assignment.
   - **Resend**: Transactional emails and admin stock alerts (below 10 items).
   - **Vercel**: Hosting and routing logic (`/m/[code]`).
3. **Source of Truth**: Supabase Postgres DB (`medallion_codes` table is the inventory ledger). Custom physical medallions with short codes.
4. **Delivery Payload**: Live accessible Next.js pages at `/gedenken/[slug]`. Physical medallions sent to customers via Swiss Post.
5. **Behavioral Rules (System Actions)**: 
   - "Stock-Model": Medallions are printed in advance and added to Supabase as `available`.
   - Medallions are matched to a Memorial ID *only* upon successful Stripe payment via webhook. 
   - Prevent frontend users from selecting code freely.

## Constraints
- **Performance**: High margin depends on not producing items externally per user. Wait times reduced to 1-2 days using local stock.
- **Routing**: Fixed short code QR (`/m/A7K3`) MUST seamlessly redirect or display a pristine "not active" state.
