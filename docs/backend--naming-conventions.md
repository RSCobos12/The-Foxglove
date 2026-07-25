# The Foxglove Invitational

# Backend Naming Conventions

**Project Version:** v2.0.0  
**Status:** Approved Standard  
**Owner:** Scott Cobos  
**Last Updated:** July 2026

---

# Purpose

This document defines the naming conventions used throughout The Foxglove backend.

Consistent naming improves readability, maintainability, and long-term scalability.

These conventions apply to database objects, SQL migrations, Edge Functions, APIs, and backend documentation.

---

# General Principles

- Prefer descriptive names over abbreviations.
- Use lowercase whenever practical.
- Use hyphens for Edge Functions.
- Use snake_case for SQL objects.
- Give every backend component one clear responsibility.
- Avoid generic names.

---

# Edge Functions

## Naming Style

```
verb-noun
```

Examples:

```
invite-member
resend-invitation
send-password-reset
deactivate-member
publish-results
close-rsvp
```

Avoid:

```
member
admin
utilities
functions
process-data
```

Each Edge Function should perform one clearly defined operation.

---

# SQL Migrations

## Naming Style

```
phase-iv-description.sql
```

Examples:

```
phase-iv-player-directory-security.sql
phase-iv-rsvp-admin-security.sql
phase-iv-rsvp-profile-backfill.sql
phase-iv-rsvp-unique-constraint.sql
```

Guidelines:

- One logical change per migration.
- Never modify historical migrations.
- Create a new migration for every structural change.

---

# Database Tables

Use plural snake_case.

Examples:

```
profiles
rsvps
tournaments
gallery_images
past_winners
```

Avoid:

```
Profile
GalleryPhotos
tblProfiles
```

---

# Database Columns

Use lowercase snake_case.

Examples:

```
first_name
last_name
account_status
attendance_status
created_at
updated_at
```

Boolean columns should read naturally.

Examples:

```
is_admin
is_active
is_public
```

---

# Row Level Security Policies

Policy names should clearly describe the permission being granted.

Examples:

```
Admins can update profiles
Admins can insert RSVP records
Users can read their own profile
```

Avoid vague names such as:

```
Policy1
UpdatePolicy
AdminAccess
```

---

# JavaScript

Variables:

```
camelCase
```

Examples:

```
currentEditingProfile
memberEditorInitialState
activeTournament
```

Constants:

```
UPPER_SNAKE_CASE
```

Examples:

```
MAX_UPLOAD_SIZE
DEFAULT_SEASON
```

---

# CSS

Classes:

```
kebab-case
```

Examples:

```
member-editor-panel
admin-status-message
player-directory-table
```

Modifier classes:

```
is-active
is-error
is-success
is-disabled
```

---

# Documentation

Markdown files:

```
lowercase-with-hyphens.md
```

Examples:

```
master-project-roadmap.md
homepage-style-guide.md
backend-naming-conventions.md
```

---

# Git Commits

Commit messages should describe completed work.

Preferred:

```
Complete Phase IV-A Player Directory management system

Add RSVP administration

Implement member invitation workflow
```

Avoid:

```
update

changes

fix

stuff
```

---

# Backend Philosophy

The Foxglove backend follows one guiding principle:

> Every function, migration, policy, and document should have one clear responsibility.

Small, focused backend components are easier to understand, test, secure, document, and maintain.

This convention should be followed throughout the lifetime of the project.