import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
  ArrowLeft, Plus, Trash2, Copy, GripVertical, ChevronUp, ChevronDown, ExternalLink, Search,
} from "lucide-react";
import {
  DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useFullProgramById } from "@/hooks/usePrograms";
import { useLibraryExercises } from "@/hooks/usePrograms";
import { prescription, type LibraryExercise, type PhaseExercise, type Status } from "@/lib/programTypes";

const sb = supabase as any;

const SortableExerciseRow = ({
  pe, onChange, onRemove,
}: { pe: PhaseExercise; onChange: (patch: Partial<PhaseExercise>) => void; onRemove: () => void; }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: pe.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const ex = pe.exercise!;
  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 p-3 rounded-md border border-border bg-background">
      <button className="cursor-grab pt-1 text-muted-foreground" {...attributes} {...listeners}><GripVertical className="w-4 h-4" /></button>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{ex?.name || "(missing exercise)"}</span>
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

const AddExerciseDialog = ({
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
              <div className="font-medium">{e.name} <Badge variant="outline" className="ml-2 text-xs">{e.status}</Badge></div>
              <div className="text-xs text-muted-foreground">{e.body_region || "—"} · {e.category || "—"}</div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-center py-6 text-muted-foreground">No matches.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Builder = () => {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const { data, loading } = useFullProgramById(id, reloadKey);

  const [meta, setMeta] = useState<any>(null);
  const [addingPhaseId, setAddingPhaseId] = useState<string | null>(null);

  useEffect(() => {
    if (data) setMeta(data.program);
  }, [data]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const saveMeta = async () => {
    const { error } = await sb.from("exercise_programs").update({
      name: meta.name,
      slug: meta.slug,
      body_region: meta.body_region || null,
      condition: meta.condition || null,
      intro_text: meta.intro_text || null,
      estimated_duration: meta.estimated_duration || null,
      status: meta.status,
    }).eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Program saved" });
    setReloadKey((k) => k + 1);
  };

  const addPhase = async () => {
    const nextOrder = (data?.phases?.length ?? 0);
    const { error } = await sb.from("program_phases").insert({
      program_id: id, sort_order: nextOrder, title: `Phase ${nextOrder + 1}`,
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setReloadKey((k) => k + 1);
  };

  const updatePhase = async (phaseId: string, patch: any) => {
    await sb.from("program_phases").update(patch).eq("id", phaseId);
    setReloadKey((k) => k + 1);
  };

  const deletePhase = async (phaseId: string) => {
    if (!confirm("Delete this phase and all its exercises?")) return;
    await sb.from("program_phases").delete().eq("id", phaseId);
    setReloadKey((k) => k + 1);
  };

  const movePhase = async (idx: number, dir: -1 | 1) => {
    if (!data) return;
    const phases = [...data.phases];
    const j = idx + dir;
    if (j < 0 || j >= phases.length) return;
    [phases[idx], phases[j]] = [phases[j], phases[idx]];
    await Promise.all(phases.map((p, i) => sb.from("program_phases").update({ sort_order: i }).eq("id", p.id)));
    setReloadKey((k) => k + 1);
  };

  const duplicatePhase = async (phaseId: string) => {
    if (!data) return;
    const src = data.phases.find((p) => p.id === phaseId)!;
    const { id: _i, exercises, created_at, updated_at, ...rest } = src as any;
    const { data: newPh } = await sb.from("program_phases").insert({
      ...rest, sort_order: data.phases.length, title: `${src.title} (copy)`,
    }).select("id").single();
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
    setReloadKey((k) => k + 1);
  };

  const addExercise = async (phaseId: string, ex: LibraryExercise) => {
    const phase = data?.phases.find((p) => p.id === phaseId);
    const nextOrder = phase?.exercises.length ?? 0;
    await sb.from("phase_exercises").insert({
      phase_id: phaseId, exercise_id: ex.id, sort_order: nextOrder, is_required: true,
    });
    setReloadKey((k) => k + 1);
  };

  const updateEx = async (peId: string, patch: any) => {
    await sb.from("phase_exercises").update(patch).eq("id", peId);
    setReloadKey((k) => k + 1);
  };

  const removeEx = async (peId: string) => {
    await sb.from("phase_exercises").delete().eq("id", peId);
    setReloadKey((k) => k + 1);
  };

  const reorderExercises = async (phaseId: string, oldIdx: number, newIdx: number) => {
    const phase = data?.phases.find((p) => p.id === phaseId);
    if (!phase) return;
    const list = arrayMove(phase.exercises, oldIdx, newIdx);
    await Promise.all(list.map((e, i) => sb.from("phase_exercises").update({ sort_order: i }).eq("id", e.id)));
    setReloadKey((k) => k + 1);
  };

  if (loading || !meta || !data) return <div className="container mx-auto py-16 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/admin/programs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Programs
        </Link>
        <div className="flex gap-2">
          {meta.status === "published" && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/programs/${meta.slug}`} target="_blank"><ExternalLink className="w-4 h-4 mr-1" />Preview</Link>
            </Button>
          )}
          <Button onClick={saveMeta}>Save program</Button>
        </div>
      </div>

      <div className="p-5 rounded-xl border border-border bg-card space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Name</Label><Input value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} /></div>
          <div><Label>Slug</Label><Input value={meta.slug} onChange={(e) => setMeta({ ...meta, slug: e.target.value })} /></div>
          <div><Label>Body region</Label><Input value={meta.body_region ?? ""} onChange={(e) => setMeta({ ...meta, body_region: e.target.value })} /></div>
          <div><Label>Condition / diagnosis</Label><Input value={meta.condition ?? ""} onChange={(e) => setMeta({ ...meta, condition: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Estimated overall duration</Label>
            <Input placeholder="e.g. 6–8 weeks" value={meta.estimated_duration ?? ""} onChange={(e) => setMeta({ ...meta, estimated_duration: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Introductory text</Label>
            <Textarea rows={3} value={meta.intro_text ?? ""} onChange={(e) => setMeta({ ...meta, intro_text: e.target.value })} /></div>
          <div><Label>Status</Label>
            <Select value={meta.status} onValueChange={(v) => setMeta({ ...meta, status: v as Status })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Phases</h2>
          <Button size="sm" onClick={addPhase}><Plus className="w-4 h-4 mr-1" />Add phase</Button>
        </div>

        {data.phases.map((ph, idx) => (
          <div key={ph.id} className="p-5 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Phase {idx + 1}</span>
              <div className="ml-auto flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => movePhase(idx, -1)} disabled={idx === 0}><ChevronUp className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => movePhase(idx, 1)} disabled={idx === data.phases.length - 1}><ChevronDown className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => duplicatePhase(ph.id)}><Copy className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => deletePhase(ph.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Title</Label>
                <Input value={ph.title} onBlur={(e) => e.target.value !== ph.title && updatePhase(ph.id, { title: e.target.value })}
                  onChange={(e) => (ph.title = e.target.value)} defaultValue={ph.title} /></div>
              <div><Label>Frequency</Label>
                <Input defaultValue={ph.frequency ?? ""} onBlur={(e) => updatePhase(ph.id, { frequency: e.target.value || null })} /></div>
              <div><Label>Estimated workout (min)</Label>
                <Input type="number" defaultValue={ph.estimated_workout_minutes ?? ""} onBlur={(e) => updatePhase(ph.id, { estimated_workout_minutes: e.target.value ? Number(e.target.value) : null })} /></div>
              <div><Label>Approximate duration</Label>
                <Input placeholder="e.g. 2 weeks" defaultValue={ph.approximate_duration ?? ""} onBlur={(e) => updatePhase(ph.id, { approximate_duration: e.target.value || null })} /></div>
              <div className="sm:col-span-2"><Label>Goal</Label>
                <Textarea rows={2} defaultValue={ph.goal ?? ""} onBlur={(e) => updatePhase(ph.id, { goal: e.target.value || null })} /></div>
              <div className="sm:col-span-2"><Label>Progression criteria</Label>
                <Textarea rows={2} defaultValue={ph.progression_criteria ?? ""} onBlur={(e) => updatePhase(ph.id, { progression_criteria: e.target.value || null })} /></div>
              <div className="sm:col-span-2"><Label>Warning / guidance (optional)</Label>
                <Textarea rows={2} defaultValue={ph.warning_text ?? ""} onBlur={(e) => updatePhase(ph.id, { warning_text: e.target.value || null })} /></div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Exercises</h3>
                <Button size="sm" variant="outline" onClick={() => setAddingPhaseId(ph.id)}><Plus className="w-4 h-4 mr-1" />Add exercise</Button>
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
                      <SortableExerciseRow
                        key={pe.id}
                        pe={pe}
                        onChange={(patch) => updateEx(pe.id, patch)}
                        onRemove={() => removeEx(pe.id)}
                      />
                    ))}
                    {ph.exercises.length === 0 && <p className="text-sm text-muted-foreground py-3 text-center border border-dashed rounded">No exercises yet.</p>}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        ))}

        {data.phases.length === 0 && <p className="text-center py-6 text-muted-foreground">No phases yet. Add one to get started.</p>}
      </div>

      <AddExerciseDialog
        open={!!addingPhaseId}
        onClose={() => setAddingPhaseId(null)}
        onPick={(e) => addingPhaseId && addExercise(addingPhaseId, e)}
      />
    </div>
  );
};

const AdminProgramBuilder = () => (
  <RequireAdmin><Layout><Builder /></Layout></RequireAdmin>
);

export default AdminProgramBuilder;
