CREATE TABLE public.ultrasound_injections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  body_region text NOT NULL,
  conditions_treated text,
  short_summary text,
  full_explanation text,
  why_ultrasound text,
  procedure_steps text,
  medications text,
  risks text,
  post_care text,
  when_to_call text,
  procedure_image_url text,
  ultrasound_image_url text,
  diagram_image_url text,
  seo_title text,
  seo_description text,
  status text NOT NULL DEFAULT 'draft',
  featured boolean NOT NULL DEFAULT false,
  accepts_appointments boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ultrasound_injections_status_check CHECK (status IN ('draft','published','hidden')),
  CONSTRAINT ultrasound_injections_region_check CHECK (body_region IN ('Shoulder','Elbow','Wrist/Hand','Hip','Knee','Foot/Ankle','Other'))
);

GRANT SELECT ON public.ultrasound_injections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ultrasound_injections TO authenticated;
GRANT ALL ON public.ultrasound_injections TO service_role;

ALTER TABLE public.ultrasound_injections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published injections"
  ON public.ultrasound_injections FOR SELECT
  TO anon, authenticated
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert injections"
  ON public.ultrasound_injections FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update injections"
  ON public.ultrasound_injections FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete injections"
  ON public.ultrasound_injections FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_ultrasound_injections_updated_at
  BEFORE UPDATE ON public.ultrasound_injections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ultrasound_injections_status ON public.ultrasound_injections(status);
CREATE INDEX idx_ultrasound_injections_region ON public.ultrasound_injections(body_region);