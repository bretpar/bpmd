# Exercise Programs & Library Rebuild

## Overview

Replace the current flat exercise lists with a two-layer system: a reusable **Exercise Library** and diagnosis-based **Exercise Programs** made of ordered **Phases**. Admins build programs by dragging library exercises into phases and overriding sets/reps per-program. Patients see a guided, one-exercise-at-a-time workout with local progress tracking.

Existing `rehab_exercises` and related tables stay in place for now; new tables live alongside so nothing breaks. Existing condition pages get a new "Exercise Program" section that links to the guided view.

## Data Model (new tables)

```text
exercise_library
  id, slug, name, body_region, category (enum: mobility|stretching|strength|
    stability|balance|return_to_sport), difficulty (beginner|intermediate|advanced),
  equipment, image_url, video_url, short_description, instructions,
  default_sets, default_reps, default_hold_seconds, default_frequency,
  what_to_feel, common_mistakes, safety_notes, status (draft|published)

exercise_programs
  id, slug, name, body_region, condition, intro_text,
  estimated_duration, status (draft|published)

program_phases
  id, program_id, sort_order, title, goal, frequency,
  estimated_workout_minutes, approximate_duration,
  progression_criteria, warning_text

phase_exercises
  id, phase_id, exercise_id, sort_order,
  override_sets, override_reps, override_hold_seconds,
  override_duration, override_frequency, is_required
```

Condition pages: add nullable `exercise_program_id` (or slug reference) on the existing pathology/condition record so admins can attach one published program.

All tables: RLS — public SELECT on `published` rows; admin-only write via `has_role(auth.uid(),'admin')`. Grants for `anon`, `authenticated`, `service_role` as appropriate.

## Admin UI

**`/admin/exercise-library`**
- Table with search, filters (region, category, difficulty, status)
- Add / Edit / Duplicate / Preview / Publish
- "Used in N programs" column; delete blocked with warning if used

**`/admin/programs`**
- List programs; create/duplicate/publish
- **`/admin/programs/:id`** — Program Builder
  - Program metadata form
  - Ordered phase list (drag to reorder, duplicate, delete)
  - Per phase: metadata + ordered exercise list
  - "Add exercise" modal → searches Exercise Library → inserts into phase
  - Drag-and-drop exercise ordering (`@dnd-kit/sortable`, already common)
  - Inline overrides for sets/reps/hold/duration/frequency + required toggle
  - Preview patient view, Save Draft, Publish

Attach to condition: on existing condition/pathology admin form add a program picker.

## Patient UI

**`/programs/:slug`** — program overview
- Header: title, intro, current phase, estimated time, frequency, **Start Today's Workout**
- Accordion of phases (current expanded, others collapsed): title, goal, exercise count, time, frequency, progression criteria
- **Print Program** button → clean print stylesheet for the active phase

**`/programs/:slug/workout`** — guided runner
- One exercise card at a time: image/video, name, prescribed sets/reps/hold/duration, instructions, what to feel, common mistake, safety
- Mark Complete checkbox, Previous / Next
- Progress "2 of 4 completed"; completion screen at end
- Progress persisted in `localStorage` keyed by program+phase

## Condition Page Integration

On each condition page, replace the exercise list with a compact "Exercise Program" card:
- Program name, phase count, estimated workout time, current starting phase
- **View Exercise Program** button → `/programs/:slug`

If no program is attached, keep the existing exercise list as fallback.

## Build Order

1. Migration: new tables + RLS + grants + condition FK
2. Admin Exercise Library CRUD
3. Admin Program Builder (phases + drag-and-drop exercises + overrides)
4. Patient program overview + guided workout + print view
5. Wire condition pages to attached programs
6. Seed a couple of sample programs (Rotator Cuff Pain, Knee Pain) so the flow is testable

## Out of Scope (per request)

Patient accounts, clinician prescribing, messaging, server-side progress tracking, analytics dashboards.

## Notes

- Uses existing stack: Lovable Cloud, React Query, shadcn, `@dnd-kit` for drag-and-drop.
- Existing `rehab_exercises` / `ExerciseLibrary` pages remain untouched; new system is additive. We can migrate/retire the old data in a later pass once programs are populated.
- GA4 event `exercise_page_view` fires on the guided workout page; program start fires a new `program_start` event.
