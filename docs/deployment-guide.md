# The Foxglove Deployment Guide

Version 1.0

---

# Purpose

This document contains the complete deployment checklist required to recreate The Foxglove Version 1.0 environment.

---

# Technology Stack

Frontend
- HTML5
- CSS3
- Vanilla JavaScript

Backend
- Supabase

Authentication
- Supabase Auth

Database
- PostgreSQL (Supabase)

Storage
- Supabase Storage

Hosting
- GitHub Pages

---

# Required Environment Variables

SUPABASE_URL

SUPABASE_SECRET_KEYS

---

# Required Edge Functions

invite-member

delete-member

---

# Required Storage Buckets

gallery

champions-media

---

# Authentication Settings

- Email confirmation enabled
- Secure password change enabled
- Secure email change enabled
- Minimum password length: 12
- Leaked password protection enabled

---

# Required SQL Permissions

grant select, delete
on table public.profiles
to service_role;

grant select, update
on table public.rsvps
to service_role;

---

# Final Deployment Checklist

✓ Public website loads

✓ Member login works

✓ Admin login works

✓ Invite Member works

✓ Delete Member works

✓ Gallery uploads work

✓ Course Administration works

✓ Past Winners Administration works

✓ Edge Functions deployed

✓ GitHub Pages published

---

End of Deployment Guide