-- ENUMS
DO $$ BEGIN
  CREATE TYPE public.exercise_category AS ENUM ('mobility','stretching','strength','stability','balance','return_to_sport');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.exercise_difficulty AS ENUM ('beginner','intermediate','advanced');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.content_status AS ENUM ('draft','published');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- EXERCISE LIBRARY
CREATE TABLE public.exercise_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  body_region text,
  category public.exercise_category,
  difficulty public.exercise_difficulty,
  equipment text,
  image_url text,
  video_url text,
  short_description text,
  instructions text,
  default_sets integer,
  default_reps integer,
  default_hold_seconds integer,
  default_frequency text,
  what_to_feel text,
  common_mistakes text,
  safety_notes text,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exercise_library TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_library TO authenticated;
GRANT ALL ON public.exercise_library TO service_role;
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published library exercises"
  ON public.exercise_library FOR SELECT
  USING (status = 'published' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage library exercises"
  ON public.exercise_library FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_exercise_library_updated
  BEFORE UPDATE ON public.exercise_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PROGRAMS
CREATE TABLE public.exercise_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  body_region text,
  condition text,
  intro_text text,
  estimated_duration text,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exercise_programs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_programs TO authenticated;
GRANT ALL ON public.exercise_programs TO service_role;
ALTER TABLE public.exercise_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published programs"
  ON public.exercise_programs FOR SELECT
  USING (status = 'published' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage programs"
  ON public.exercise_programs FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_exercise_programs_updated
  BEFORE UPDATE ON public.exercise_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PHASES
CREATE TABLE public.program_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.exercise_programs(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  goal text,
  frequency text,
  estimated_workout_minutes integer,
  approximate_duration text,
  progression_criteria text,
  warning_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_program_phases_program ON public.program_phases(program_id, sort_order);
GRANT SELECT ON public.program_phases TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_phases TO authenticated;
GRANT ALL ON public.program_phases TO service_role;
ALTER TABLE public.program_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads phases of published programs"
  ON public.program_phases FOR SELECT
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.exercise_programs p WHERE p.id = program_id AND p.status = 'published')
  );
CREATE POLICY "Admins manage phases"
  ON public.program_phases FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_program_phases_updated
  BEFORE UPDATE ON public.program_phases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PHASE EXERCISES
CREATE TABLE public.phase_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES public.program_phases(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercise_library(id) ON DELETE RESTRICT,
  sort_order integer NOT NULL DEFAULT 0,
  override_sets integer,
  override_reps integer,
  override_hold_seconds integer,
  override_duration text,
  override_frequency text,
  is_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_phase_exercises_phase ON public.phase_exercises(phase_id, sort_order);
CREATE INDEX idx_phase_exercises_exercise ON public.phase_exercises(exercise_id);
GRANT SELECT ON public.phase_exercises TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phase_exercises TO authenticated;
GRANT ALL ON public.phase_exercises TO service_role;
ALTER TABLE public.phase_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads phase exercises of published programs"
  ON public.phase_exercises FOR SELECT
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.program_phases ph
      JOIN public.exercise_programs p ON p.id = ph.program_id
      WHERE ph.id = phase_id AND p.status = 'published'
    )
  );
CREATE POLICY "Admins manage phase exercises"
  ON public.phase_exercises FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Link pathologies -> programs
ALTER TABLE public.pathologies
  ADD COLUMN IF NOT EXISTS exercise_program_id uuid REFERENCES public.exercise_programs(id) ON DELETE SET NULL;