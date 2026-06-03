import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RehabExercise = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  instructions: string | null;
  equipment: string | null;
  image_url: string | null;
  video_url: string | null;
  difficulty: string | null;
  rehab_phase: string | null;
  precautions: string | null;
  is_general_exercise: boolean;
  location_slugs: string[];
  location_names: string[];
  pathology_slugs: string[];
  pathology_names: string[];
};

export const REHAB_PHASE_LABELS: Record<string, string> = {
  acute: "Acute / Pain Relief",
  early_rehab: "Early Rehab / Mobility",
  strengthening: "Strengthening",
  return_to_activity: "Return to Activity",
  maintenance: "Maintenance / Joint Health",
};

export const REHAB_PHASE_ORDER = [
  "acute",
  "early_rehab",
  "strengthening",
  "return_to_activity",
  "maintenance",
];

export const useRehabExercises = () => {
  const [data, setData] = useState<RehabExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: rows } = await (supabase as any)
        .from("rehab_exercises")
        .select(
          `id, slug, title, short_description, full_instructions, equipment_needed,
           image_url, video_url, difficulty, rehab_phase, precautions, is_active, is_general_exercise,
           rehab_exercise_locations ( body_locations ( slug, name ) ),
           rehab_exercise_pathologies ( pathologies ( slug, name ) )`
        )
        .eq("is_active", true)
        .order("title");

      const mapped: RehabExercise[] = (rows || []).map((r: any) => ({
        id: r.id,
        slug: r.slug,
        name: r.title,
        description: r.short_description,
        instructions: r.full_instructions,
        equipment: r.equipment_needed,
        image_url: r.image_url,
        video_url: r.video_url,
        difficulty: r.difficulty,
        rehab_phase: r.rehab_phase,
        precautions: r.precautions,
        is_general_exercise: !!r.is_general_exercise,
        location_slugs: (r.rehab_exercise_locations || [])
          .map((l: any) => l.body_locations?.slug)
          .filter(Boolean),
        location_names: (r.rehab_exercise_locations || [])
          .map((l: any) => l.body_locations?.name)
          .filter(Boolean),
        pathology_slugs: (r.rehab_exercise_pathologies || [])
          .map((p: any) => p.pathologies?.slug)
          .filter(Boolean),
        pathology_names: (r.rehab_exercise_pathologies || [])
          .map((p: any) => p.pathologies?.name)
          .filter(Boolean),
      }));
      setData(mapped);
      setLoading(false);
    })();
  }, []);

  return { data, loading };
};
