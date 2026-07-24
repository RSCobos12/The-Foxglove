/*
==========================================================
The Foxglove Invitational
Phase IV — Player Directory Security Migration
==========================================================

Version: 1.0
Status: Draft
Author: Scott Cobos
Last Updated: July 2026

Purpose

This migration establishes the database security
required for the Player Directory introduced during
Phase IV.

Objectives

• Allow administrators to update player profiles.
• Preserve least-privilege access.
• Keep member accounts restricted to their own data.
• Support future invitation and account-management
  workflows.

Execution Order

1. Review SQL
2. Execute in Supabase SQL Editor
3. Verify permissions
4. Commit to GitHub
*/

-- ==========================================================
-- SECTION 1
-- Table Privileges
-- ==========================================================

grant usage on schema public
to authenticated;

grant update on table public.profiles
to authenticated;

-- ==========================================================
-- SECTION 2
-- Row Level Security Policies
-- ==========================================================

drop policy if exists
"Admins can update all profiles"
on public.profiles;

create policy
"Admins can update all profiles"
on public.profiles
for update
to authenticated
using (
  (select is_admin())
)
with check (
  (select is_admin())
);

-- ==========================================================
-- SECTION 3
-- Verification
-- ==========================================================



-- ==========================================================
-- END OF FILE
-- ==========================================================