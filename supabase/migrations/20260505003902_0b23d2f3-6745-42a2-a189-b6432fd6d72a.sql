ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS exercise_type text,
  ADD COLUMN IF NOT EXISTS joint_health_category text,
  ADD COLUMN IF NOT EXISTS diagnosis_tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS equipment text,
  ADD COLUMN IF NOT EXISTS sets_reps_or_hold_time text,
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS you_should_feel text,
  ADD COLUMN IF NOT EXISTS stop_if text,
  ADD COLUMN IF NOT EXISTS common_mistakes text,
  ADD COLUMN IF NOT EXISTS safety_tips text,
  ADD COLUMN IF NOT EXISTS related_exercises uuid[] DEFAULT '{}'::uuid[];

CREATE INDEX IF NOT EXISTS idx_exercises_body_region ON public.exercises (body_region);
CREATE INDEX IF NOT EXISTS idx_exercises_joint_health ON public.exercises (joint_health_category);
CREATE INDEX IF NOT EXISTS idx_exercises_diagnosis_tags ON public.exercises USING GIN (diagnosis_tags);
CREATE INDEX IF NOT EXISTS idx_exercises_type ON public.exercises (exercise_type);