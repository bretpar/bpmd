export type ExerciseCategory =
  | "mobility"
  | "stretching"
  | "strength"
  | "stability"
  | "balance"
  | "return_to_sport";

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Status = "draft" | "published";

export const EXERCISE_CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: "mobility", label: "Mobility" },
  { value: "stretching", label: "Stretching" },
  { value: "strength", label: "Strength" },
  { value: "stability", label: "Stability" },
  { value: "balance", label: "Balance" },
  { value: "return_to_sport", label: "Return to Sport" },
];

export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export type LibraryExercise = {
  id: string;
  slug: string;
  name: string;
  body_region: string | null;
  category: ExerciseCategory | null;
  difficulty: Difficulty | null;
  equipment: string | null;
  image_url: string | null;
  video_url: string | null;
  short_description: string | null;
  instructions: string | null;
  default_sets: number | null;
  default_reps: number | null;
  default_hold_seconds: number | null;
  default_frequency: string | null;
  what_to_feel: string | null;
  common_mistakes: string | null;
  safety_notes: string | null;
  status: Status;
};

export type Program = {
  id: string;
  slug: string;
  name: string;
  body_region: string | null;
  condition: string | null;
  intro_text: string | null;
  estimated_duration: string | null;
  status: Status;
};

export type Phase = {
  id: string;
  program_id: string;
  sort_order: number;
  title: string;
  goal: string | null;
  frequency: string | null;
  estimated_workout_minutes: number | null;
  approximate_duration: string | null;
  progression_criteria: string | null;
  warning_text: string | null;
};

export type PhaseExercise = {
  id: string;
  phase_id: string;
  exercise_id: string;
  sort_order: number;
  override_sets: number | null;
  override_reps: number | null;
  override_hold_seconds: number | null;
  override_duration: string | null;
  override_frequency: string | null;
  is_required: boolean;
  exercise?: LibraryExercise;
};

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const prescription = (pe: PhaseExercise, e?: LibraryExercise) => {
  const ex = e || pe.exercise;
  const sets = pe.override_sets ?? ex?.default_sets ?? null;
  const reps = pe.override_reps ?? ex?.default_reps ?? null;
  const hold = pe.override_hold_seconds ?? ex?.default_hold_seconds ?? null;
  const duration = pe.override_duration ?? null;
  const freq = pe.override_frequency ?? ex?.default_frequency ?? null;
  const parts: string[] = [];
  if (sets && reps) parts.push(`${sets} × ${reps}`);
  else if (sets) parts.push(`${sets} sets`);
  else if (reps) parts.push(`${reps} reps`);
  if (hold) parts.push(`hold ${hold}s`);
  if (duration) parts.push(duration);
  if (freq) parts.push(freq);
  return parts.join(" · ");
};
