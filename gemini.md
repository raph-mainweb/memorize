# Project Constitution

## Data Schemas
**Input/Output Shapes & Supabase Database Models:**

```json
{
  "memorial_pages": {
    "id": "UUID",
    "user_id": "UUID",
    "slug": "TEXT",
    "name": "TEXT",
    "type": "TEXT (human | pet)",
    "is_live": "BOOLEAN"
  },
  "medallion_codes": {
    "id": "UUID",
    "code": "TEXT UNIQUE",
    "status": "TEXT (available | assigned | shipped | delivered)",
    "memorial_id": "UUID ?NULL",
    "order_id": "UUID ?NULL",
    "assigned_at": "TIMESTAMPTZ ?NULL",
    "shipped_at": "TIMESTAMPTZ ?NULL",
    "batch": "TEXT ?NULL",
    "created_at": "TIMESTAMPTZ"
  },
  "medallion_orders": {
    "id": "UUID",
    "user_id": "UUID",
    "medallion_code_id": "UUID",
    "shipping_address": "TEXT",
    "tracking_number": "TEXT ?NULL"
  }
}
```

## Behavioral Rules
1. **The Stock-Model (Strict Assignment):** Pre-engraved medallion short codes (e.g., A7K3) sit in the DB as `available`. They are NEVER assigned via the frontend. They are ONLY assigned automatically via the Stripe Webhook upon successful purchase of the 49 CHF product tier.
2. **Scan Logic:** The redirect endpoint (`/m/[code]`) must evaluate the `status`. If `available`, redirect to an "inactive" warning. If `assigned/shipped/delivered`, redirect to the associated `/gedenken/[slug]`.
3. **Admin Warning Threshold:** If `medallion_codes` available inventory drops below 10, the system must trigger an email alert so that a new Chinese bulk order can be placed.
4. **Tone & Experience:** Solemn, elegant, and frictionless. Users must be able to create a preview memorial entirely for free without entering a credit card.

## Architectural Invariants
- **Layer 1: Architecture:** Technical SOPs hold Stripe Webhook Logic and Database Row Level Security rules.
- **Layer 2: Tools:** Background script (`/tools`) loads new stock batches into the DB.
- **Stack:** Next.js 14 App Router (React), Supabase (Auth, Postgres, Storage), Stripe (Payments/Webhooks), Resend (Emails).

## Maintenance Log
*(Empty)*
