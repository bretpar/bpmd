# Exercise Program System — Enhancements (Additive)

Nothing existing is replaced. All current routes, tables, GA4 events, localStorage keys, fallback behavior, and published programs keep working.

## 1. Guided "Create Program" wizard

New route: `/admin/programs/new` with a 5-step wizard component. Existing `/admin/programs/:id` builder stays as the deep-edit surface and is reused for post-wizard editing.

Steps:
1. **Program Details** — name, slug (auto from name, editable), body region, pathology (dropdown of existing `pathologies`), intro text, estimated duration.
2. **Build Phases** — starts empty with a "Load starter phases" button that inserts: Pain and Mobility, Early Strengthening, Advanced Strengthening, Return to Activity (each with sensible default goal/frequency/progression criteria). Rename, add, delete, duplicate, reorder (drag).
3. **Add Exercises** — per phase: search Exercise Library with filters (region, category, difficulty, equipment), multi-select, drag-reorder, inline overrides (sets/reps/hold/duration/frequency), Required/Optional toggle. Only inserts `phase_exercises` rows referencing existing `exercise_library` — never duplicates library records.
4. **Preview** — renders the actual patient `ProgramView` component in-place using the in-memory draft (no DB round-trip needed for preview).
5. **Publish & Attach** — Save as Draft or Publish; pathology picker; on publish/save also writes `pathologies.exercise_program_id` (or existing FK on `injuries` — whichever the current picker uses). "Open full editor" link to `/admin/programs/:id` afterward.

The existing pathology-side program picker in `Admin.tsx` stays as an alternate path.

Add "Create Guided Program" button on `/admin/programs` next to the existing "New Program".

## 2. Program templates

New table `program_templates` (mirrors program shape) + `template_phases` + `template_phase_exercises`. Admin actions:
- New program → chooser modal: Blank / From Existing Program / From Template.
- "Save as Template" action on any program (copies phases + phase_exercises into template tables).
- Templates admin at `/admin/programs/templates` (list, edit name/description, delete).

Duplicating from a program or template inserts new `program_phases` and `phase_exercises` rows but keeps `exercise_id` references intact (shared library).

## 3. Clearer patient phase state

Add `phase_status` per patient in localStorage alongside existing workout progress:

```text
key: bpmd:program:<slug>:phase_state
value: { currentPhaseId, completedPhaseIds[] }
```

`ProgramView` phase list badges:
- **Start Here** — first phase when no state saved
- **Current Phase** — matches currentPhaseId
- **Completed** — in completedPhaseIds
- **Next Phase** — the phase after current
- Others: neutral

Workout completion no longer auto-advances. When all exercises in a phase are checked, show a "Ready for the next phase?" panel with:
- Phase `progression_criteria`
- "Continue Current Phase" (keeps current, clears checkboxes for another pass)
- "Start Next Phase" (marks current complete, sets next as current, navigates)

## 4. Pain & safety guidance (program-level)

Migration adds nullable columns on `exercise_programs`:
- `acceptable_discomfort`
- `reduce_or_stop`
- `seek_medical_care`

Wizard step 1 and program editor expose these with editable default copy (constants in `programTypes.ts`). Displayed as a collapsible "Pain & Safety" accordion on `/programs/:slug` and inside the guided workout header.

## 5. Exercise content-completeness indicator

Pure client-side calculation in `programTypes.ts`:

```text
readiness(ex) = count of present fields / 5, using:
  - image_url OR video_url
  - instructions
  - default_sets/reps/hold_seconds OR any override-duration marker
  - what_to_feel
  - safety_notes
```

Status: Incomplete (<40%), Nearly Ready (<80%), Ready to Publish (≥80%).

Shown in `AdminExerciseLibrary` list as a badge + percentage. On publish action, if <80%, confirm dialog: "This exercise is missing X, Y. Publish anyway?" Drafts save freely.

## Technical Details

### New files
- `src/pages/AdminProgramWizard.tsx` — 5-step wizard (uses same primitives as existing builder).
- `src/pages/AdminProgramTemplates.tsx` — templates list/edit.
- `src/components/programs/PhaseStatusBadge.tsx`, `PainSafetyPanel.tsx`, `ReadinessBadge.tsx`, `NextPhasePanel.tsx`.
- `src/lib/programState.ts` — localStorage helpers for phase state (namespaced, backward-compatible with existing workout progress keys).

### Edited files
- `src/App.tsx` — add routes: `/admin/programs/new`, `/admin/programs/templates`, `/admin/programs/templates/:id`.
- `src/pages/AdminPrograms.tsx` — add "Create Guided Program" + "From existing / From template" chooser + "Save as Template".
- `src/pages/AdminExerciseLibrary.tsx` — readiness badges + publish confirmation.
- `src/pages/ProgramView.tsx` — phase status badges, next-phase panel, pain/safety accordion; drop auto-advance-on-all-checked.
- `src/lib/programTypes.ts` — readiness helper, safety default copy, starter phases constant.
- `src/hooks/usePrograms.tsx` — template hooks; extend `Program` type with safety fields.

### Migration
- Add nullable safety columns to `exercise_programs`.
- Create `program_templates`, `template_phases`, `template_phase_exercises` with the same shape as their program counterparts. RLS: admin-only read/write (templates aren't patient-facing). Full GRANTs to `authenticated` + `service_role`.

### Preserved
- `/admin/programs/:id` full editor, existing pathology program picker, `rehab_exercises` fallback, GA4 events (`program_start`, `exercise_page_view`), existing workout-progress localStorage keys.

## Build order

1. Migration (safety cols + template tables).
2. `programTypes.ts` + `programState.ts` helpers, starter phases, default safety copy.
3. Templates hooks + `AdminProgramTemplates` page.
4. `AdminProgramWizard` (5 steps).
5. `AdminPrograms` chooser + "Save as Template".
6. `AdminExerciseLibrary` readiness badges + publish guard.
7. `ProgramView` phase status, next-phase panel, pain/safety panel.
8. Route wiring in `App.tsx`.
