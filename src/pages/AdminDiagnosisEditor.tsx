import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import RequireAdmin from "@/components/RequireAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, ChevronUp, ChevronDown, ExternalLink, GripVertical, ListOrdered,
  Plus, Search, Trash2,
} from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { prescription, slugify, type LibraryExercise, type PhaseExercise } from "@/lib/programTypes";
import { useLibraryExercises } from "@/hooks/usePrograms";

const sb = supabase as any;

/* ============ Types ============ */
type Pathology = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  is_active: boolean;
  exercise_program_id: string | null;
  body_location_id: string | null;
};

type PhaseRow = {
  id: string;
  title: string;
  goal: string | null;
  sort_order: number;
  exercises: (PhaseExercise & { exercise_library: LibraryExercise | null })[];
};

type RehabEx = {
  id: string;
  title: string;
  short_description: string | null;
  rehab_phase: string | null;
  image_url: string | null;
};

const REHAB_CATEGORIES: { key: string; label: string; matches: (r: RehabEx) => boolean }[] = [
  { key: "early_rehab", label: "Mobility", matches: (r) => r.rehab_phase === "early_rehab" },
  { key: "stretching", label: "Stretching", matches: (r) => /stretch/i.test(r.title) },
  { key: "strengthening", label: "Strengthening", matches: (r) => r.rehab_phase === "strengthening" },
  { key: "return_to_activity", label: "Advanced / Return to Sport", matches: (r) => r.rehab_phase === "return_to_activity" },
  { key: "other", label: "More Exercises", matches: () => true },
];

const categorize = (list: RehabEx[]) => {
  const buckets: Record<string, RehabEx[]> = {};
  const claimed = new Set<string>();
  for (const cat of REHAB_CATEGORIES) {
    buckets[cat.key] = [];
    for (const r of list) {
      if (claimed.has(r.id)) continue;
      if (cat.matches(r)) {
        buckets[cat.key].push(r);
        claimed.add(r.id);
      }
    }
  }
  return REHAB_CATEGORIES
    .filter((c) => buckets[c.key].length > 0)
    .map((c) => ({ ...c, items: buckets[c.key] }));
};

/* ============ Sortable phase-exercise row ============ */
const SortableRow = ({
  pe, onChange, onRemove,
}: {
  pe: PhaseExercise & { exercise_library: LibraryExercise | null };
  onChange: (patch: Partial<PhaseExercise>) => void;
  onRemove: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: pe.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const ex = pe.exercise_library;
  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 p-3 rounded-md border border-border bg-background">
      <button
        className="cursor-grab touch-none text-muted-foreground flex items-center justify-center h-10 w-8 -ml-1 shrink-0"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{ex?.name || "(missing exercise)"}</span>
          <span className="text-xs text-muted-foreground">{prescription(pe, ex ?? undefined)}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Sets</Label>
            <Input type="number" inputMode="numeric" className="h-10 sm:h-9" value={pe.override_sets ?? ""}
              placeholder={ex?.default_sets?.toString() ?? "-"}
              onChange={(e) => onChange({ override_sets: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div>
            <Label className="text-xs">Reps</Label>
            <Input type="number" inputMode="numeric" className="h-10 sm:h-9" value={pe.override_reps ?? ""}
              placeholder={ex?.default_reps?.toString() ?? "-"}
              onChange={(e) => onChange({ override_reps: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div>
            <Label className="text-xs">Hold (s)</Label>
            <Input type="number" inputMode="numeric" className="h-10 sm:h-9" value={pe.override_hold_seconds ?? ""}
              placeholder={ex?.default_hold_seconds?.toString() ?? "-"}
              onChange={(e) => onChange({ override_hold_seconds: e.target.value ? Number(e.target.value) : null })} />
          </div>
        </div>
      </div>
      <Button size="icon" variant="ghost" className="h-10 w-10 shrink-0" onClick={onRemove} aria-label="Remove">
        <Trash2 className="w-5 h-5" />
      </Button>
    </div>
  );
};

/* ============ Library picker dialog ============ */
const LibraryPickerDialog = ({
  open, onClose, onPick,
}: { open: boolean; onClose: () => void; onPick: (e: LibraryExercise) => void }) => {
  const { data } = useLibraryExercises(true);
  const [q, setQ] = useState("");
  const filtered = data.filter((e) => !q || e.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader><DialogTitle>Add exercise from library</DialogTitle></DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search exercises..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="overflow-y-auto flex-1 -mx-6 px-6 divide-y divide-border">
          {filtered.map((e) => (
            <button key={e.id} onClick={() => { onPick(e); onClose(); }} className="w-full text-left py-3 hover:bg-muted/50">
              <div className="font-medium">{e.name}</div>
              <div className="text-xs text-muted-foreground">{e.body_region || "—"} · {e.category || "—"}</div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-center py-6 text-muted-foreground">No matches.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ============ Live patient preview (simplified) ============ */
const LivePreview = ({
  pathologyName, phases, assignedRehab,
}: {
  pathologyName: string;
  phases: PhaseRow[];
  assignedRehab: RehabEx[];
}) => {
  const grouped = useMemo(() => categorize(assignedRehab), [assignedRehab]);
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 sm:p-6">
      <p className="text-xs text-muted-foreground mb-3">
        Preview — this is what patients see on this diagnosis page.
      </p>
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <p className="text-[10px] uppercase tracking-wide text-primary font-medium">Start Here</p>
          <h3 className="text-lg font-semibold leading-tight">{pathologyName}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Start with these exercises. They are organized in the order patients typically progress through rehabilitation.
          </p>
        </div>
        {phases.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No phases yet.</p>
        ) : (
          <div className="divide-y">
            {phases.map((ph, idx) => (
              <div key={ph.id} className="p-4">
                <div className="font-medium text-sm leading-snug">
                  <span className="text-muted-foreground mr-1">Phase {idx + 1}</span>
                  {ph.title}
                </div>
                {ph.goal && <p className="text-xs text-muted-foreground mt-1">{ph.goal}</p>}
                <p className="text-[11px] text-muted-foreground mt-1">
                  {ph.exercises.length} exercise{ph.exercises.length === 1 ? "" : "s"}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {ph.exercises.map((pe) => (
                    <li
                      key={pe.id}
                      className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2 min-h-11 text-sm"
                    >
                      {pe.exercise_library?.image_url ? (
                        <img
                          src={pe.exercise_library.image_url}
                          alt=""
                          loading="lazy"
                          className="w-10 h-10 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted shrink-0" />
                      )}
                      <span className="leading-tight">{pe.exercise_library?.name || "(missing)"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-base font-semibold mb-2">All Exercises</h3>
        {assignedRehab.length === 0 ? (
          <p className="text-sm text-muted-foreground">No exercises assigned yet.</p>
        ) : (
          <div className="space-y-4">
            {grouped.map((g) => (
              <div key={g.key}>
                <div className="text-xs font-semibold text-foreground mb-2 pb-1 border-b">
                  {g.label} <span className="text-muted-foreground font-normal">({g.items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {g.items.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 rounded-md border border-border bg-background p-2 min-h-12 text-sm"
                    >
                      {r.image_url ? (
                        <img src={r.image_url} alt="" loading="lazy" className="w-10 h-10 rounded object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted shrink-0" />
                      )}
                      <span className="leading-tight">{r.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============ Main editor ============ */
const Inner = () => {
  const { id = "" } = useParams();
  const nav = useNavigate();

  const [pathology, setPathology] = useState<Pathology | null>(null);
  const [savedPathology, setSavedPathology] = useState<Pathology | null>(null);
  const [region, setRegion] = useState<string>("");
  const [phases, setPhases] = useState<PhaseRow[]>([]);
  const [allRehab, setAllRehab] = useState<RehabEx[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingPhaseId, setAddingPhaseId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const dirty = useMemo(
    () => !!pathology && !!savedPathology &&
      JSON.stringify(pathology) !== JSON.stringify(savedPathology),
    [pathology, savedPathology],
  );
  const dirtyRef = useRef(false);
  const localPathologyRef = useRef<Pathology | null>(null);
  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);
  useEffect(() => { localPathologyRef.current = pathology; }, [pathology]);

  // Warn on tab close / refresh
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const confirmLeave = () =>
    !dirtyRef.current ||
    window.confirm("You have unsaved changes to the diagnosis info. Leave without saving?");


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: p }, { data: rex }, { data: links }] = await Promise.all([
      sb.from("pathologies")
        .select("id, name, slug, short_description, full_description, is_active, exercise_program_id, body_location_id")
        .eq("id", id).maybeSingle(),
      sb.from("rehab_exercises").select("id, title, short_description, rehab_phase, image_url").eq("is_active", true).order("title"),
      sb.from("rehab_exercise_pathologies").select("exercise_id").eq("pathology_id", id),
    ]);
    // Preserve unsaved edits to Diagnosis Information if the user is mid-edit
    // (other panels refresh() after their own auto-saves).
    const local = localPathologyRef.current;
    if (dirtyRef.current && local && p && local.id === p.id) {
      // Merge server-side fields we don't edit here, keep local edits for the form fields.
      setPathology({
        ...local,
        exercise_program_id: p.exercise_program_id,
        body_location_id: p.body_location_id,
      });
    } else {
      setPathology(p);
    }
    setSavedPathology(p);
    setAllRehab(rex || []);
    setAssignedIds((links || []).map((l: any) => l.exercise_id));

    if (p?.body_location_id) {
      const { data: loc } = await sb.from("body_locations").select("name").eq("id", p.body_location_id).maybeSingle();
      setRegion(loc?.name || "");
    } else setRegion("");

    if (p?.exercise_program_id) {
      const { data: phs } = await sb
        .from("program_phases")
        .select(`
          id, title, goal, sort_order,
          phase_exercises (
            id, phase_id, exercise_id, sort_order,
            override_sets, override_reps, override_hold_seconds,
            override_duration, override_frequency, is_required,
            exercise_library ( * )
          )
        `)
        .eq("program_id", p.exercise_program_id)
        .order("sort_order");
      setPhases(
        (phs || []).map((ph: any) => ({
          id: ph.id, title: ph.title, goal: ph.goal, sort_order: ph.sort_order,
          exercises: (ph.phase_exercises || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        }))
      );
    } else setPhases([]);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load, reloadKey]);

  const refresh = () => setReloadKey((k) => k + 1);

  /* --- Pathology info --- */
  const saveInfo = async () => {
    if (!pathology) return;
    const patch = {
      name: pathology.name.trim(),
      slug: pathology.slug?.trim() || slugify(pathology.name),
      short_description: pathology.short_description || null,
      full_description: pathology.full_description || null,
      is_active: pathology.is_active,
    };
    const { error } = await sb.from("pathologies").update(patch).eq("id", pathology.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    const next = { ...pathology, ...patch };
    setPathology(next);
    setSavedPathology(next);
    toast({ title: "Diagnosis saved" });
  };

  /* --- Program / phase mgmt --- */
  const ensureProgram = async (): Promise<string | null> => {
    if (!pathology) return null;
    if (pathology.exercise_program_id) return pathology.exercise_program_id;
    const { data: prog, error } = await sb.from("exercise_programs").insert({
      name: `${pathology.name} Recovery Program`,
      slug: slugify(`${pathology.slug}-recovery`),
      body_region: region || null,
      condition: pathology.name,
      status: "draft",
    }).select("id").single();
    if (error || !prog) { toast({ title: "Failed", description: error?.message, variant: "destructive" }); return null; }
    await sb.from("pathologies").update({ exercise_program_id: prog.id }).eq("id", pathology.id);
    return prog.id;
  };

  const addPhase = async () => {
    const progId = await ensureProgram();
    if (!progId) return;
    await sb.from("program_phases").insert({
      program_id: progId, sort_order: phases.length, title: `Phase ${phases.length + 1}`,
    });
    refresh();
  };

  const updatePhase = async (phaseId: string, patch: Partial<PhaseRow>) => {
    await sb.from("program_phases").update(patch).eq("id", phaseId);
    refresh();
  };

  const deletePhase = async (phaseId: string) => {
    if (!confirm("Delete this phase and all its exercises?")) return;
    await sb.from("program_phases").delete().eq("id", phaseId);
    refresh();
  };

  const movePhase = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= phases.length) return;
    const list = [...phases];
    [list[idx], list[j]] = [list[j], list[idx]];
    await Promise.all(list.map((p, i) => sb.from("program_phases").update({ sort_order: i }).eq("id", p.id)));
    refresh();
  };

  const addExerciseToPhase = async (phaseId: string, ex: LibraryExercise) => {
    const phase = phases.find((p) => p.id === phaseId);
    const nextOrder = phase?.exercises.length ?? 0;
    await sb.from("phase_exercises").insert({
      phase_id: phaseId, exercise_id: ex.id, sort_order: nextOrder, is_required: true,
    });
    refresh();
  };

  const updateEx = async (peId: string, patch: any) => {
    await sb.from("phase_exercises").update(patch).eq("id", peId);
    refresh();
  };

  const removeEx = async (peId: string) => {
    await sb.from("phase_exercises").delete().eq("id", peId);
    refresh();
  };

  const reorderExercises = async (phaseId: string, oldIdx: number, newIdx: number) => {
    const phase = phases.find((p) => p.id === phaseId);
    if (!phase) return;
    const list = arrayMove(phase.exercises, oldIdx, newIdx);
    await Promise.all(list.map((e, i) => sb.from("phase_exercises").update({ sort_order: i }).eq("id", e.id)));
    refresh();
  };

  /* --- All Exercises assignment --- */
  const toggleAssigned = async (exId: string) => {
    if (!pathology) return;
    if (assignedIds.includes(exId)) {
      await sb.from("rehab_exercise_pathologies").delete().eq("pathology_id", pathology.id).eq("exercise_id", exId);
    } else {
      await sb.from("rehab_exercise_pathologies").insert({ pathology_id: pathology.id, exercise_id: exId });
    }
    refresh();
  };

  const assignedRehab = useMemo(
    () => allRehab.filter((r) => assignedIds.includes(r.id)),
    [allRehab, assignedIds],
  );

  const grouped = useMemo(() => {
    // For picker UX: show ALL exercises grouped, each with a checkbox reflecting assignment.
    return categorize(allRehab);
  }, [allRehab]);

  if (loading || !pathology) {
    return <div className="container mx-auto py-16 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="container mx-auto max-w-5xl px-3 sm:px-4 py-6 sm:py-8 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Link
          to="/admin"
          onClick={(e) => { if (!confirmLeave()) e.preventDefault(); }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary min-h-11 py-2"
        >
          <ArrowLeft className="w-4 h-4" /> Admin
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          {dirty && (
            <span className="text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">
              Unsaved changes
            </span>
          )}
          <Button asChild variant="outline" size="sm" className="h-10">
            <Link
              to={`/exercise-library/region/${slugify(region || "")}/pathology/${pathology.slug}`}
              target="_blank"
              onClick={(e) => { if (!confirmLeave()) e.preventDefault(); }}
            >
              <ExternalLink className="w-4 h-4 mr-1" />Open patient page
            </Link>
          </Button>
        </div>
      </div>


      <div>
        <p className="text-xs uppercase tracking-wide text-primary font-medium mb-1">Diagnosis</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">{pathology.name}</h1>
        {region && <p className="text-sm text-muted-foreground mt-1">{region}</p>}
      </div>

      <Accordion type="multiple" defaultValue={["info", "start-here", "all", "preview"]} className="space-y-3">
        {/* ---------- 1. Diagnosis Information ---------- */}
        <AccordionItem value="info" className="border rounded-xl bg-card px-3 sm:px-4">
          <AccordionTrigger className="hover:no-underline py-4 min-h-14">

            <div className="text-left flex items-center gap-2">
              <div>
                <div className="font-semibold">1. Diagnosis Information</div>
                <div className="text-xs text-muted-foreground">Name, description, and visibility</div>
              </div>
              {dirty && (
                <span className="text-[10px] font-medium text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">
                  Unsaved
                </span>
              )}
            </div>
          </AccordionTrigger>

          <AccordionContent className="pb-5 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Name</Label>
                <Input value={pathology.name}
                  onChange={(e) => setPathology({ ...pathology, name: e.target.value })} />
              </div>
              <div><Label>Slug</Label>
                <Input value={pathology.slug}
                  onChange={(e) => setPathology({ ...pathology, slug: e.target.value })} />
              </div>
            </div>
            <div><Label>Short description</Label>
              <Input value={pathology.short_description ?? ""}
                onChange={(e) => setPathology({ ...pathology, short_description: e.target.value })} />
            </div>
            <div><Label>Full description</Label>
              <Textarea rows={4} value={pathology.full_description ?? ""}
                onChange={(e) => setPathology({ ...pathology, full_description: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={pathology.is_active}
                onCheckedChange={(v) => setPathology({ ...pathology, is_active: v })} />
              <Label>Active</Label>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={saveInfo} disabled={!dirty}>Save diagnosis info</Button>
              {dirty && <span className="text-xs text-amber-700">Unsaved changes</span>}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ---------- 2. Start Here ---------- */}
        <AccordionItem value="start-here" className="border rounded-xl bg-card px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="text-left flex-1 flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-primary" />
              <div>
                <div className="font-semibold">2. Start Here <span className="text-xs font-normal text-muted-foreground">(Recommended Exercise Progression)</span></div>
                <div className="text-xs text-muted-foreground">{phases.length} phase{phases.length === 1 ? "" : "s"}</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-5 space-y-3">
            <p className="text-sm text-muted-foreground">
              Organize the exercises patients should start with. Each phase is a collapsible list — drag rows to reorder.
            </p>

            <Accordion type="multiple" defaultValue={phases.map((p) => p.id)} className="space-y-2">
              {phases.map((ph, idx) => (
                <AccordionItem key={ph.id} value={ph.id} className="border rounded-lg bg-background px-3">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex-1 text-left flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-14">Phase {idx + 1}</span>
                      <span className="font-medium">{ph.title}</span>
                      <Badge variant="secondary" className="ml-1 text-xs">{ph.exercises.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-2">
                      <div><Label className="text-xs">Title</Label>
                        <Input defaultValue={ph.title}
                          onBlur={(e) => e.target.value !== ph.title && updatePhase(ph.id, { title: e.target.value })} />
                      </div>
                      <div className="flex items-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => movePhase(idx, -1)} disabled={idx === 0}><ChevronUp className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => movePhase(idx, 1)} disabled={idx === phases.length - 1}><ChevronDown className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deletePhase(ph.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div><Label className="text-xs">Short description (optional)</Label>
                      <Input defaultValue={ph.goal ?? ""}
                        onBlur={(e) => updatePhase(ph.id, { goal: e.target.value || null })} />
                    </div>

                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => {
                        const { active, over } = e;
                        if (!over || active.id === over.id) return;
                        const oldIdx = ph.exercises.findIndex((x) => x.id === active.id);
                        const newIdx = ph.exercises.findIndex((x) => x.id === over.id);
                        if (oldIdx >= 0 && newIdx >= 0) reorderExercises(ph.id, oldIdx, newIdx);
                      }}
                    >
                      <SortableContext items={ph.exercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {ph.exercises.map((pe) => (
                            <SortableRow key={pe.id} pe={pe}
                              onChange={(patch) => updateEx(pe.id, patch)}
                              onRemove={() => removeEx(pe.id)} />
                          ))}
                          {ph.exercises.length === 0 && (
                            <p className="text-xs text-muted-foreground py-3 text-center border border-dashed rounded">
                              No exercises yet.
                            </p>
                          )}
                        </div>
                      </SortableContext>
                    </DndContext>

                    <Button size="sm" variant="outline" onClick={() => setAddingPhaseId(ph.id)}>
                      <Plus className="w-4 h-4 mr-1" />Add exercise from library
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <Button size="sm" onClick={addPhase}>
              <Plus className="w-4 h-4 mr-1" />Add phase
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* ---------- 3. All Exercises ---------- */}
        <AccordionItem value="all" className="border rounded-xl bg-card px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="text-left">
              <div className="font-semibold">3. All Exercises</div>
              <div className="text-xs text-muted-foreground">
                {assignedRehab.length} selected · Choose everything shown on the patient page
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Check exercises to include them under <span className="font-medium">All Exercises</span> on the patient page.
              The Start Here progression is a curated subset of this list.
            </p>
            {grouped.map((g) => (
              <div key={g.key}>
                <div className="text-sm font-semibold mb-2 pb-1 border-b border-border">
                  {g.label}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">{g.items.length}</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                  {g.items.map((r) => {
                    const on = assignedIds.includes(r.id);
                    return (
                      <label key={r.id}
                        className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${on ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                        <input type="checkbox" className="mt-0.5" checked={on} onChange={() => toggleAssigned(r.id)} />
                        <span className="text-sm leading-tight">{r.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* ---------- 4. Live Patient Preview ---------- */}
        <AccordionItem value="preview" className="border rounded-xl bg-card px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="text-left">
              <div className="font-semibold">4. Live Patient Preview</div>
              <div className="text-xs text-muted-foreground">Updates automatically as you edit above</div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-5">
            <LivePreview pathologyName={pathology.name} phases={phases} assignedRehab={assignedRehab} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <LibraryPickerDialog
        open={!!addingPhaseId}
        onClose={() => setAddingPhaseId(null)}
        onPick={(e) => addingPhaseId && addExerciseToPhase(addingPhaseId, e)}
      />
    </div>
  );
};

const AdminDiagnosisEditor = () => (
  <Layout>
    <RequireAdmin><Inner /></RequireAdmin>
  </Layout>
);

export default AdminDiagnosisEditor;
