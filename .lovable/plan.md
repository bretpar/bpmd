## Goal

Build a dynamic, admin-editable knowledge base where:
- You (admin only) can create/edit **exercises**, **injuries**, and **PT clinic locations**
- Visitors can browse/search injuries (e.g. "rotator cuff tear") and see linked exercises + nearby clinics
- Each injury page reads like a structured, dynamic blog post

## Data Model

```text
injuries
  id, slug, name, body_region, summary, overview (rich text),
  symptoms, causes, when_to_see_doctor, treatment_overview,
  cover_image_url, published, created_at, updated_at

exercises
  id, slug, name, description, instructions (rich text),
  difficulty (beginner/intermediate/advanced),
  body_region, video_url, image_url, published, created_at

injury_exercises  (join table — many-to-many)
  injury_id, exercise_id, sort_order, notes

pt_locations
  id, name, address, city, state, zip, phone, website,
  specialties (text[]), notes, lat, lng, created_at

user_roles
  id, user_id, role ('admin' | 'user')
  + has_role() security-definer function
```

All tables get RLS:
- **Public SELECT** on injuries/exercises (where `published = true`), `injury_exercises`, `pt_locations`
- **INSERT/UPDATE/DELETE** restricted to `has_role(auth.uid(), 'admin')`

## Authentication

- Email + password login (admin-only — no public signup needed for editing)
- `/auth` page for you to sign in
- After your account is created, run a one-time SQL insert to grant your `user_id` the `admin` role
- No profile data needed beyond roles

## Pages to Build

**Public:**
- `/injuries` — searchable/filterable list (by body region, name)
- `/injuries/:slug` — full injury page: overview, symptoms, causes, treatment, then a section listing the linked exercises (cards with image + link), plus a "Find PT near you" section pulling from `pt_locations`
- `/exercises/:slug` — standalone exercise detail page
- Update existing `/pt-locations` and `/pt-exercises` pages to fetch from the new tables (replaces hardcoded data)
- Add a search box on the home page → routes to `/injuries?q=...`

**Admin (gated by `has_role`):**
- `/admin` — dashboard with tabs: Injuries / Exercises / Locations
- CRUD forms for each entity
- On the injury edit form: multi-select to attach exercises (writes to `injury_exercises`)
- Markdown or simple rich-text for long-form fields

## Seed Data

Migrate the existing hardcoded PT exercises and clinic locations from `src/pages/PTExercises.tsx` and `src/pages/PTLocations.tsx` into the new tables so nothing is lost.

## Technical Notes

- Stack: Lovable Cloud (Postgres + Auth) + React Query for fetching
- Validation: zod schemas on all admin forms (length limits, required fields, slug format)
- Slugs auto-generated from name, editable
- Image uploads go to a Cloud storage bucket `media` (public read, admin write)
- Route guard component checks `has_role` before rendering `/admin/*`
- Header gets a conditional "Admin" link visible only when logged-in admin

## Out of Scope (can add later)

- Public user accounts / saved exercises
- Map view for clinics (just list + filter for now)
- Comments or reviews
- AI-generated injury content

## Build Order

1. Migration: create tables + RLS + `has_role` function + seed data
2. Auth page + admin role bootstrap instructions
3. Admin dashboard with CRUD for all three entities
4. Public injury list + detail pages
5. Wire updated PT Exercises/Locations pages to the database
6. Home page search box
