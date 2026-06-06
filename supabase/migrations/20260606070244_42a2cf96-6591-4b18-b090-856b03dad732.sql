CREATE TABLE public.ultrasound_content (
  key text PRIMARY KEY,
  title text NOT NULL,
  body text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ultrasound_content TO anon, authenticated;
GRANT ALL ON public.ultrasound_content TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.ultrasound_content TO authenticated;

ALTER TABLE public.ultrasound_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read ultrasound content"
  ON public.ultrasound_content FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert ultrasound content"
  ON public.ultrasound_content FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ultrasound content"
  ON public.ultrasound_content FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ultrasound content"
  ON public.ultrasound_content FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_ultrasound_content_updated_at
  BEFORE UPDATE ON public.ultrasound_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.ultrasound_content (key, title, body) VALUES
  ('overview', 'About ultrasound-guided injections', 'Ultrasound-guided injections use real-time imaging to precisely place medication into joints, tendons, bursae, and other soft tissues. By directly visualizing the needle and the target structure, we improve accuracy and avoid nearby nerves and vessels.'),
  ('pre_care', 'Before your injection', E'• Eat normally and stay hydrated.\n• Continue your usual medications unless told otherwise.\n• If you take blood thinners, let the clinic know in advance — most procedures do not require stopping them.\n• Wear loose clothing that exposes the injection area easily.\n• Arrange a ride home if you prefer, although most patients drive themselves.'),
  ('post_care', 'After your injection', E'• Keep the area clean and dry for the rest of the day.\n• Avoid heavy activity involving the injected area for 24–48 hours.\n• Mild soreness can occur for 1–2 days; ice may help.\n• Avoid soaking in a bath, pool, or hot tub for 24 hours.\n• Resume normal medications and activities as previously instructed.'),
  ('risks', 'Risks and side effects', E'Ultrasound-guided injections are generally very safe. Possible side effects include temporary soreness, mild bruising, a brief flare of pain in the first 24–48 hours, and rarely infection, bleeding, allergic reaction, skin discoloration, or fat atrophy at the injection site. Steroid injections may cause a temporary rise in blood sugar.'),
  ('when_to_call', 'When to call the clinic', E'Contact the clinic for:\n• Fever or chills\n• Spreading redness, warmth, or drainage at the site\n• Severe or worsening pain not relieved with ice and rest\n• New weakness or numbness');
