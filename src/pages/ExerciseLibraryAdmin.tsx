import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import RequireAdmin from "@/components/RequireAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { Pencil, Plus, Search, SlidersHorizontal, Tag, Trash2, X } from "lucide-react";

type Difficulty = "beginner" | "intermediate" | "advanced";
type RehabPhase =
  | "acute"
  | "early_rehab"
  | "strengthening"
  | "return_to_activity"
  | "maintenance";

interface BodyLocation { id: string; name: string; slug: string }
interface Pathology { id: string; name: string; slug: string; body_location_id: string | null }
interface RehabExercise {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  full_instructions: string | null;
  difficulty: Difficulty | null;
  rehab_phase: RehabPhase | null;
  equipment_needed: string | null;
  precautions: string | null;
  image_url: string | null;
  video_url: string | null;
  is_active: boolean;
  is_general_exercise: boolean;
  location_ids: string[];
  pathology_ids: string[];
}

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];
const PHASES: { value: RehabPhase; label: string }[] = [
  { value: "acute", label: "Acute" },
  { value: "early_rehab", label: "Early Rehab" },
  { value: "strengthening", label: "Strengthening" },
  { value: "return_to_activity", label: "Return to Activity" },
  { value: "maintenance", label: "Maintenance" },
];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const sb = supabase as any;

const emptyExercise = (): RehabExercise => ({
  id: "",
  title: "",
  slug: "",
  short_description: "",
  full_instructions: "",
  difficulty: null,
  rehab_phase: null,
  equipment_needed: "",
  precautions: "",
  image_url: "",
  video_url: "",
  is_active: true,
  is_general_exercise: false,
  location_ids: [],
  pathology_ids: [],
});

function MultiTagPicker({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
}) {
  const [q, setQ] = useState("");
  const selectedSet = new Set(selected);
  const filtered = options.filter(
    (o) => !selectedSet.has(o.id) && o.name.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
        {selected.map((id) => {
          const o = options.find((x) => x.id === id);
          if (!o) return null;
          return (
            <Badge key={id} variant="secondary" className="gap-1">
              {o.name}
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s !== id))}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
      </div>
      <Input
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {q && filtered.length > 0 && (
        <div className="border rounded-md max-h-40 overflow-auto">
          {filtered.slice(0, 20).map((o) => (
            <button
              key={o.id}
              type="button"
              className="w-full text-left px-3 py-1.5 hover:bg-accent text-sm"
              onClick={() => {
                onChange([...selected, o.id]);
                setQ("");
              }}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ManageTaxonomiesDialog({
  locations,
  pathologies,
  reload,
}: {
  locations: BodyLocation[];
  pathologies: Pathology[];
  reload: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [locName, setLocName] = useState("");
  const [pathName, setPathName] = useState("");
  const [pathLoc, setPathLoc] = useState<string>("none");

  const addLocation = async () => {
    if (!locName.trim()) return;
    const { error } = await sb
      .from("body_locations")
      .insert({ name: locName.trim(), slug: slugify(locName) });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setLocName("");
    reload();
  };
  const deleteLocation = async (id: string) => {
    if (!confirm("Delete this body location?")) return;
    const { error } = await sb.from("body_locations").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    reload();
  };
  const addPathology = async () => {
    if (!pathName.trim()) return;
    const { error } = await sb.from("pathologies").insert({
      name: pathName.trim(),
      slug: slugify(pathName),
      body_location_id: pathLoc === "none" ? null : pathLoc,
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setPathName("");
    setPathLoc("none");
    reload();
  };
  const deletePathology = async (id: string) => {
    if (!confirm("Delete this pathology?")) return;
    const { error } = await sb.from("pathologies").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    reload();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Tag className="h-4 w-4" /> Manage Tags
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Body Locations & Pathologies</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Body Locations</h3>
            <div className="flex gap-2 mb-3">
              <Input
                value={locName}
                onChange={(e) => setLocName(e.target.value)}
                placeholder="e.g. Shoulder"
              />
              <Button onClick={addLocation}>Add</Button>
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {locations.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-accent">
                  <span>{l.name}</span>
                  <button onClick={() => deleteLocation(l.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Pathologies</h3>
            <div className="space-y-2 mb-3">
              <Input
                value={pathName}
                onChange={(e) => setPathName(e.target.value)}
                placeholder="e.g. Rotator cuff tear"
              />
              <Select value={pathLoc} onValueChange={setPathLoc}>
                <SelectTrigger><SelectValue placeholder="Linked body location (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No body location</SelectItem>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addPathology} className="w-full">Add Pathology</Button>
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {pathologies.map((p) => {
                const loc = locations.find((l) => l.id === p.body_location_id);
                return (
                  <div key={p.id} className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-accent">
                    <span>
                      {p.name}
                      {loc && <span className="text-muted-foreground ml-1">· {loc.name}</span>}
                    </span>
                    <button onClick={() => deletePathology(p.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExerciseEditor({
  open,
  onOpenChange,
  initial,
  locations,
  pathologies,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: RehabExercise;
  locations: BodyLocation[];
  pathologies: Pathology[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState<RehabExercise>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(initial); }, [initial, open]);

  const isEdit = !!initial.id;
  const set = (patch: Partial<RehabExercise>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        short_description: form.short_description || null,
        full_instructions: form.full_instructions || null,
        difficulty: form.difficulty,
        rehab_phase: form.rehab_phase,
        equipment_needed: form.equipment_needed || null,
        precautions: form.precautions || null,
        image_url: form.image_url || null,
        video_url: form.video_url || null,
        is_active: form.is_active,
        is_general_exercise: form.is_general_exercise,
      };

      let exId = form.id;
      if (isEdit) {
        const { error } = await sb.from("rehab_exercises").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { data, error } = await sb
          .from("rehab_exercises")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        exId = data.id;
      }

      await sb.from("rehab_exercise_locations").delete().eq("exercise_id", exId);
      await sb.from("rehab_exercise_pathologies").delete().eq("exercise_id", exId);
      if (form.location_ids.length) {
        await sb.from("rehab_exercise_locations").insert(
          form.location_ids.map((body_location_id) => ({ exercise_id: exId, body_location_id }))
        );
      }
      if (form.pathology_ids.length) {
        await sb.from("rehab_exercise_pathologies").insert(
          form.pathology_ids.map((pathology_id) => ({ exercise_id: exId, pathology_id }))
        );
      }

      toast({ title: isEdit ? "Exercise updated" : "Exercise created" });
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!isEdit) return;
    if (!confirm("Delete this exercise? This cannot be undone.")) return;
    const { error } = await sb.from("rehab_exercises").delete().eq("id", form.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Exercise deleted" });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Exercise" : "New Exercise"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => set({ title: e.target.value, slug: form.slug || slugify(e.target.value) })} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => set({ slug: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Short description</Label>
            <Input value={form.short_description ?? ""} onChange={(e) => set({ short_description: e.target.value })} />
          </div>
          <div>
            <Label>Full instructions</Label>
            <Textarea rows={5} value={form.full_instructions ?? ""} onChange={(e) => set({ full_instructions: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Body locations</Label>
              <MultiTagPicker
                options={locations}
                selected={form.location_ids}
                onChange={(ids) => set({ location_ids: ids })}
                placeholder="Search body locations..."
              />
            </div>
            <div>
              <Label>Pathologies</Label>
              <MultiTagPicker
                options={pathologies}
                selected={form.pathology_ids}
                onChange={(ids) => set({ pathology_ids: ids })}
                placeholder="Search pathologies..."
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Difficulty</Label>
              <Select value={form.difficulty ?? ""} onValueChange={(v) => set({ difficulty: v as Difficulty })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rehab phase</Label>
              <Select value={form.rehab_phase ?? ""} onValueChange={(v) => set({ rehab_phase: v as RehabPhase })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {PHASES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Equipment needed</Label>
              <Input value={form.equipment_needed ?? ""} onChange={(e) => set({ equipment_needed: e.target.value })} />
            </div>
            <div>
              <Label>Precautions</Label>
              <Input value={form.precautions ?? ""} onChange={(e) => set({ precautions: e.target.value })} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Image URL</Label>
              <Input value={form.image_url ?? ""} onChange={(e) => set({ image_url: e.target.value })} />
            </div>
            <div>
              <Label>Video URL</Label>
              <Input value={form.video_url ?? ""} onChange={(e) => set({ video_url: e.target.value })} />
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 flex items-start gap-3">
            <Switch
              checked={form.is_general_exercise}
              onCheckedChange={(v) => set({ is_general_exercise: v })}
            />
            <div>
              <Label className="cursor-pointer">General exercise for selected joint(s)</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Use this for general mobility, stretching, strengthening, or maintenance exercises that should appear at the top of a joint page before diagnosis-specific exercises.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_active} onCheckedChange={(v) => set({ is_active: v })} />
            <Label>Active (visible to patients)</Label>
          </div>
        </div>
        <DialogFooter className="gap-2 flex-wrap">
          {isEdit && (
            <Button variant="destructive" onClick={del} className="mr-auto gap-2">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExerciseLibraryAdminInner() {
  const [locations, setLocations] = useState<BodyLocation[]>([]);
  const [pathologies, setPathologies] = useState<Pathology[]>([]);
  const [exercises, setExercises] = useState<RehabExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RehabExercise>(emptyExercise());

  const [q, setQ] = useState("");
  const [fLoc, setFLoc] = useState("all");
  const [fPath, setFPath] = useState("all");
  const [fDiff, setFDiff] = useState("all");
  const [fPhase, setFPhase] = useState("all");
  const [fActive, setFActive] = useState("all");

  const loadTax = async () => {
    const [{ data: locs }, { data: paths }] = await Promise.all([
      sb.from("body_locations").select("*").order("name"),
      sb.from("pathologies").select("*").order("name"),
    ]);
    setLocations(locs ?? []);
    setPathologies(paths ?? []);
  };

  const loadExercises = async () => {
    setLoading(true);
    const { data: ex } = await sb
      .from("rehab_exercises")
      .select("*")
      .order("updated_at", { ascending: false });
    const { data: relLoc } = await sb.from("rehab_exercise_locations").select("*");
    const { data: relPath } = await sb.from("rehab_exercise_pathologies").select("*");
    const byLoc = new Map<string, string[]>();
    const byPath = new Map<string, string[]>();
    (relLoc ?? []).forEach((r: any) => {
      const arr = byLoc.get(r.exercise_id) ?? [];
      arr.push(r.body_location_id);
      byLoc.set(r.exercise_id, arr);
    });
    (relPath ?? []).forEach((r: any) => {
      const arr = byPath.get(r.exercise_id) ?? [];
      arr.push(r.pathology_id);
      byPath.set(r.exercise_id, arr);
    });
    setExercises(
      (ex ?? []).map((e: any) => ({
        ...e,
        location_ids: byLoc.get(e.id) ?? [],
        pathology_ids: byPath.get(e.id) ?? [],
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    loadTax();
    loadExercises();
  }, []);

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      if (q && !`${e.title} ${e.short_description ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (fLoc !== "all" && !e.location_ids.includes(fLoc)) return false;
      if (fPath !== "all" && !e.pathology_ids.includes(fPath)) return false;
      if (fDiff !== "all" && e.difficulty !== fDiff) return false;
      if (fPhase !== "all" && e.rehab_phase !== fPhase) return false;
      if (fActive === "active" && !e.is_active) return false;
      if (fActive === "inactive" && e.is_active) return false;
      return true;
    });
  }, [exercises, q, fLoc, fPath, fDiff, fPhase, fActive]);

  const openNew = () => { setEditing(emptyExercise()); setEditorOpen(true); };
  const openEdit = (e: RehabExercise) => { setEditing(e); setEditorOpen(true); };

  const FiltersBlock = (
    <div className="grid gap-3">
      <Select value={fLoc} onValueChange={setFLoc}>
        <SelectTrigger><SelectValue placeholder="Body location" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All body locations</SelectItem>
          {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={fPath} onValueChange={setFPath}>
        <SelectTrigger><SelectValue placeholder="Pathology" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All pathologies</SelectItem>
          {pathologies.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={fDiff} onValueChange={setFDiff}>
        <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All difficulties</SelectItem>
          {DIFFICULTIES.map((d) => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={fPhase} onValueChange={setFPhase}>
        <SelectTrigger><SelectValue placeholder="Rehab phase" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All phases</SelectItem>
          {PHASES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={fActive} onValueChange={setFActive}>
        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="active">Active only</SelectItem>
          <SelectItem value="inactive">Inactive only</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto py-10 px-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Exercise Library</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage rehab exercises, body locations, and pathologies.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <ManageTaxonomiesDialog locations={locations} pathologies={pathologies} reload={loadTax} />
            <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add Exercise</Button>
          </div>
        </div>

        <Card className="p-4 mb-6">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by title or description..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2"><SlidersHorizontal className="h-4 w-4" /> Filters</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                  <div className="mt-4">{FiltersBlock}</div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          <div className="hidden md:grid mt-4 grid-cols-2 lg:grid-cols-5 gap-3">{FiltersBlock}</div>
        </Card>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading exercises...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No exercises match your filters. <button className="text-primary underline" onClick={openNew}>Add one</button>.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((e) => (
              <Card key={e.id} className="overflow-hidden flex flex-col">
                <div className="aspect-video bg-muted relative">
                  {e.image_url ? (
                    <img src={e.image_url} alt={e.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={e.is_active ? "default" : "secondary"}>
                      {e.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <h3 className="font-semibold leading-tight">{e.title}</h3>
                  {e.short_description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{e.short_description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {e.difficulty && <Badge variant="outline" className="capitalize">{e.difficulty}</Badge>}
                    {e.rehab_phase && <Badge variant="outline">{PHASES.find(p => p.value === e.rehab_phase)?.label}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {e.location_ids.map((id) => {
                      const l = locations.find((x) => x.id === id);
                      return l ? <Badge key={id} variant="secondary" className="text-xs">{l.name}</Badge> : null;
                    })}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {e.pathology_ids.map((id) => {
                      const p = pathologies.find((x) => x.id === id);
                      return p ? <Badge key={id} className="text-xs bg-primary/10 text-primary hover:bg-primary/15">{p.name}</Badge> : null;
                    })}
                  </div>
                  <Button variant="outline" size="sm" className="mt-auto gap-2" onClick={() => openEdit(e)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <ExerciseEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          initial={editing}
          locations={locations}
          pathologies={pathologies}
          onSaved={loadExercises}
        />
      </div>
    </Layout>
  );
}

export default function ExerciseLibraryAdmin() {
  return (
    <RequireAdmin>
      <ExerciseLibraryAdminInner />
    </RequireAdmin>
  );
}
