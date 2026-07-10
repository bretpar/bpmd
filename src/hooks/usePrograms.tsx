import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LibraryExercise, Program, Phase, PhaseExercise } from "@/lib/programTypes";

const sb = supabase as any;

export const useLibraryExercises = (includeAll = false) => {
  const [data, setData] = useState<LibraryExercise[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let q = sb.from("exercise_library").select("*").order("name");
    if (!includeAll) q = q.eq("status", "published");
    const { data: rows } = await q;
    setData((rows || []) as LibraryExercise[]);
    setLoading(false);
  }, [includeAll]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load };
};

export const usePrograms = (includeAll = false) => {
  const [data, setData] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    let q = sb.from("exercise_programs").select("*").order("name");
    if (!includeAll) q = q.eq("status", "published");
    const { data: rows } = await q;
    setData((rows || []) as Program[]);
    setLoading(false);
  }, [includeAll]);
  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load };
};

export type FullProgram = {
  program: Program;
  phases: (Phase & { exercises: PhaseExercise[] })[];
};

export const useFullProgram = (slug?: string) => {
  const [data, setData] = useState<FullProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      setNotFound(false);
      const { data: p } = await sb
        .from("exercise_programs")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!p) { setNotFound(true); setLoading(false); return; }

      const { data: phases } = await sb
        .from("program_phases")
        .select("*")
        .eq("program_id", p.id)
        .order("sort_order");

      const phaseIds = (phases || []).map((x: any) => x.id);
      let phaseEx: any[] = [];
      if (phaseIds.length) {
        const { data: pe } = await sb
          .from("phase_exercises")
          .select("*, exercise:exercise_library(*)")
          .in("phase_id", phaseIds)
          .order("sort_order");
        phaseEx = pe || [];
      }

      setData({
        program: p as Program,
        phases: (phases || []).map((ph: any) => ({
          ...ph,
          exercises: phaseEx.filter((x) => x.phase_id === ph.id),
        })),
      });
      setLoading(false);
    })();
  }, [slug]);

  return { data, loading, notFound };
};

// Fetch a program by id for admin (any status)
export const useFullProgramById = (id?: string, reloadKey = 0) => {
  const [data, setData] = useState<FullProgram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data: p } = await sb.from("exercise_programs").select("*").eq("id", id).maybeSingle();
      if (!p) { setData(null); setLoading(false); return; }
      const { data: phases } = await sb.from("program_phases").select("*").eq("program_id", id).order("sort_order");
      const phaseIds = (phases || []).map((x: any) => x.id);
      let phaseEx: any[] = [];
      if (phaseIds.length) {
        const { data: pe } = await sb
          .from("phase_exercises")
          .select("*, exercise:exercise_library(*)")
          .in("phase_id", phaseIds)
          .order("sort_order");
        phaseEx = pe || [];
      }
      setData({
        program: p as Program,
        phases: (phases || []).map((ph: any) => ({
          ...ph,
          exercises: phaseEx.filter((x) => x.phase_id === ph.id),
        })),
      });
      setLoading(false);
    })();
  }, [id, reloadKey]);

  return { data, loading };
};
