-- Program-level safety guidance columns
ALTER TABLE public.exercise_programs
  ADD COLUMN IF NOT EXISTS acceptable_discomfort text,
  ADD COLUMN IF NOT EXISTS reduce_or_stop text,
  ADD COLUMN IF NOT EXISTS seek_medical_care text;

-- Templates: mirror program shape
CREATE TABLE IF NOT EXISTS public.program_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  body_region text,
  condition text,
  intro_text text,
  estimated_duration text,
  acceptable_discomfort text,
  reduce_or_stop text,
  seek_medical_care text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_templates TO authenticated;
GRANT ALL ON public.program_templates TO service_role;
ALTER TABLE public.program_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates readable by authenticated" ON public.program_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "templates writable by admins" ON public.program_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER program_templates_updated_at BEFORE UPDATE ON public.program_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.template_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.program_templates(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  title text NOT NULL,
  goal text,
  frequency text,
  estimated_workout_minutes int,
  approximate_duration text,
  progression_criteria text,
  warning_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_phases TO authenticated;
GRANT ALL ON public.template_phases TO service_role;
ALTER TABLE public.template_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "template_phases readable by authenticated" ON public.template_phases FOR SELECT TO authenticated USING (true);
CREATE POLICY "template_phases writable by admins" ON public.template_phases FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER template_phases_updated_at BEFORE UPDATE ON public.template_phases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.template_phase_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES public.template_phases(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercise_library(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  override_sets int,
  override_reps int,
  override_hold_seconds int,
  override_duration text,
  override_frequency text,
  is_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_phase_exercises TO authenticated;
GRANT ALL ON public.template_phase_exercises TO service_role;
ALTER TABLE public.template_phase_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "template_phase_exercises readable by authenticated" ON public.template_phase_exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "template_phase_exercises writable by admins" ON public.template_phase_exercises FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER template_phase_exercises_updated_at BEFORE UPDATE ON public.template_phase_exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();