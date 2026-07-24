# The Foxglove Invitational

# SQL Migration Library

**Project Version:** 1.0  
**Owner:** Scott Cobos  
**Last Updated:** July 2026

---

# Purpose

This folder contains all SQL migration files used by The Foxglove Invitational.

These files document database changes made during development so the database can be recreated, audited, or migrated in a consistent manner.

Whenever possible, database changes should be implemented through a documented migration stored in this folder rather than making undocumented changes directly within Supabase.

---

# Migration Philosophy

- Every structural database change should have its own migration.
- Each migration should perform one logical task.
- Migrations should be safe to execute whenever practical.
- Never delete historical migration files.
- New changes should always be added as new migration files.

---

# Current Migrations

## Phase IV

### phase-iv-player-directory-security.sql

Purpose

- Grants administrators permission to update player profiles.
- Creates Row Level Security (RLS) policies for administrator profile editing.

Status

- Permanent migration
- Execute once

---

### phase-iv-rsvp-profile-backfill.sql

Purpose

- Links existing RSVP records to member profiles using `profile_id`.
- Converts legacy email-based RSVP relationships to permanent profile relationships.

Status

- One-time data migration
- Safe to execute multiple times

---

### phase-iv-rsvp-unique-constraint.sql

Purpose

- Enforces one RSVP per member per tournament.
- Adds a unique constraint on:

```
(tournament_id, profile_id)
```

Status

- Permanent migration
- Execute once

---

### phase-iv-rsvp-admin-security.sql

Purpose

- Grants administrators permission to insert and update RSVP records.
- Creates Row Level Security (RLS) policies for RSVP administration.

Status

- Permanent migration
- Execute once

---

# Recommended Execution Order

For a brand-new database:

1. Player Directory Security
2. RSVP Admin Security
3. RSVP Unique Constraint
4. RSVP Profile Backfill (only if importing legacy RSVP data)

---

# Future Migrations

Additional SQL migration files should be added here as new backend functionality is developed.

Examples include:

- Tournament Management
- Scorecards
- Member Invitations
- Password Reset Workflows
- Jacket Orders
- Tournament History
- Companion App Support

---

# Notes

The SQL migrations in this folder are considered part of the Foxglove source code and should always be committed to GitHub alongside the corresponding application changes.

Do not modify historical migration files after they have been executed against production databases. Instead, create a new migration that builds upon previous work.