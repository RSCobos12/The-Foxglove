# The Foxglove Invitational

# Phase IV Backend Architecture

**Project Version:** v2.0.0  
**Current Phase:** IV — Tournament Operations  
**Status:** Approved Architecture  
**Owner:** Scott Cobos  
**Last Updated:** July 2026

---

# Objective

Establish one simple and secure backend structure for privileged Foxglove operations.

The backend must support the current website and Member Platform while remaining maintainable as tournament operations expand.

---

# Architecture Principles

1. Browser JavaScript handles normal user-facing interactions.
2. Supabase stores application and authentication data.
3. Row Level Security controls direct database access.
4. Supabase Edge Functions handle privileged operations.
5. Secret credentials must never be included in public website files.
6. Every database change must be documented in `docs/sql`.
7. Each Edge Function should perform one clear responsibility.
8. Prefer one stable implementation over multiple competing approaches.

---

# Current System

## Frontend

- HTML
- CSS
- JavaScript ES Modules

## Backend

- Supabase Authentication
- Supabase PostgreSQL
- Supabase Row Level Security
- Supabase Edge Functions

## Version Control

- Git
- GitHub

---

# Direct Database Operations

The authenticated browser may perform ordinary operations protected by Row Level Security.

Examples:

- Read the Player Directory
- Update member profile information
- Read current-season RSVP information
- Update current-season RSVP information
- Read public and member-facing tournament content

---

# Privileged Server Operations

Supabase Edge Functions must handle operations requiring elevated privileges or secret credentials.

Examples:

- Invite a new member
- Resend a member invitation
- Send a password-reset email
- Manage authentication accounts
- Send administrator notification emails

---

# Initial Edge Functions

## invite-member

Responsibilities:

- Verify the caller is an active administrator
- Validate first name, last name, email, and role
- Prevent duplicate authentication accounts and profiles
- Send the Supabase invitation email
- Create the member profile
- Set the member status to invited

---

## resend-member-invitation

Responsibilities:

- Verify the caller is an active administrator
- Confirm the member remains in invited status
- Send a replacement invitation
- Prevent duplicate profiles

---

## send-password-reset

Responsibilities:

- Verify the caller is an active administrator
- Send a secure password-reset email
- Never expose or assign a member password

---

## notify-admins

Responsibilities:

- Send administrator notifications for meaningful member actions
- Support RSVP, jacket, gallery, and account-related notifications
- Keep email credentials outside browser JavaScript

This function will be implemented after the underlying workflows are complete.

---

# Member Status Lifecycle

The Member Platform uses three account statuses:

- Invitation Pending
- Active
- Inactive

Database values:

- `invited`
- `active`
- `inactive`

Expected behavior:

| Event | Account Status | Access |
|---|---|---|
| Invitation sent | `invited` | Disabled |
| Invitation accepted | `active` | Enabled |
| Admin deactivates member | `inactive` | Disabled |
| Admin reactivates member | `active` | Enabled |

---

# Invitation Workflow

1. Administrator opens the Player Directory.
2. Administrator selects Invite Member.
3. Administrator enters first name, last name, email, and role.
4. The browser calls the `invite-member` Edge Function.
5. The function verifies administrator access.
6. The function checks for duplicate accounts.
7. Supabase sends the invitation email.
8. A profile record is created with invited status.
9. The member appears in the Player Directory as Invitation Pending.
10. The member accepts the invitation and creates a password.
11. The account becomes active.
12. The member may enter the Member’s Lounge.

Profile completion is optional after invitation acceptance.

---

# Security Rules

- The Supabase service-role key must never appear in frontend files.
- Edge Functions must verify the caller before privileged actions.
- Administrator status must be validated server-side.
- Frontend controls are not considered authorization.
- Duplicate account creation must be prevented.
- Errors returned to the browser must not expose sensitive information.
- Database policies remain the final protection for direct table access.

---

# Planned Function Order

1. `invite-member`
2. `resend-member-invitation`
3. `send-password-reset`
4. `notify-admins`

---

# Out of Scope

The following are intentionally excluded from this architecture pass:

- Live scoring
- Companion mobile application APIs
- Pairings
- Scorecard services
- Real-time leaderboard services

Those systems will be designed as separate future projects.

---

# Approved Direction

The Foxglove backend will use Supabase Edge Functions for privileged operations while retaining direct, Row-Level-Security-protected browser access for ordinary data workflows.

This architecture is approved as the stable implementation path for Phase IV.