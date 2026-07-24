-- ==========================================================
-- The Foxglove Invitational
-- Phase IV — RSVP Admin Security
-- ==========================================================
--
-- Purpose
--
-- Allow authenticated administrators to create and update
-- RSVP records through the Player Directory.
--
-- ==========================================================

grant usage on schema public
to authenticated;

grant insert, update on table public.rsvps
to authenticated;

-- ==========================================================
-- Admin INSERT Policy
-- ==========================================================

drop policy if exists
"Admins can insert RSVP records"
on public.rsvps;

create policy
"Admins can insert RSVP records"
on public.rsvps
for insert
to authenticated
with check (
  (select is_admin())
);

-- ==========================================================
-- Admin UPDATE Policy
-- ==========================================================

drop policy if exists
"Admins can update RSVP records"
on public.rsvps;

create policy
"Admins can update RSVP records"
on public.rsvps
for update
to authenticated
using (
  (select is_admin())
)
with check (
  (select is_admin())
);

-- ==========================================================
-- END OF FILE
-- ==========================================================