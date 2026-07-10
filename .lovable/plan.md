## Goal

Reframe the exercise system around the **diagnosis (pathology)** so patients see "where to start" and "everything available", and admins manage both from a single diagnosis editor. Preserve the existing database, Exercise Library, and Recovery Programs — this is a UX pass, not a rebuild.

## Patient — Diagnosis page (`/exercise-library/region/:slug/pathology/:pathologySlug`)

Replace the current "program CTA card OR flat exercise list" with two clearly labeled sections.

### 1. Recommended Recovery Program
- Shown only if a program is linked to this pathology.
- Card header: **"Recommended Recovery Program"** + tagline: *"These exercises are presented in the order patients typically progress through rehabilitation."*
- Renders each `program_phases` row as a collapsible accordion:
  - Collapsed: `Phase N – <title>` and the list of exercise **names** only.
  - Expanded: full exercise cards (image, description, badges, View Details modal — reusing the existing `ExerciseCard` visuals).
- Removes/hides on this page: guided workout mode, Start Today's Workout button, phase status badges (Start / Current / Completed / Next), phase progression panel, pain/safety accordion, `localStorage` progress, checkboxes, progress bars, Previous/Next navigation. The existing `/programs/:slug` and `/workout` routes and code stay in place (unused from this page, still linkable) so nothing is deleted.

### 2. All Exercises
- Below the program section, always visible.
- Uses the pathology's rehab exercises (current `rehab_exercises` list) grouped into simple categories derived from the existing `rehab_phase` field:
  - Mobility (`early_rehab`), Stretching, Strengthening (`strengthening`), Advanced/Return to Sport (`return_to_activity`), Maintenance.
  - Uses category from `exercise_library.category` when the exercise is a library entry; falls back to `rehab_phase` bucket for legacy rehab exercises. A single mapping helper keeps this readable.
- Simple section headers + existing `ExerciseCard` grid. No new card design.

`SafetyNote` stays at the bottom. Search / General exercises / region pages are unchanged.

## Admin — Diagnosis editor

Currently pathologies are edited implicitly through Exercise Library Admin and program linking is done in the program builder. We will:

1. Add a lightweight **Diagnosis editor** page at `/admin/diagnoses/:id` (route + link from Admin dashboard and from `AdminPrograms`). It edits an existing `pathologies` row — no schema changes.
2. The editor has three panels:
   - **Details** (read-only for now): pathology name, body region.
   - **Recommended Recovery Program**: pick an existing program (`pathologies.exercise_program_id`) OR create one inline. Then inline phase editor with Phase 1–4 columns (reuses the existing `program_phases` + `phase_exercises` tables and the drag-and-drop `SortableRow` component already used in `AdminProgramBuilder`). Each row supports optional sets/reps overrides via the existing `phase_exercises.override_*` columns.
   - **Additional Exercises**: multi-select from `rehab_exercises` (and/or `exercise_library`) to surface under All Exercises even when not in a phase. Stored via the existing `rehab_exercise_pathologies` join table — no new tables.
3. The current `AdminProgramBuilder`, `AdminProgramWizard`, `AdminProgramTemplates`, `AdminExerciseLibrary` pages remain reachable and untouched — the diagnosis editor is an additional, simpler entry point.

## Preserved (nothing removed)

- Database schema, migrations, RLS, GRANTs.
- `/programs/:slug`, `/programs/:slug/workout`, all `AdminProgram*` and `AdminExerciseLibrary*` routes.
- GA4 events, localStorage keys, `programState` helpers (kept but no longer invoked from the diagnosis page).

## Technical notes

- Only two files change substantially: `src/pages/ExerciseLibrary.tsx` (`RegionPathologyDetail` rewrite) and a new `src/pages/AdminDiagnosisEditor.tsx`. Small edits to `src/App.tsx` (route), `src/pages/Admin.tsx` (link), `src/pages/AdminPrograms.tsx` (link to diagnosis editor per program). No changes to hooks, types, or migrations.
- Reuses: `useFullProgram`, `useLibraryExercises`, existing shadcn `Accordion`, `ExerciseCard`, `SortableRow`, `MultiPickDialog`.
- Category mapping helper lives in `ExerciseLibrary.tsx` next to `splitExerciseDetails`.

## Out of scope (per request)

- Patient auth, prescribing, messaging, analytics.
- Any deletion of existing components, tables, or routes.
- Re-adding progress tracking / guided workout on the diagnosis page.
