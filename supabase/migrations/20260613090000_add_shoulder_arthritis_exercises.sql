DO $$
DECLARE
  shoulder_id uuid;
  arthritis_id uuid;
BEGIN
  SELECT id INTO shoulder_id
  FROM public.body_locations
  WHERE slug = 'shoulder';

  IF shoulder_id IS NULL THEN
    RAISE NOTICE 'Shoulder body location not found; skipping Shoulder Arthritis seed.';
    RETURN;
  END IF;

  INSERT INTO public.pathologies (
    name,
    slug,
    body_location_id,
    short_description,
    full_description,
    is_active,
    sort_order
  )
  VALUES (
    'Shoulder Arthritis',
    'shoulder-arthritis',
    shoulder_id,
    'Gentle shoulder mobility and posture exercises for shoulder arthritis symptoms.',
    'Use a comfortable range of motion. Stop if pain sharply worsens, symptoms travel down the arm, numbness/tingling develops, weakness worsens, or you cannot raise the arm. Seek medical care after trauma, severe pain, fever, major swelling, or rapidly worsening function.',
    true,
    60
  )
  ON CONFLICT (slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    body_location_id = EXCLUDED.body_location_id,
    short_description = EXCLUDED.short_description,
    full_description = EXCLUDED.full_description,
    is_active = true;

  SELECT id INTO arthritis_id
  FROM public.pathologies
  WHERE slug = 'shoulder-arthritis';

  INSERT INTO public.pathology_locations (pathology_id, body_location_id)
  VALUES (arthritis_id, shoulder_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.rehab_exercise_pathologies (exercise_id, pathology_id)
  SELECT e.id, arthritis_id
  FROM public.rehab_exercises e
  WHERE e.slug IN (
    'pendulum-swings',
    'table-slides',
    'cross-body-shoulder-stretch',
    'scapular-retractions'
  )
  ON CONFLICT DO NOTHING;
END $$;
