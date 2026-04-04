# QR Redirection Engine SOP

**Architecture Layer 1: Core Navigation**

## Purpose
The route `/m/[code]` operates entirely as an invisible backend redirect switchboard. Since the physical medallions are engraved with `nachklang.ch/m/[code]`, this endpoint guarantees that end-users scanning a non-activated medallion cannot guess or view an unassigned memorial page.

## Logic Flow

1. **Request Received**: User navigates to `/m/A7K3`.
2. **Admin Lookup**: The dynamic route handler (`src/app/m/[code]/route.ts`) launches the Supabase Admin Client.
3. **Database Evaluation**:
   - `SELECT status, memorial_id FROM medallion_codes WHERE code = 'A7K3'`
4. **Routing Output**:
   - Condition A: `status == 'available'` (Or no row exists)
     → Action: `redirect('/m/nicht-aktiviert')`
     → Purpose: Ensure viewers of unsold medallions just see an informational page.
   - Condition B: `status IN ('assigned', 'shipped', 'delivered')`
     → Sub-Query: Join `memorial_pages(slug)` using the linked `memorial_id`.
     → Action: `redirect('/gedenken/' + slug)`
     → Purpose: Visitors arrive transparently on the designated Memorial page instantly.

## Edge Cases
- Invalid Code Formats: If `code` isn't an exact 4-character match, immediately force a 404 or redirect to the root landing page to prevent unnecessary DB queries.
