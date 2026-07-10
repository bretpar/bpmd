import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import RequireAdmin from "@/components/RequireAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ExternalLink, ListOrdered, Plus, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { slugify } from "@/lib/programTypes";

const sb = supabase as any;

type Pathology = {
  id: string;
  name: string;
  slug: string;
  exercise_program_id: string | null;
  body_location_id: string | null;
};

type ProgramLite = { id: string; name: string; slug: string; status: string };

type PhaseSummary = {
  id: string;
  title: string;
  sort_order: number;
  exercises: { id: string; name: string }[];
};

type RehabEx = { id: string; title: string };

const Inner = () => {
  const { id = "" } = useParams();
  const nav = useNavigate();

  const [pathology, setPathology] = useState<Pathology | null>(null);
  const [region, setRegion] = useState<string>("");
  const [programs, setPrograms] = useState<ProgramLite[]>([]);
  const [phases, setPhases] = useState<PhaseSummary[]>([]);
  const [allRehab, setAllRehab] = useState<RehabEx[]>([]);
  const [assignedRehabIds, setAssignedRehabIds] = useState<string[]>([]);
  const [pickerQ, setPickerQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: progs }, { data: rex }, { data: links }] = await Promise.all([
      sb.from("pathologies").select("id, name, slug, exercise_program_id, body_location_id").eq("id", id).maybeSingle(),
      sb.from("exercise_programs").select("id, name, slug, status").order("name"),
      sb.from("rehab_exercises").select("id, title").eq("is_active", true).order("title"),
      sb.from("rehab_exercise_pathologies").select("exercise_id").eq("pathology_id", id),
    ]);
    setPathology(p);
    setPrograms(progs || []);
    setAllRehab(rex || []);
    setAssignedRehabIds((links || []).map((l: any) => l.exercise_id));
    if (p?.body_location_id) {
      const { data: loc } = await sb.from("body_locations").select("name").eq("id", p.body_location_id).maybeSingle();
      setRegion(loc?.name || "");
    } else setRegion("");

    if (p?.exercise_program_id) {
      const { data: phs } = await sb
        .from("program_phases")
        .select("id, title, sort_order, phase_exercises(id, sort_order, exercise_library(name))")
        .eq("program_id", p.exercise_program_id)
        .order("sort_order");
      setPhases(
        (phs || []).map((ph: any) => ({
          id: ph.id,
          title: ph.title,
          sort_order: ph.sort_order,
          exercises: (ph.phase_exercises || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((pe: any) => ({ id: pe.id, name: pe.exercise_library?.name || "(missing)" })),
        }))
      );
    } else setPhases([]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const currentProgram = useMemo(
    () => programs.find((p) => p.id === pathology?.exercise_program_id) || null,
    [programs, pathology],
  );

  const linkProgram = async (programId: string | null) => {
    if (!pathology) return;
    await sb.from("pathologies").update({ exercise_program_id: programId }).eq("id", pathology.id);
    toast({ title: programId ? "Program linked" : "Program unlinked" });
    load();
  };

  const createProgram = async () => {
    if (!pathology) return;
    const name = `${pathology.name} Recovery Program`;
    const slug = slugify(`${pathology.slug}-recovery`);
    const { data: prog, error } = await sb
      .from("exercise_programs")
      .insert({
        name, slug,
        body_region: region || null,
        condition: pathology.name,
        status: "draft",
      })
      .select("id")
      .single();
    if (error || !prog) return toast({ title: "Could not create", description: error?.message, variant: "destructive" });
    // Seed 3 phases
    await sb.from("program_phases").insert(
      [1, 2, 3].map((n) => ({
        program_id: prog.id,
        sort_order: n - 1,
        title: `Phase ${n}`,
      })),
    );
    await sb.from("pathologies").update({ exercise_program_id: prog.id }).eq("id", pathology.id);
    toast({ title: "Recovery program created" });
    nav(`/admin/programs/${prog.id}`);
  };

  const toggleAdditional = async (exId: string) => {
    if (!pathology) return;
    if (assignedRehabIds.includes(exId)) {
      await sb.from("rehab_exercise_pathologies").delete().eq("pathology_id", pathology.id).eq("exercise_id", exId);
    } else {
      await sb.from("rehab_exercise_pathologies").insert({ pathology_id: pathology.id, exercise_id: exId });
    }
    load();
  };

  const assignedRehab = allRehab.filter((r) => assignedRehabIds.includes(r.id));
  const pickerMatches = allRehab.filter(
    (r) => !assignedRehabIds.includes(r.id) && r.title.toLowerCase().includes(pickerQ.toLowerCase()),
  );

  if (loading || !pathology) {
    return <div className="container mx-auto py-16 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Admin
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link to={`/exercise-library/search?q=${encodeURIComponent(pathology.name)}`} target="_blank">
            <ExternalLink className="w-4 h-4 mr-1" />View patient page
          </Link>
        </Button>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-primary font-medium mb-1">Diagnosis</p>
        <h1 className="text-3xl font-bold text-foreground">{pathology.name}</h1>
        {region && <p className="text-sm text-muted-foreground mt-1">{region}</p>}
      </div>

      {/* Recommended Recovery Program */}
      <div className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-semibold">Recommended Recovery Program</h2>
        </div>

        {!currentProgram ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              No recovery program is linked yet. Create a new one for this diagnosis, or attach an existing program.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={createProgram}>
                <Plus className="w-4 h-4 mr-1" />Create Recovery Program
              </Button>
              <div className="flex-1 min-w-[220px]">
                <Select value="" onValueChange={(v) => linkProgram(v)}>
                  <SelectTrigger><SelectValue placeholder="Attach an existing program..." /></SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.status === "draft" ? "(draft)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{currentProgram.name}</span>
              <Badge variant={currentProgram.status === "published" ? "default" : "outline"}>
                {currentProgram.status}
              </Badge>
              <div className="ml-auto flex gap-2">
                <Button asChild size="sm">
                  <Link to={`/admin/programs/${currentProgram.id}`}>Edit phases & exercises →</Link>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => linkProgram(null)}>Unlink</Button>
              </div>
            </div>

            {phases.length === 0 ? (
              <p className="text-sm text-muted-foreground">This program has no phases yet.</p>
            ) : (
              <div className="space-y-3">
                {phases.map((ph, idx) => (
                  <div key={ph.id} className="rounded-lg border border-border bg-background p-4">
                    <div className="font-medium mb-1">Phase {idx + 1} – {ph.title}</div>
                    {ph.exercises.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No exercises yet.</p>
                    ) : (
                      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-0.5">
                        {ph.exercises.map((e) => <li key={e.id}>{e.name}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Additional exercises */}
      <div className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Additional Exercises</h2>
          <p className="text-sm text-muted-foreground mt-1">
            These appear under <span className="font-medium">All Exercises</span> on the patient page, even when not part of a phase.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
          {assignedRehab.length === 0 && (
            <p className="text-xs text-muted-foreground">None assigned yet.</p>
          )}
          {assignedRehab.map((r) => (
            <Badge key={r.id} variant="secondary" className="gap-1">
              {r.title}
              <button className="hover:text-destructive" onClick={() => toggleAdditional(r.id)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search library to add..."
            value={pickerQ}
            onChange={(e) => setPickerQ(e.target.value)}
          />
        </div>

        {pickerQ && (
          <div className="border rounded-md max-h-64 overflow-auto bg-popover">
            {pickerMatches.slice(0, 40).map((r) => (
              <button
                key={r.id}
                className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                onClick={() => { toggleAdditional(r.id); setPickerQ(""); }}
              >
                {r.title}
              </button>
            ))}
            {pickerMatches.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-3">No matches.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDiagnosisEditor = () => (
  <Layout>
    <RequireAdmin><Inner /></RequireAdmin>
  </Layout>
);

export default AdminDiagnosisEditor;
