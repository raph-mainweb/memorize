# Task Plan

## Phases
1. **Blueprint**: Define structure, data schemas, rules. (In Progress)
2. **Link**: Initialize Next.js project, connect Supabase, configure Stripe credentials, setup Resend keys.
3. **Architect**: Map out Layer 1 SOPs (Webhooks, RLS policies), build data schema in DB.
4. **Stylize**: Develop landing page, dashboard UI, and free memorial page wizard.
5. **Trigger**: Deploy to Vercel, setup Stripe Webhook listener, write script to load initial 100 codes into `medallion_codes`.

## Goals
- Launch `nachklang.ch` with free preview builder.
- Implement 19 CHF unlock and 4/7 CHF recurring subscriptions.
- Execute the physical Stock-Model logic with Stripe and 49 CHF tier.

## Checklists
- [x] Phase 1: Blueprint (Project context loaded & schemas defined)
- [x] Phase 2: Link (API Keys configured, Stripe products auto-generated, Handshake verified)
- [ ] Phase 3: Architect (Database Init & Webhook architecture)
- [ ] Phase 4: Stylize (Frontend & Next.js App Router setup)
- [ ] Phase 5: Trigger (Vercel deployment)
