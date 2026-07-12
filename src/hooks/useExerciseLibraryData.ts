import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RehabExercise } from "./useRehabExercises";

const sb = supabase as any;

const THIRTY_MIN = 30 * 60 * 1000;

const baseQueryOptions = {
  staleTime: THIRTY_MIN,
  gcTime: 60 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

export type BodyLocation = { id: string; slug: string; name: string };
export type Pathology = { id: string; slug: string; name: string; exercise_program_id?: string | null };

// ---- shared row mapper (same shape as useRehabExercises) ----
const mapRow = (r: any): RehabExercise => ({
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
});

const EXERCISE_SELECT = `id, slug, title, short_description, full_instructions, equipment_needed,
   image_url, video_url, difficulty, rehab_phase, precautions, is_active, is_general_exercise,
   rehab_exercise_locations ( body_locations ( slug, name ) ),
   rehab_exercise_pathologies ( pathologies ( slug, name ) )`;

// ---- Queries ----

export const useBodyLocations = () =>
  useQuery({
    ...baseQueryOptions,
    queryKey: ["body_locations"],
    queryFn: async (): Promise<BodyLocation[]> => {
      const { data, error } = await sb
        .from("body_locations")
        .select("id, slug, name")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

export const useBodyLocationBySlug = (slug?: string) =>
  useQuery({
    ...baseQueryOptions,
    enabled: !!slug,
    queryKey: ["body_location", slug],
    queryFn: async (): Promise<BodyLocation | null> => {
      const { data, error } = await sb
        .from("body_locations")
        .select("id, slug, name")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const usePathologiesForLocation = (locationId?: string | null) =>
  useQuery({
    ...baseQueryOptions,
    enabled: !!locationId,
    queryKey: ["pathologies", locationId],
    queryFn: async (): Promise<Pathology[]> => {
      const { data, error } = await sb
        .from("pathologies")
        .select("id, slug, name")
        .eq("body_location_id", locationId)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

export const usePathologyBySlug = (slug?: string) =>
  useQuery({
    ...baseQueryOptions,
    enabled: !!slug,
    queryKey: ["pathology", slug],
    queryFn: async (): Promise<Pathology | null> => {
      const { data, error } = await sb
        .from("pathologies")
        .select("id, slug, name, exercise_program_id")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

// Exercises assigned to a given body-location id (uses inner join filter).
export const useExercisesForLocation = (locationId?: string | null) =>
  useQuery({
    ...baseQueryOptions,
    enabled: !!locationId,
    queryKey: ["exercises_by_location", locationId],
    queryFn: async (): Promise<RehabExercise[]> => {
      const { data, error } = await sb
        .from("rehab_exercises")
        .select(
          `id, slug, title, short_description, full_instructions, equipment_needed,
           image_url, video_url, difficulty, rehab_phase, precautions, is_active, is_general_exercise,
           rehab_exercise_locations!inner ( body_location_id, body_locations ( slug, name ) ),
           rehab_exercise_pathologies ( pathologies ( slug, name ) )`
        )
        .eq("is_active", true)
        .eq("rehab_exercise_locations.body_location_id", locationId)
        .order("title");
      if (error) throw error;
      return (data || []).map(mapRow);
    },
  });

// Exercises assigned to a given pathology id.
export const useExercisesForPathology = (pathologyId?: string | null) =>
  useQuery({
    ...baseQueryOptions,
    enabled: !!pathologyId,
    queryKey: ["exercises_by_pathology", pathologyId],
    queryFn: async (): Promise<RehabExercise[]> => {
      const { data, error } = await sb
        .from("rehab_exercises")
        .select(
          `id, slug, title, short_description, full_instructions, equipment_needed,
           image_url, video_url, difficulty, rehab_phase, precautions, is_active, is_general_exercise,
           rehab_exercise_locations ( body_locations ( slug, name ) ),
           rehab_exercise_pathologies!inner ( pathology_id, pathologies ( slug, name ) )`
        )
        .eq("is_active", true)
        .eq("rehab_exercise_pathologies.pathology_id", pathologyId)
        .order("title");
      if (error) throw error;
      return (data || []).map(mapRow);
    },
  });

// Recommended program for a pathology slug.
export const usePathologyProgram = (pathologySlug?: string) =>
  useQuery({
    ...baseQueryOptions,
    enabled: !!pathologySlug,
    queryKey: ["pathology_program", pathologySlug],
    queryFn: async () => {
      const { data: p } = await sb
        .from("pathologies")
        .select("exercise_program_id")
        .eq("slug", pathologySlug)
        .maybeSingle();
      if (!p?.exercise_program_id) return null;
      const { data: prog, error } = await sb
        .from("exercise_programs")
        .select(`
          id, slug, name, intro_text, estimated_duration, status,
          program_phases (
            id, title, sort_order, goal, estimated_workout_minutes,
            phase_exercises (
              id, phase_id, exercise_id, sort_order,
              override_sets, override_reps, override_hold_seconds,
              override_duration, override_frequency, is_required,
              exercise_library ( * )
            )
          )
        `)
        .eq("id", p.exercise_program_id)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      if (!prog) return null;
      prog.program_phases = (prog.program_phases || []).sort(
        (a: any, b: any) => a.sort_order - b.sort_order
      );
      prog.program_phases.forEach((ph: any) => {
        ph.phase_exercises = (ph.phase_exercises || []).sort(
          (a: any, b: any) => a.sort_order - b.sort_order
        );
      });
      return prog;
    },
  });

// For the search page — full active list, cached.
export const useAllRehabExercises = () =>
  useQuery({
    ...baseQueryOptions,
    queryKey: ["rehab_exercises_all"],
    queryFn: async (): Promise<RehabExercise[]> => {
      const { data, error } = await sb
        .from("rehab_exercises")
        .select(EXERCISE_SELECT)
        .eq("is_active", true)
        .order("title");
      if (error) throw error;
      return (data || []).map(mapRow);
    },
  });

// Prefetch helper for hover/focus on a joint card.
export const usePrefetchRegion = () => {
  const qc = useQueryClient();
  return (slug: string) => {
    qc.prefetchQuery({
      ...baseQueryOptions,
      queryKey: ["body_location", slug],
      queryFn: async () => {
        const { data } = await sb
          .from("body_locations")
          .select("id, slug, name")
          .eq("slug", slug)
          .maybeSingle();
        return data;
      },
    });
  };
};
