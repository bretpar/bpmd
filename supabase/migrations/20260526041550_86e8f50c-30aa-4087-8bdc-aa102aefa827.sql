
-- Body locations
CREATE TABLE public.body_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.body_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view body_locations" ON public.body_locations FOR SELECT USING (true);
CREATE POLICY "Admins manage body_locations" ON public.body_locations FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_body_locations_updated BEFORE UPDATE ON public.body_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pathologies
CREATE TABLE public.pathologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  body_location_id uuid REFERENCES public.body_locations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pathologies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view pathologies" ON public.pathologies FOR SELECT USING (true);
CREATE POLICY "Admins manage pathologies" ON public.pathologies FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_pathologies_updated BEFORE UPDATE ON public.pathologies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_pathologies_location ON public.pathologies(body_location_id);

-- Rehab exercises
CREATE TABLE public.rehab_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text,
  full_instructions text,
  difficulty text CHECK (difficulty IN ('beginner','intermediate','advanced')),
  rehab_phase text CHECK (rehab_phase IN ('acute','early_rehab','strengthening','return_to_activity','maintenance')),
  equipment_needed text,
  precautions text,
  image_url text,
  video_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rehab_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active rehab_exercises" ON public.rehab_exercises FOR SELECT USING (is_active = true OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage rehab_exercises" ON public.rehab_exercises FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_rehab_exercises_updated BEFORE UPDATE ON public.rehab_exercises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Join: exercise <-> body_location
CREATE TABLE public.rehab_exercise_locations (
  exercise_id uuid NOT NULL REFERENCES public.rehab_exercises(id) ON DELETE CASCADE,
  body_location_id uuid NOT NULL REFERENCES public.body_locations(id) ON DELETE CASCADE,
  PRIMARY KEY (exercise_id, body_location_id)
);
ALTER TABLE public.rehab_exercise_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view rehab_exercise_locations" ON public.rehab_exercise_locations FOR SELECT USING (true);
CREATE POLICY "Admins manage rehab_exercise_locations" ON public.rehab_exercise_locations FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE INDEX idx_rel_location ON public.rehab_exercise_locations(body_location_id);

-- Join: exercise <-> pathology
CREATE TABLE public.rehab_exercise_pathologies (
  exercise_id uuid NOT NULL REFERENCES public.rehab_exercises(id) ON DELETE CASCADE,
  pathology_id uuid NOT NULL REFERENCES public.pathologies(id) ON DELETE CASCADE,
  PRIMARY KEY (exercise_id, pathology_id)
);
ALTER TABLE public.rehab_exercise_pathologies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view rehab_exercise_pathologies" ON public.rehab_exercise_pathologies FOR SELECT USING (true);
CREATE POLICY "Admins manage rehab_exercise_pathologies" ON public.rehab_exercise_pathologies FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE INDEX idx_rep_pathology ON public.rehab_exercise_pathologies(pathology_id);

-- Seed common body locations
INSERT INTO public.body_locations (name, slug) VALUES
  ('Shoulder','shoulder'),('Elbow','elbow'),('Wrist/Hand','wrist-hand'),
  ('Hip','hip'),('Knee','knee'),('Ankle/Foot','ankle-foot'),
  ('Neck','neck'),('Back','back');
