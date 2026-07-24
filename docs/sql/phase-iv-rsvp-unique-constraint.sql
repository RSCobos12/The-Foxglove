-- ==========================================================
-- The Foxglove Invitational
-- Phase IV — RSVP Unique Constraint
-- ==========================================================
--
-- Purpose
--
-- Enforce the business rule that each member may have only
-- one RSVP record per tournament.
--
-- This constraint also allows Supabase upserts to target the
-- combination of tournament_id and profile_id.
--
-- ==========================================================

alter table public.rsvps
drop constraint if exists
rsvps_tournament_profile_unique;

alter table public.rsvps
add constraint
rsvps_tournament_profile_unique
unique (
  tournament_id,
  profile_id
);

-- ==========================================================
-- Verification
-- ==========================================================
--
-- select
--   constraint_name
-- from information_schema.table_constraints
-- where table_schema = 'public'
-- and table_name = 'rsvps'
-- and constraint_name =
--   'rsvps_tournament_profile_unique';
--
-- ==========================================================
-- END OF FILE
-- ==========================================================