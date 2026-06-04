
ALTER TABLE public.body_locations
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.pathologies
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS full_description text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.rehab_exercises
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.pathology_locations (
  pathology_id uuid NOT NULL REFERENCES public.pathologies(id) ON DELETE CASCADE,
  body_location_id uuid NOT NULL REFERENCES public.body_locations(id) ON DELETE CASCADE,
  PRIMARY KEY (pathology_id, body_location_id)
);

GRANT SELECT ON public.pathology_locations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pathology_locations TO authenticated;
GRANT ALL ON public.pathology_locations TO service_role;

ALTER TABLE public.pathology_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view pathology_locations"
  ON public.pathology_locations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage pathology_locations"
  ON public.pathology_locations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Backfill many-to-many from existing single body_location_id
INSERT INTO public.pathology_locations (pathology_id, body_location_id)
SELECT id, body_location_id FROM public.pathologies
WHERE body_location_id IS NOT NULL
ON CONFLICT DO NOTHING;
