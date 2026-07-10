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
  acceptable_discomfort?: string | null;
  reduce_or_stop?: string | null;
  seek_medical_care?: string | null;
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

// ---------- Starter phases for guided wizard ----------

export type StarterPhase = Omit<Phase, "id" | "program_id" | "sort_order">;

export const STARTER_PHASES: StarterPhase[] = [
  {
    title: "Pain and Mobility",
    goal: "Reduce pain, restore comfortable range of motion, and calm irritated tissues.",
    frequency: "1–2x per day",
    estimated_workout_minutes: 10,
    approximate_duration: "1–2 weeks",
    progression_criteria:
      "Pain settles to a low, manageable level (≤3/10) during and after exercises and range of motion is improving.",
    warning_text: null,
  },
  {
    title: "Early Strengthening",
    goal: "Reintroduce load and build foundational strength without flaring symptoms.",
    frequency: "Every other day",
    estimated_workout_minutes: 15,
    approximate_duration: "2–3 weeks",
    progression_criteria: "You can complete all sets with good form and no more than mild next-day soreness.",
    warning_text: null,
  },
  {
    title: "Advanced Strengthening",
    goal: "Progress to heavier, multi-planar loading to restore full strength and control.",
    frequency: "3x per week",
    estimated_workout_minutes: 20,
    approximate_duration: "3–4 weeks",
    progression_criteria: "Strength feels symmetrical to the other side and daily activities are pain-free.",
    warning_text: null,
  },
  {
    title: "Return to Activity",
    goal: "Reintegrate sport-specific and functional demands.",
    frequency: "2–3x per week",
    estimated_workout_minutes: 25,
    approximate_duration: "2–4 weeks",
    progression_criteria:
      "You can perform your desired activity at full intensity without symptoms or hesitation.",
    warning_text: null,
  },
];

// ---------- Default pain & safety copy ----------

export const DEFAULT_ACCEPTABLE_DISCOMFORT =
  "Mild discomfort (2–3 out of 10) during exercises is expected and safe. It should settle within a few hours after finishing.";

export const DEFAULT_REDUCE_OR_STOP =
  "Reduce reps or take a rest day if pain during exercise climbs above 5/10, if soreness lasts more than 24 hours, or if swelling increases.";

export const DEFAULT_SEEK_MEDICAL_CARE =
  "Contact the office if you develop new numbness, weakness, giving way, night pain that wakes you, a fever, or an injury after a fall.";

// ---------- Exercise content-completeness / readiness ----------

export type ReadinessStatus = "incomplete" | "nearly" | "ready";

export type Readiness = {
  score: number; // 0..1
  percent: number; // 0..100 rounded
  status: ReadinessStatus;
  missing: string[];
};

export const readiness = (e: Partial<LibraryExercise>): Readiness => {
  const checks: { key: string; label: string; present: boolean }[] = [
    { key: "media", label: "image or video", present: !!(e.image_url || e.video_url) },
    { key: "instructions", label: "instructions", present: !!(e.instructions && e.instructions.trim()) },
    {
      key: "prescription",
      label: "sets/reps/hold or duration",
      present: !!(e.default_sets || e.default_reps || e.default_hold_seconds),
    },
    { key: "feel", label: "“what you should feel”", present: !!(e.what_to_feel && e.what_to_feel.trim()) },
    { key: "safety", label: "safety / stop instructions", present: !!(e.safety_notes && e.safety_notes.trim()) },
  ];
  const filled = checks.filter((c) => c.present).length;
  const score = filled / checks.length;
  const percent = Math.round(score * 100);
  const status: ReadinessStatus = score >= 0.8 ? "ready" : score >= 0.4 ? "nearly" : "incomplete";
  return { score, percent, status, missing: checks.filter((c) => !c.present).map((c) => c.label) };
};

export const READINESS_LABEL: Record<ReadinessStatus, string> = {
  incomplete: "Incomplete",
  nearly: "Nearly Ready",
  ready: "Ready to Publish",
};
