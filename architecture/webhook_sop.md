# Stripe Webhook Automation SOP

**Architecture Layer 1: System Determinism**

## The "Stock-Model" Logic Flow
The core differentiator of Nachklang CH is that physical medallions are pre-stocked and immediately assigned upon purchase, eliminating external production delay.

### 1. Trigger
- Event: `checkout.session.completed` from Stripe.
- Origin: A user purchasing the 49 CHF `STRIPE_PRICE_MEDALLION` product.

### 2. Payload Validation
- The incoming request must pass Stripe Signature Verification (`STRIPE_WEBHOOK_SECRET`).
- The payload must contain the specific `STRIPE_PRICE_MEDALLION` price_id in its line items to trigger the Medallion logic.

### 3. The Assignment Protocol (Fifo)
Once payment is verified:
1. Initialize the **Supabase Admin Client** (bypassing RLS).
2. Query the `medallion_codes` table to select ONE row where `status = 'available'`, ordered by `created_at` ASC (Oldest first).
3. If no row is returned → CRITICAL FAILURE: Stock is empty.
   - Fire Resend email alert `MEDALLION_STOCK_ALERT` to admin.
   - Throw a 500 Error to fail the webhook execution securely.
4. If a row is returned (e.g. `A7K3`), update it:
   - `status = 'assigned'`
   - `memorial_id = metadata.memorial_id` (from checkout session metadata)
   - `order_id = [generated medallion_orders row]`
   - `assigned_at = NOW()`
5. Complete: The user instantly sees 'Code A7K3' in their dashboard since the webhooks finished synchronously.
