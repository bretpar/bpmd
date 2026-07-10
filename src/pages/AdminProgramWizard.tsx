import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import RequireAdmin from "@/components/RequireAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, ArrowRight, Check, Plus, Trash2, Copy, GripVertical, ChevronUp, ChevronDown, Search, ExternalLink, Sparkles,
} from "lucide-react";
import {
  DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useFullProgramById, useLibraryExercises } from "@/hooks/usePrograms";
import {
  slugify, prescription, STARTER_PHASES,
  DEFAULT_ACCEPTABLE_DISCOMFORT, DEFAULT_REDUCE_OR_STOP, DEFAULT_SEEK_MEDICAL_CARE,
  EXERCISE_CATEGORIES, DIFFICULTIES,
  type LibraryExercise, type PhaseExercise, type Status,
} from "@/lib/programTypes";

const sb = supabase as any;

const STEPS = [
  { id: 1, label: "Details" },
  { id: 2, label: "Phases" },
  { id: 3, label: "Exercises" },
  { id: 4, label: "Preview" },
  { id: 5, label: "Publish & Attach" },
];

// ---------- Step 3 helpers ----------

const SortableRow = ({
  pe, onChange, onRemove,
}: { pe: PhaseExercise; onChange: (patch: Partial<PhaseExercise>) => void; onRemove: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: pe.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const ex = pe.exercise!;
  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 p-3 rounded-md border border-border bg-background">
      <button className="cursor-grab pt-1 text-muted-foreground" {...attributes} {...listeners} aria-label="Drag"><GripVertical className="w-4 h-4" /></button>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{ex?.name || "(missing)"}</span>
          {ex?.category && <Badge variant="secondary" className="text-xs">{ex.category}</Badge>}
          <span className="text-xs text-muted-foreground">{prescription(pe)}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div><Label className="text-xs">Sets</Label>
            <Input type="number" value={pe.override_sets ?? ""} placeholder={ex?.default_sets?.toString() ?? "-"}
              onChange={(e) => onChange({ override_sets: e.target.value ? Number(e.target.value) : null })} /></div>
          <div><Label className="text-xs">Reps</Label>
            <Input type="number" value={pe.override_reps ?? ""} placeholder={ex?.default_reps?.toString() ?? "-"}
              onChange={(e) => onChange({ override_reps: e.target.value ? Number(e.target.value) : null })} /></div>
          <div><Label className="text-xs">Hold (s)</Label>
            <Input type="number" value={pe.override_hold_seconds ?? ""} placeholder={ex?.default_hold_seconds?.toString() ?? "-"}
              onChange={(e) => onChange({ override_hold_seconds: e.target.value ? Number(e.target.value) : null })} /></div>
          <div><Label className="text-xs">Duration</Label>
            <Input value={pe.override_duration ?? ""} onChange={(e) => onChange({ override_duration: e.target.value || null })} /></div>
          <div><Label className="text-xs">Frequency</Label>
            <Input value={pe.override_frequency ?? ""} placeholder={ex?.default_frequency ?? "-"}
              onChange={(e) => onChange({ override_frequency: e.target.value || null })} /></div>
        </div>
        <label className="inline-flex items-center gap-2 text-xs">
          <Switch checked={pe.is_required} onCheckedChange={(v) => onChange({ is_required: v })} />
          {pe.is_required ? "Required" : "Optional"}
        </label>
      </div>
      <Button size="icon" variant="ghost" onClick={onRemove} aria-label="Remove"><Trash2 className="w-4 h-4" /></Button>
    </div>
  );
};

const MultiPickDialog = ({
  open, onClose, onPick,
}: { open: boolean; onClose: () => void; onPick: (ids: string[]) => void }) => {
  const { data } = useLibraryExercises(true);
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("all");
  const [cat, setCat] = useState("all");
  const [diff, setDiff] = useState("all");
  const [equip, setEquip] = useState("all");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const regions = useMemo(() => Array.from(new Set(data.map((d) => d.body_region).filter(Boolean))) as string[], [data]);
  const equipments = useMemo(() => Array.from(new Set(data.map((d) => d.equipment).filter(Boolean))) as string[], [data]);

  const filtered = data.filter((e) => {
    if (q && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (region !== "all" && e.body_region !== region) return false;
    if (cat !== "all" && e.category !== cat) return false;
    if (diff !== "all" && e.difficulty !== diff) return false;
    if (equip !== "all" && e.equipment !== equip) return false;
    return true;
  });

  useEffect(() => { if (open) setSelected({}); }, [open]);

  const chosen = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader><DialogTitle>Add exercises</DialogTitle></DialogHeader>
        <div className="grid gap-2 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {EXERCISE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={diff} onValueChange={setDiff}>
            <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All difficulty</SelectItem>
              {DIFFICULTIES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-2">
          <Select value={equip} onValueChange={setEquip}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Equipment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All equipment</SelectItem>
              {equipments.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-y-auto flex-1 -mx-6 px-6 divide-y divide-border">
          {filtered.map((e) => (
            <label key={e.id} className="flex items-start gap-3 py-2.5 cursor-pointer hover:bg-muted/40">
              <input type="checkbox" className="mt-1" checked={!!selected[e.id]}
                onChange={(ev) => setSelected((s) => ({ ...s, [e.id]: ev.target.checked }))} />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm">{e.name} <Badge variant="outline" className="ml-2 text-xs">{e.status}</Badge></div>
                <div className="text-xs text-muted-foreground">{e.body_region || "—"} · {e.category || "—"} · {e.difficulty || "—"}</div>
              </div>
            </label>
          ))}
          {filtered.length === 0 && <p className="text-center py-6 text-muted-foreground">No matches.</p>}
        </div>
        <div className="flex justify-between items-center pt-3 border-t">
          <span className="text-sm text-muted-foreground">{chosen.length} selected</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button disabled={chosen.length === 0} onClick={() => { onPick(chosen); onClose(); }}>
              Add {chosen.length || ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ---------- Wizard main ----------

const WizardInner = () => {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const programId = params.get("id") || "";
  const [step, setStep] = useState<number>(Number(params.get("step")) || 1);
  const [reloadKey, setReloadKey] = useState(0);
  const { data } = useFullProgramById(programId, reloadKey);

  const setStepAndURL = (s: number) => {
    setStep(s);
    const p = new URLSearchParams(params);
    p.set("step", String(s));
    if (programId) p.set("id", programId);
    setParams(p, { replace: true });
  };

  const reload = () => setReloadKey((k) => k + 1);

  // ----- Step 1 state (form) -----
  const [form, setForm] = useState({
    name: "", slug: "", body_region: "", pathology_id: "none",
    condition: "", intro_text: "", estimated_duration: "",
    acceptable_discomfort: DEFAULT_ACCEPTABLE_DISCOMFORT,
    reduce_or_stop: DEFAULT_REDUCE_OR_STOP,
    seek_medical_care: DEFAULT_SEEK_MEDICAL_CARE,
  });
  const [pathologies, setPathologies] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("pathologies").select("id, name").order("name");
      setPathologies(data || []);
    })();
  }, []);

  useEffect(() => {
    if (data?.program) {
      const p = data.program as any;
      setForm((f) => ({
        ...f,
        name: p.name || "",
        slug: p.slug || "",
        body_region: p.body_region || "",
        condition: p.condition || "",
        intro_text: p.intro_text || "",
        estimated_duration: p.estimated_duration || "",
        acceptable_discomfort: p.acceptable_discomfort || DEFAULT_ACCEPTABLE_DISCOMFORT,
        reduce_or_stop: p.reduce_or_stop || DEFAULT_REDUCE_OR_STOP,
        seek_medical_care: p.seek_medical_care || DEFAULT_SEEK_MEDICAL_CARE,
      }));
    }
  }, [data?.program?.id]);

  const persistDetails = async (): Promise<string | null> => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return null;
    }
    const payload: any = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      body_region: form.body_region || null,
      condition: form.condition || null,
      intro_text: form.intro_text || null,
      estimated_duration: form.estimated_duration || null,
      acceptable_discomfort: form.acceptable_discomfort || null,
      reduce_or_stop: form.reduce_or_stop || null,
      seek_medical_care: form.seek_medical_care || null,
    };
    if (programId) {
      const { error } = await sb.from("exercise_programs").update(payload).eq("id", programId);
      if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return null; }
      reload();
      return programId;
    }
    const { data: created, error } = await sb.from("exercise_programs")
      .insert({ ...payload, status: "draft" }).select("id").single();
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return null; }
    const p = new URLSearchParams(params);
    p.set("id", created.id);
    p.set("step", "2");
    setParams(p, { replace: true });
    setStep(2);
    reload();
    return created.id;
  };

  // ----- Step 2: phases -----
  const loadStarters = async () => {
    if (!programId) return;
    const base = data?.phases?.length ?? 0;
    const rows = STARTER_PHASES.map((s, i) => ({ ...s, program_id: programId, sort_order: base + i }));
    const { error } = await sb.from("program_phases").insert(rows);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    reload();
  };
  const addPhase = async () => {
    if (!programId) return;
    const nextOrder = data?.phases?.length ?? 0;
    await sb.from("program_phases").insert({ program_id: programId, sort_order: nextOrder, title: `Phase ${nextOrder + 1}` });
    reload();
  };
  const updatePhase = async (id: string, patch: any) => {
    await sb.from("program_phases").update(patch).eq("id", id);
    reload();
  };
  const delPhase = async (id: string) => {
    if (!confirm("Delete this phase and its exercises?")) return;
    await sb.from("program_phases").delete().eq("id", id);
    reload();
  };
  const movePhase = async (idx: number, dir: -1 | 1) => {
    if (!data) return;
    const phases = [...data.phases];
    const j = idx + dir;
    if (j < 0 || j >= phases.length) return;
    [phases[idx], phases[j]] = [phases[j], phases[idx]];
    await Promise.all(phases.map((p, i) => sb.from("program_phases").update({ sort_order: i }).eq("id", p.id)));
    reload();
  };
  const dupPhase = async (phId: string) => {
    if (!data) return;
    const src = data.phases.find((p) => p.id === phId)!;
    const { id: _i, exercises, created_at, updated_at, ...rest } = src as any;
    const { data: newPh } = await sb.from("program_phases")
      .insert({ ...rest, sort_order: data.phases.length, title: `${src.title} (copy)` })
      .select("id").single();
    if (newPh && src.exercises.length) {
      await sb.from("phase_exercises").insert(
        src.exercises.map((e) => ({
          phase_id: newPh.id, exercise_id: e.exercise_id, sort_order: e.sort_order,
          override_sets: e.override_sets, override_reps: e.override_reps,
          override_hold_seconds: e.override_hold_seconds, override_duration: e.override_duration,
          override_frequency: e.override_frequency, is_required: e.is_required,
        })),
      );
    }
    reload();
  };

  // ----- Step 3: exercises -----
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const [addingPhaseId, setAddingPhaseId] = useState<string | null>(null);

  const addExercises = async (phaseId: string, exerciseIds: string[]) => {
    const phase = data?.phases.find((p) => p.id === phaseId);
    const base = phase?.exercises.length ?? 0;
    const rows = exerciseIds.map((exId, i) => ({
      phase_id: phaseId, exercise_id: exId, sort_order: base + i, is_required: true,
    }));
    const { error } = await sb.from("phase_exercises").insert(rows);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    reload();
  };
  const updateEx = async (id: string, patch: any) => { await sb.from("phase_exercises").update(patch).eq("id", id); reload(); };
  const removeEx = async (id: string) => { await sb.from("phase_exercises").delete().eq("id", id); reload(); };
  const reorderEx = async (phaseId: string, oldIdx: number, newIdx: number) => {
    const phase = data?.phases.find((p) => p.id === phaseId);
    if (!phase) return;
    const list = arrayMove(phase.exercises, oldIdx, newIdx);
    await Promise.all(list.map((e, i) => sb.from("phase_exercises").update({ sort_order: i }).eq("id", e.id)));
    reload();
  };

  // ----- Step 5: publish & attach -----
  const [attachPathologyId, setAttachPathologyId] = useState<string>("none");
  useEffect(() => {
    setAttachPathologyId(form.pathology_id !== "none" ? form.pathology_id : "none");
  }, [form.pathology_id]);

  const publish = async (nextStatus: Status) => {
    if (!programId) return;
    const { error } = await sb.from("exercise_programs").update({ status: nextStatus }).eq("id", programId);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    if (attachPathologyId && attachPathologyId !== "none") {
      const { error: e2 } = await sb.from("pathologies").update({ exercise_program_id: programId }).eq("id", attachPathologyId);
      if (e2) return toast({ title: "Attach failed", description: e2.message, variant: "destructive" });
    }
    toast({ title: nextStatus === "published" ? "Program published" : "Draft saved" });
    reload();
  };

  const saveAsTemplate = async () => {
    if (!data) return;
    const name = prompt("Template name?", `${data.program.name} template`);
    if (!name) return;
    const { data: tpl, error } = await sb.from("program_templates").insert({
      name, description: null,
      body_region: data.program.body_region, condition: data.program.condition,
      intro_text: data.program.intro_text, estimated_duration: data.program.estimated_duration,
      acceptable_discomfort: (data.program as any).acceptable_discomfort,
      reduce_or_stop: (data.program as any).reduce_or_stop,
      seek_medical_care: (data.program as any).seek_medical_care,
    }).select("id").single();
    if (error || !tpl) return toast({ title: "Failed", description: error?.message, variant: "destructive" });
    for (const ph of data.phases) {
      const { id: _i, program_id, exercises, created_at, updated_at, ...rest } = ph as any;
      const { data: newPh } = await sb.from("template_phases").insert({ ...rest, template_id: tpl.id }).select("id").single();
      if (newPh && ph.exercises.length) {
        await sb.from("template_phase_exercises").insert(
          ph.exercises.map((e) => ({
            phase_id: newPh.id, exercise_id: e.exercise_id, sort_order: e.sort_order,
            override_sets: e.override_sets, override_reps: e.override_reps,
            override_hold_seconds: e.override_hold_seconds, override_duration: e.override_duration,
            override_frequency: e.override_frequency, is_required: e.is_required,
          })),
        );
      }
    }
    toast({ title: "Saved as template" });
  };

  // ---------- Render ----------

  const canAdvance = step === 1 ? !!form.name.trim() : !!programId;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/admin/programs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Programs
        </Link>
        <div className="flex gap-2">
          {programId && (
            <Button asChild variant="ghost" size="sm">
              <Link to={`/admin/programs/${programId}`}><ExternalLink className="w-4 h-4 mr-1" />Open full editor</Link>
            </Button>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Create Guided Program</h1>
        <p className="text-sm text-muted-foreground">A 5-step guided workflow for building a diagnosis-based exercise program.</p>
      </div>

      {/* Stepper */}
      <ol className="flex items-center gap-2 overflow-x-auto">
        {STEPS.map((s) => {
          const active = s.id === step;
          const done = s.id < step;
          return (
            <li key={s.id} className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => (s.id === 1 || programId) && setStepAndURL(s.id)}
                className={[
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border",
                  active ? "bg-primary text-primary-foreground border-primary" : done ? "bg-muted border-border" : "border-border text-muted-foreground",
                ].join(" ")}
              >
                <span className="w-5 h-5 inline-flex items-center justify-center rounded-full bg-background/40 text-xs">
                  {done ? <Check className="w-3 h-3" /> : s.id}
                </span>
                {s.label}
              </button>
              {s.id < STEPS.length && <span className="text-muted-foreground">›</span>}
            </li>
          );
        })}
      </ol>

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="font-semibold">Program details</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} /></div>
            <div><Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div><Label>Body region</Label>
              <Input value={form.body_region} onChange={(e) => setForm({ ...form, body_region: e.target.value })} /></div>
            <div><Label>Associated pathology</Label>
              <Select value={form.pathology_id} onValueChange={(v) => setForm({ ...form, pathology_id: v })}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {pathologies.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2"><Label>Short introduction</Label>
              <Textarea rows={3} value={form.intro_text} onChange={(e) => setForm({ ...form, intro_text: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Estimated overall duration</Label>
              <Input placeholder="e.g. 6–8 weeks" value={form.estimated_duration} onChange={(e) => setForm({ ...form, estimated_duration: e.target.value })} /></div>
          </div>

          <div className="pt-3 border-t space-y-3">
            <h3 className="font-medium text-sm">Pain & safety guidance (patients will see this)</h3>
            <div><Label className="text-xs">Acceptable discomfort</Label>
              <Textarea rows={2} value={form.acceptable_discomfort} onChange={(e) => setForm({ ...form, acceptable_discomfort: e.target.value })} /></div>
            <div><Label className="text-xs">When to reduce or stop</Label>
              <Textarea rows={2} value={form.reduce_or_stop} onChange={(e) => setForm({ ...form, reduce_or_stop: e.target.value })} /></div>
            <div><Label className="text-xs">When to seek medical care</Label>
              <Textarea rows={2} value={form.seek_medical_care} onChange={(e) => setForm({ ...form, seek_medical_care: e.target.value })} /></div>
          </div>

          <div className="flex justify-end">
            <Button onClick={async () => { await persistDetails(); }} disabled={!canAdvance}>
              Save & continue<ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Build Phases */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-border bg-card flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold">Build phases</h2>
              <p className="text-sm text-muted-foreground">Load a starter template or add phases manually. You can rename, reorder, duplicate, and delete.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadStarters}><Sparkles className="w-4 h-4 mr-1" />Load starter phases</Button>
              <Button onClick={addPhase}><Plus className="w-4 h-4 mr-1" />Add phase</Button>
            </div>
          </div>

          {data?.phases.map((ph, idx) => (
            <div key={ph.id} className="p-5 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Phase {idx + 1}</span>
                <div className="ml-auto flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => movePhase(idx, -1)} disabled={idx === 0}><ChevronUp className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => movePhase(idx, 1)} disabled={idx === (data?.phases.length ?? 0) - 1}><ChevronDown className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => dupPhase(ph.id)}><Copy className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => delPhase(ph.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Title</Label>
                  <Input defaultValue={ph.title} onBlur={(e) => e.target.value !== ph.title && updatePhase(ph.id, { title: e.target.value })} /></div>
                <div><Label>Frequency</Label>
                  <Input defaultValue={ph.frequency ?? ""} onBlur={(e) => updatePhase(ph.id, { frequency: e.target.value || null })} /></div>
                <div><Label>Estimated workout (min)</Label>
                  <Input type="number" defaultValue={ph.estimated_workout_minutes ?? ""} onBlur={(e) => updatePhase(ph.id, { estimated_workout_minutes: e.target.value ? Number(e.target.value) : null })} /></div>
                <div><Label>Approximate duration</Label>
                  <Input defaultValue={ph.approximate_duration ?? ""} onBlur={(e) => updatePhase(ph.id, { approximate_duration: e.target.value || null })} /></div>
                <div className="sm:col-span-2"><Label>Goal</Label>
                  <Textarea rows={2} defaultValue={ph.goal ?? ""} onBlur={(e) => updatePhase(ph.id, { goal: e.target.value || null })} /></div>
                <div className="sm:col-span-2"><Label>Progression criteria</Label>
                  <Textarea rows={2} defaultValue={ph.progression_criteria ?? ""} onBlur={(e) => updatePhase(ph.id, { progression_criteria: e.target.value || null })} /></div>
              </div>
            </div>
          ))}
          {(!data || data.phases.length === 0) && (
            <p className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">No phases yet.</p>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStepAndURL(1)}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
            <Button onClick={() => setStepAndURL(3)}>Continue<ArrowRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* Step 3: Exercises */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card">
            <h2 className="font-semibold">Add exercises to each phase</h2>
            <p className="text-sm text-muted-foreground">Search the Exercise Library, select multiple exercises, drag to reorder, and override prescriptions per phase.</p>
          </div>

          {data?.phases.map((ph) => (
            <div key={ph.id} className="p-5 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{ph.title}</h3>
                <Button size="sm" variant="outline" onClick={() => setAddingPhaseId(ph.id)}>
                  <Plus className="w-4 h-4 mr-1" />Add exercises
                </Button>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => {
                  const { active, over } = e;
                  if (!over || active.id === over.id) return;
                  const oldIdx = ph.exercises.findIndex((x) => x.id === active.id);
                  const newIdx = ph.exercises.findIndex((x) => x.id === over.id);
                  if (oldIdx >= 0 && newIdx >= 0) reorderEx(ph.id, oldIdx, newIdx);
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
                      <p className="text-sm text-muted-foreground py-3 text-center border border-dashed rounded">No exercises yet.</p>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          ))}

          {(!data || data.phases.length === 0) && (
            <p className="text-center py-8 text-muted-foreground">Go back to step 2 and add at least one phase.</p>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStepAndURL(2)}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
            <Button onClick={() => setStepAndURL(4)}>Continue<ArrowRight className="w-4 h-4 ml-1" /></Button>
          </div>

          <MultiPickDialog
            open={!!addingPhaseId}
            onClose={() => setAddingPhaseId(null)}
            onPick={(ids) => addingPhaseId && addExercises(addingPhaseId, ids)}
          />
        </div>
      )}

      {/* Step 4: Preview */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card">
            <h2 className="font-semibold">Patient preview</h2>
            <p className="text-sm text-muted-foreground">This is exactly what a patient will see. Drafts preview too — publish in the next step.</p>
          </div>
          {data?.program?.slug ? (
            <iframe
              title="Preview"
              src={`/programs/${data.program.slug}`}
              className="w-full h-[900px] rounded-xl border border-border bg-background"
            />
          ) : <p className="text-muted-foreground">Loading preview…</p>}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStepAndURL(3)}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
            <Button onClick={() => setStepAndURL(5)}>Continue<ArrowRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* Step 5: Publish & attach */}
      {step === 5 && (
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="font-semibold">Publish & attach</h2>
          <p className="text-sm text-muted-foreground">
            Status: <Badge variant={data?.program.status === "published" ? "default" : "outline"}>{data?.program.status}</Badge>
          </p>

          <div>
            <Label>Attach to pathology</Label>
            <Select value={attachPathologyId} onValueChange={setAttachPathologyId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Don't attach —</SelectItem>
                {pathologies.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              You can also attach this program later from the pathology editor.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-between items-center pt-3 border-t">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStepAndURL(4)}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
              <Button variant="outline" onClick={saveAsTemplate}>Save as template</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => publish("draft")}>Save as draft</Button>
              <Button onClick={() => publish("published")}>Publish</Button>
            </div>
          </div>

          {data?.program.status === "published" && (
            <div className="pt-3 border-t">
              <Button asChild variant="link" className="px-0">
                <Link to={`/programs/${data.program.slug}`} target="_blank">View published program →</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AdminProgramWizard = () => (
  <RequireAdmin><Layout><WizardInner /></Layout></RequireAdmin>
);
export default AdminProgramWizard;
