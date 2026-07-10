import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import RequireAdmin from "@/components/RequireAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Copy, Search, ExternalLink, ArrowLeft } from "lucide-react";
import {
  EXERCISE_CATEGORIES, DIFFICULTIES, slugify, readiness, READINESS_LABEL,
  type LibraryExercise, type Status,
} from "@/lib/programTypes";

const sb = supabase as any;

const empty = (): LibraryExercise => ({
  id: "", slug: "", name: "", body_region: "", category: null, difficulty: null,
  equipment: "", image_url: "", video_url: "", short_description: "", instructions: "",
  default_sets: null, default_reps: null, default_hold_seconds: null, default_frequency: "",
  what_to_feel: "", common_mistakes: "", safety_notes: "", status: "draft",
});

const AdminExerciseLibraryInner = () => {
  const [items, setItems] = useState<LibraryExercise[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<LibraryExercise | null>(null);
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all");

  const load = async () => {
    const [{ data }, { data: pe }] = await Promise.all([
      sb.from("exercise_library").select("*").order("name"),
      sb.from("phase_exercises").select("exercise_id"),
    ]);
    setItems((data || []) as LibraryExercise[]);
    const u: Record<string, number> = {};
    (pe || []).forEach((r: any) => { u[r.exercise_id] = (u[r.exercise_id] || 0) + 1; });
    setUsage(u);
  };
  useEffect(() => { load(); }, []);

  const regions = useMemo(
    () => Array.from(new Set(items.map((i) => i.body_region).filter(Boolean))) as string[],
    [items],
  );

  const filtered = items.filter((i) => {
    if (q && !i.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (region !== "all" && i.body_region !== region) return false;
    if (category !== "all" && i.category !== category) return false;
    if (difficulty !== "all" && i.difficulty !== difficulty) return false;
    if (status !== "all" && i.status !== status) return false;
    return true;
  });

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    if (editing.status === "published") {
      const r = readiness(editing);
      if (r.status !== "ready") {
        const proceed = confirm(
          `This exercise is only ${r.percent}% complete.\nStill missing: ${r.missing.join(", ")}.\n\nPublish anyway?`,
        );
        if (!proceed) return;
      }
    }
    const payload: any = {
      slug: editing.slug?.trim() || slugify(editing.name),
      name: editing.name.trim(),
      body_region: editing.body_region || null,
      category: editing.category,
      difficulty: editing.difficulty,
      equipment: editing.equipment || null,
      image_url: editing.image_url || null,
      video_url: editing.video_url || null,
      short_description: editing.short_description || null,
      instructions: editing.instructions || null,
      default_sets: editing.default_sets ?? null,
      default_reps: editing.default_reps ?? null,
      default_hold_seconds: editing.default_hold_seconds ?? null,
      default_frequency: editing.default_frequency || null,
      what_to_feel: editing.what_to_feel || null,
      common_mistakes: editing.common_mistakes || null,
      safety_notes: editing.safety_notes || null,
      status: editing.status,
    };
    const { error } = editing.id
      ? await sb.from("exercise_library").update(payload).eq("id", editing.id)
      : await sb.from("exercise_library").insert(payload);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Exercise saved" });
    setEditing(null);
    load();
  };

  const publish = async (item: LibraryExercise, nextStatus: Status) => {
    if (nextStatus === "published") {
      const r = readiness(item);
      if (r.status !== "ready") {
        const proceed = confirm(
          `This exercise is only ${r.percent}% complete.\nStill missing: ${r.missing.join(", ")}.\n\nPublish anyway?`,
        );
        if (!proceed) return;
      }
    }
    const { error } = await sb.from("exercise_library").update({ status: nextStatus }).eq("id", item.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    load();
  };

  const duplicate = async (item: LibraryExercise) => {
    const { id, ...rest } = item as any;
    const copy = { ...rest, name: `${item.name} (copy)`, slug: `${item.slug}-copy-${Date.now().toString(36)}`, status: "draft" };
    const { error } = await sb.from("exercise_library").insert(copy);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    load();
  };

  const del = async (item: LibraryExercise) => {
    const used = usage[item.id] || 0;
    const msg = used > 0
      ? `WARNING: this exercise is used in ${used} program(s). Deleting will fail while it's in use. Continue?`
      : "Delete this exercise?";
    if (!confirm(msg)) return;
    const { error } = await sb.from("exercise_library").delete().eq("id", item.id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    load();
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
            <ArrowLeft className="w-4 h-4" /> Admin
          </Link>
          <h1 className="text-3xl font-bold">Exercise Library</h1>
          <p className="text-muted-foreground text-sm">Reusable exercises used across programs.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/admin/programs">Programs</Link></Button>
          <Button onClick={() => setEditing(empty())}><Plus className="w-4 h-4 mr-2" />New Exercise</Button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-5 mb-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search by name..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regions</SelectItem>
            {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {EXERCISE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All difficulty</SelectItem>
            {DIFFICULTIES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="mb-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map((i) => {
          const r = readiness(i);
          const rTone = r.status === "ready" ? "default" : r.status === "nearly" ? "secondary" : "outline";
          return (
          <div key={i.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium">{i.name}</h3>
                <Badge variant={i.status === "published" ? "default" : "outline"}>{i.status}</Badge>
                {i.category && <Badge variant="secondary">{EXERCISE_CATEGORIES.find(c=>c.value===i.category)?.label}</Badge>}
                {i.difficulty && <Badge variant="outline">{i.difficulty}</Badge>}
                <Badge variant={rTone as any} title={r.missing.length ? `Missing: ${r.missing.join(", ")}` : "All fields present"}>
                  {READINESS_LABEL[r.status]} · {r.percent}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {i.body_region || "—"} · Used in {usage[i.id] || 0} program(s)
                {r.missing.length > 0 && ` · Missing: ${r.missing.join(", ")}`}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => publish(i, i.status === "published" ? "draft" : "published")}>
                {i.status === "published" ? "Unpublish" : "Publish"}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => duplicate(i)} aria-label="Duplicate"><Copy className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => setEditing({ ...i })} aria-label="Edit"><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => del(i)} aria-label="Delete"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">No exercises.</p>}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit Exercise" : "New Exercise"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Name</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.slug || slugify(e.target.value) })} />
                </div>
                <div><Label>Slug</Label>
                  <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
                </div>
                <div><Label>Body region</Label>
                  <Input value={editing.body_region ?? ""} onChange={(e) => setEditing({ ...editing, body_region: e.target.value })} />
                </div>
                <div><Label>Equipment</Label>
                  <Input value={editing.equipment ?? ""} onChange={(e) => setEditing({ ...editing, equipment: e.target.value })} />
                </div>
                <div><Label>Category</Label>
                  <Select value={editing.category ?? ""} onValueChange={(v) => setEditing({ ...editing, category: v as any })}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {EXERCISE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Difficulty</Label>
                  <Select value={editing.difficulty ?? ""} onValueChange={(v) => setEditing({ ...editing, difficulty: v as any })}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Image URL</Label>
                  <Input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} />
                </div>
                <div><Label>Video URL</Label>
                  <Input value={editing.video_url ?? ""} onChange={(e) => setEditing({ ...editing, video_url: e.target.value })} />
                </div>
              </div>
              <div><Label>Short description</Label>
                <Input value={editing.short_description ?? ""} onChange={(e) => setEditing({ ...editing, short_description: e.target.value })} />
              </div>
              <div><Label>Step-by-step instructions</Label>
                <Textarea rows={5} value={editing.instructions ?? ""} onChange={(e) => setEditing({ ...editing, instructions: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><Label>Default sets</Label>
                  <Input type="number" value={editing.default_sets ?? ""} onChange={(e) => setEditing({ ...editing, default_sets: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div><Label>Default reps</Label>
                  <Input type="number" value={editing.default_reps ?? ""} onChange={(e) => setEditing({ ...editing, default_reps: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div><Label>Default hold (sec)</Label>
                  <Input type="number" value={editing.default_hold_seconds ?? ""} onChange={(e) => setEditing({ ...editing, default_hold_seconds: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div><Label>Default frequency</Label>
                  <Input placeholder="e.g. 2x/day" value={editing.default_frequency ?? ""} onChange={(e) => setEditing({ ...editing, default_frequency: e.target.value })} />
                </div>
              </div>
              <div><Label>What the patient should feel</Label>
                <Textarea rows={2} value={editing.what_to_feel ?? ""} onChange={(e) => setEditing({ ...editing, what_to_feel: e.target.value })} />
              </div>
              <div><Label>Common mistakes</Label>
                <Textarea rows={2} value={editing.common_mistakes ?? ""} onChange={(e) => setEditing({ ...editing, common_mistakes: e.target.value })} />
              </div>
              <div><Label>Safety / stop instructions</Label>
                <Textarea rows={2} value={editing.safety_notes ?? ""} onChange={(e) => setEditing({ ...editing, safety_notes: e.target.value })} />
              </div>
              <div><Label>Status</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v as Status })}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editing.id && editing.status === "published" && (
                <a
                  href={`/exercise-library/preview/${editing.slug}`}
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                >
                  <ExternalLink className="w-3 h-3" /> Preview not linked publicly — used inside programs.
                </a>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AdminExerciseLibrary = () => (
  <RequireAdmin><Layout><AdminExerciseLibraryInner /></Layout></RequireAdmin>
);

export default AdminExerciseLibrary;
