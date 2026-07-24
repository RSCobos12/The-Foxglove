-- ==========================================================
-- The Foxglove Invitational
-- Phase IV — RSVP Profile Backfill
-- ==========================================================
--
-- Purpose
--
-- Populate profile_id on existing RSVP records by matching
-- RSVP email addresses to profile email addresses.
--
-- This migration is safe to run multiple times because it
-- only updates RSVP records whose profile_id is currently
-- NULL.
--
-- ==========================================================

update public.rsvps
set
    profile_id = profiles.id,
    updated_at = now()
from public.profiles
where lower(trim(rsvps.email))
    = lower(trim(profiles.email))
and rsvps.profile_id is null;

-- ==========================================================
-- Verification
-- ==========================================================

-- Run after the migration:
--
-- select count(*)
-- from public.rsvps
-- where profile_id is null;

-- ==========================================================
-- END OF FILE
-- ==========================================================