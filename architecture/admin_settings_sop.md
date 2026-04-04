# Admin Settings SOP
**Layer 1 Architecture - Admin Settings & Stripe Configuration**

## Purpose
The `/admin/settings` page acts as the central interface for platform administrators to manage environment variables, webhook configurations, and specific dynamically linked external resources, primarily **Stripe Products and Prices**.

## Core Functions
1. **Stripe Product Mapping**:
   - Provide visual confirmation of the currently configured product/price IDs inside `.env` (or via a DB settings table if moved off `.env` in the future).
   - Display current details fetched from Stripe (Name, Price, Status).
   - Provide a button to "Re-sync" or "Update" Price IDs if new products are created manually in Stripe.

2. **System Configurations**:
   - Medallion Stock alert threshold (e.g. `MEDALLION_STOCK_ALERT=10`).
   - Resend admin email mapping (`ADMIN_EMAIL`).

## Data Flow (Stripe Sync)
- **Input**: Admin clicks "Sync with Stripe".
- **Process**:
  1. The Next.js backend (using Stripe Secret Key) requests all active products & prices.
  2. Products matching the required tiers (`19 CHF`, `4 CHF`, `7 CHF`, `49 CHF`) are filtered.
  3. The administrator confirms mapping.
  4. The platform saves the `price_id` to the settings state.

## Security Constraints
- **RLS / Middleware**: This route is strictly guarded by Supabase Auth `service_role` verification or an admin flag boolean on `users`.
- Display masked versions of actual secret keys (`sk_test_****1234`). Only non-sensitive parameters like `price_id` are fully modifiable via UI.
