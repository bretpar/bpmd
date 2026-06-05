import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import RequireAdmin from "@/components/RequireAdmin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, X, LogOut, Search, ArrowUp, ArrowDown } from "lucide-react";
import ImportAdmin from "./ImportAdmin";

const sb = supabase as any;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type Joint = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

type Injury = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  is_active: boolean;
  sort_order: number;
  joint_ids: string[];
};

type RehabExercise = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  full_instructions: string | null;
  difficulty: string | null;
  rehab_phase: string | null;
  equipment_needed: string | null;
  precautions: string | null;
  image_url: string | null;
  video_url: string | null;
  is_active: boolean;
  is_general_exercise: boolean;
  sort_order: number;
  pathology_ids: string[];
};

const DIFFICULTIES = [
  { value: "beginner", label: "Easy" },
  { value: "intermediate", label: "Moderate" },
  { value: "advanced", label: "Advanced" },
];
const PHASES = [
  { value: "acute", label: "Acute" },
  { value: "early_rehab", label: "Early rehab" },
  { value: "strengthening", label: "Strengthening" },
  { value: "return_to_activity", label: "Return to activity" },
  { value: "maintenance", label: "Maintenance" },
];

/* ============ MultiPicker ============ */
function MultiPicker({
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
  const selSet = new Set(selected);
  const filtered = options.filter(
    (o) => !selSet.has(o.id) && o.name.toLowerCase().includes(q.toLowerCase())
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
        <div className="border rounded-md max-h-48 overflow-auto bg-popover">
          {filtered.slice(0, 30).map((o) => (
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

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><Label className="mb-1.5 block">{label}</Label>{children}</div>
);

const Row = ({
  title,
  subtitle,
  right,
  actions,
  onEdit,
  onDelete,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  actions?: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <div className="flex items-center justify-between gap-3 bg-card border rounded-lg p-3">
    <div className="min-w-0 flex-1">
      <div className="font-medium truncate">{title}</div>
      {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
    </div>
    {right}
    {actions}
    <div className="flex gap-1 shrink-0">
      <Button size="sm" variant="ghost" onClick={onEdit}><Pencil className="w-4 h-4" /></Button>
      <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="w-4 h-4" /></Button>
    </div>
  </div>
);

/* ============ Joints ============ */
const JointsAdmin = () => {
  const [items, setItems] = useState<Joint[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Joint | null>(null);
  const [q, setQ] = useState("");

  const load = async () => {
    const { data } = await sb
      .from("body_locations")
      .select("*")
      .order("sort_order")
      .order("name");
    setItems(data || []);
    const { data: links } = await sb
      .from("pathology_locations")
      .select("body_location_id");
    const c: Record<string, number> = {};
    (links || []).forEach((l: any) => {
      c[l.body_location_id] = (c[l.body_location_id] || 0) + 1;
    });
    setCounts(c);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload = {
      name: editing.name.trim(),
      slug: editing.slug?.trim() || slugify(editing.name),
      description: editing.description || null,
      is_active: editing.is_active,
      sort_order: editing.sort_order ?? 0,
    };
    const { error } = editing.id
      ? await sb.from("body_locations").update(payload).eq("id", editing.id)
      : await sb.from("body_locations").insert(payload);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Joint saved" });
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this joint? Injuries assigned to it will become unassigned from it.")) return;
    const { error } = await sb.from("body_locations").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    load();
  };

  const filtered = items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));

  const move = async (id: string, direction: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === id);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const a = items[idx];
    const b = items[targetIdx];
    await Promise.all([
      sb.from("body_locations").update({ sort_order: b.sort_order }).eq("id", a.id),
      sb.from("body_locations").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    load();
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search joints..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button onClick={() => setEditing({ id: "", name: "", slug: "", description: "", is_active: true, sort_order: items.length })}>
          <Plus className="w-4 h-4 mr-2" />New Joint
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.map((j, i) => (
          <Row
            key={j.id}
            title={j.name}
            subtitle={`Order: ${j.sort_order} · ${counts[j.id] || 0} injury(ies)`}
            right={
              <Badge variant={j.is_active ? "default" : "outline"}>
                {j.is_active ? "Active" : "Inactive"}
              </Badge>
            }
            actions={
              <div className="flex gap-0.5 shrink-0">
                <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => move(j.id, -1)} title="Move up">
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" disabled={i === filtered.length - 1} onClick={() => move(j.id, 1)} title="Move down">
                  <ArrowDown className="w-4 h-4" />
                </Button>
              </div>
            }
            onEdit={() => setEditing({ ...j })}
            onDelete={() => del(j.id)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">No joints found.</p>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} Joint</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <Field label="Name">
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.slug || slugify(e.target.value) })} />
              </Field>
              <Field label="Slug">
                <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
              </Field>
              <Field label="Description (optional)">
                <Textarea rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </Field>
              <Field label="Sort order">
                <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
              </Field>
              <div className="flex items-center gap-3">
                <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                <Label>Active</Label>
              </div>
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

/* ============ Injuries (pathologies) ============ */
const InjuriesAdmin = () => {
  const [items, setItems] = useState<Injury[]>([]);
  const [joints, setJoints] = useState<Joint[]>([]);
  const [exCounts, setExCounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Injury | null>(null);
  const [q, setQ] = useState("");
  const [jointFilter, setJointFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const load = async () => {
    const [{ data: pData }, { data: jData }, { data: links }, { data: exLinks }] = await Promise.all([
      sb.from("pathologies").select("*").order("sort_order").order("name"),
      sb.from("body_locations").select("*").order("sort_order").order("name"),
      sb.from("pathology_locations").select("pathology_id, body_location_id"),
      sb.from("rehab_exercise_pathologies").select("pathology_id"),
    ]);
    const jointMap: Record<string, string[]> = {};
    (links || []).forEach((r: any) => {
      (jointMap[r.pathology_id] ||= []).push(r.body_location_id);
    });
    setItems(
      (pData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        short_description: p.short_description,
        full_description: p.full_description,
        is_active: p.is_active ?? true,
        sort_order: p.sort_order ?? 0,
        joint_ids: jointMap[p.id] || [],
      }))
    );
    setJoints(jData || []);
    const ec: Record<string, number> = {};
    (exLinks || []).forEach((r: any) => {
      ec[r.pathology_id] = (ec[r.pathology_id] || 0) + 1;
    });
    setExCounts(ec);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) return toast({ title: "Name required", variant: "destructive" });
    const payload: any = {
      name: editing.name.trim(),
      slug: editing.slug?.trim() || slugify(editing.name),
      short_description: editing.short_description || null,
      full_description: editing.full_description || null,
      is_active: editing.is_active,
      sort_order: editing.sort_order ?? 0,
    };
    // Keep legacy body_location_id in sync with first selected joint
    payload.body_location_id = editing.joint_ids[0] || null;

    let id = editing.id;
    if (id) {
      const { error } = await sb.from("pathologies").update(payload).eq("id", id);
      if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      const { data, error } = await sb.from("pathologies").insert(payload).select("id").single();
      if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
      id = data.id;
    }
    await sb.from("pathology_locations").delete().eq("pathology_id", id);
    if (editing.joint_ids.length) {
      await sb.from("pathology_locations").insert(
        editing.joint_ids.map((body_location_id) => ({ pathology_id: id, body_location_id }))
      );
    }
    toast({ title: "Injury saved" });
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this injury?")) return;
    const { error } = await sb.from("pathologies").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    load();
  };

  const filtered = items.filter((i) => {
    if (q && !i.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (jointFilter !== "all" && !i.joint_ids.includes(jointFilter)) return false;
    if (activeFilter === "active" && !i.is_active) return false;
    if (activeFilter === "inactive" && i.is_active) return false;
    return true;
  });

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search injuries..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={jointFilter} onValueChange={setJointFilter}>
          <SelectTrigger><SelectValue placeholder="Filter by joint" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All joints</SelectItem>
            {joints.map((j) => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="inactive">Inactive only</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setEditing({ id: "", name: "", slug: "", short_description: "", full_description: "", is_active: true, sort_order: items.length, joint_ids: [] })}>
          <Plus className="w-4 h-4 mr-2" />New Injury
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.map((i) => (
          <Row
            key={i.id}
            title={i.name}
            subtitle={
              <span>
                {i.joint_ids.map((jid) => joints.find((j) => j.id === jid)?.name).filter(Boolean).join(", ") || "No joints"}
                {" · "}
                {exCounts[i.id] || 0} exercise(s)
              </span>
            }
            right={<Badge variant={i.is_active ? "default" : "outline"}>{i.is_active ? "Active" : "Inactive"}</Badge>}
            onEdit={() => setEditing({ ...i })}
            onDelete={() => del(i.id)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">No injuries found.</p>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} Injury</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Name">
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.slug || slugify(e.target.value) })} />
                </Field>
                <Field label="Slug">
                  <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
                </Field>
              </div>
              <Field label="Short description">
                <Input value={editing.short_description ?? ""} onChange={(e) => setEditing({ ...editing, short_description: e.target.value })} />
              </Field>
              <Field label="Full description (optional)">
                <Textarea rows={4} value={editing.full_description ?? ""} onChange={(e) => setEditing({ ...editing, full_description: e.target.value })} />
              </Field>
              <Field label="Assigned joints">
                <MultiPicker
                  options={joints.map((j) => ({ id: j.id, name: j.name }))}
                  selected={editing.joint_ids}
                  onChange={(ids) => setEditing({ ...editing, joint_ids: ids })}
                  placeholder="Search joints..."
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Sort order">
                  <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                </Field>
                <div className="flex items-end gap-3">
                  <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                  <Label>Active</Label>
                </div>
              </div>
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

/* ============ Exercises (rehab_exercises) ============ */
const ExercisesAdmin = () => {
  const [items, setItems] = useState<RehabExercise[]>([]);
  const [pathologies, setPathologies] = useState<{ id: string; name: string; joint_ids: string[] }[]>([]);
  const [joints, setJoints] = useState<Joint[]>([]);
  const [editing, setEditing] = useState<RehabExercise | null>(null);
  const [q, setQ] = useState("");
  const [jointFilter, setJointFilter] = useState<string>("all");
  const [injuryFilter, setInjuryFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const load = async () => {
    const [{ data: ex }, { data: pData }, { data: jData }, { data: pl }, { data: ep }] = await Promise.all([
      sb.from("rehab_exercises").select("*").order("sort_order").order("title"),
      sb.from("pathologies").select("id, name").order("name"),
      sb.from("body_locations").select("*").order("sort_order").order("name"),
      sb.from("pathology_locations").select("pathology_id, body_location_id"),
      sb.from("rehab_exercise_pathologies").select("exercise_id, pathology_id"),
    ]);
    const pjMap: Record<string, string[]> = {};
    (pl || []).forEach((r: any) => (pjMap[r.pathology_id] ||= []).push(r.body_location_id));
    setPathologies((pData || []).map((p: any) => ({ id: p.id, name: p.name, joint_ids: pjMap[p.id] || [] })));
    setJoints(jData || []);
    const epMap: Record<string, string[]> = {};
    (ep || []).forEach((r: any) => (epMap[r.exercise_id] ||= []).push(r.pathology_id));
    setItems(
      (ex || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        short_description: e.short_description,
        full_instructions: e.full_instructions,
        difficulty: e.difficulty,
        rehab_phase: e.rehab_phase,
        equipment_needed: e.equipment_needed,
        precautions: e.precautions,
        image_url: e.image_url,
        video_url: e.video_url,
        is_active: e.is_active,
        is_general_exercise: e.is_general_exercise,
        sort_order: e.sort_order ?? 0,
        pathology_ids: epMap[e.id] || [],
      }))
    );
  };
  useEffect(() => { load(); }, []);

  const derivedJoints = (pids: string[]): Joint[] => {
    const set = new Set<string>();
    pids.forEach((pid) => {
      const p = pathologies.find((x) => x.id === pid);
      p?.joint_ids.forEach((j) => set.add(j));
    });
    return joints.filter((j) => set.has(j.id));
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return toast({ title: "Title required", variant: "destructive" });
    const payload = {
      title: editing.title.trim(),
      slug: editing.slug?.trim() || slugify(editing.title),
      short_description: editing.short_description || null,
      full_instructions: editing.full_instructions || null,
      difficulty: editing.difficulty || null,
      rehab_phase: editing.rehab_phase || null,
      equipment_needed: editing.equipment_needed || null,
      precautions: editing.precautions || null,
      image_url: editing.image_url || null,
      video_url: editing.video_url || null,
      is_active: editing.is_active,
      is_general_exercise: editing.is_general_exercise,
      sort_order: editing.sort_order ?? 0,
    };
    let id = editing.id;
    if (id) {
      const { error } = await sb.from("rehab_exercises").update(payload).eq("id", id);
      if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      const { data, error } = await sb.from("rehab_exercises").insert(payload).select("id").single();
      if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
      id = data.id;
    }
    await sb.from("rehab_exercise_pathologies").delete().eq("exercise_id", id);
    // Also mirror locations from derived joints so existing public hook keeps working
    await sb.from("rehab_exercise_locations").delete().eq("exercise_id", id);
    if (editing.pathology_ids.length) {
      await sb.from("rehab_exercise_pathologies").insert(
        editing.pathology_ids.map((pathology_id) => ({ exercise_id: id, pathology_id }))
      );
    }
    const dj = derivedJoints(editing.pathology_ids);
    if (dj.length) {
      await sb.from("rehab_exercise_locations").insert(
        dj.map((j) => ({ exercise_id: id, body_location_id: j.id }))
      );
    }
    toast({ title: "Exercise saved" });
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this exercise?")) return;
    const { error } = await sb.from("rehab_exercises").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    load();
  };

  const filtered = useMemo(() => items.filter((e) => {
    if (q && !e.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (injuryFilter !== "all" && !e.pathology_ids.includes(injuryFilter)) return false;
    if (jointFilter !== "all") {
      const dj = derivedJoints(e.pathology_ids).map((j) => j.id);
      if (!dj.includes(jointFilter)) return false;
    }
    if (activeFilter === "active" && !e.is_active) return false;
    if (activeFilter === "inactive" && e.is_active) return false;
    return true;
  }), [items, q, injuryFilter, jointFilter, activeFilter, pathologies]);

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search exercises..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={jointFilter} onValueChange={setJointFilter}>
          <SelectTrigger><SelectValue placeholder="Joint" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All joints</SelectItem>
            {joints.map((j) => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={injuryFilter} onValueChange={setInjuryFilter}>
          <SelectTrigger><SelectValue placeholder="Injury" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All injuries</SelectItem>
            {pathologies.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="inactive">Inactive only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={() => setEditing({
        id: "", title: "", slug: "", short_description: "", full_instructions: "",
        difficulty: null, rehab_phase: null, equipment_needed: "", precautions: "",
        image_url: "", video_url: "", is_active: true, is_general_exercise: false,
        sort_order: items.length, pathology_ids: [],
      })}>
        <Plus className="w-4 h-4 mr-2" />New Exercise
      </Button>

      <div className="space-y-2">
        {filtered.map((e) => {
          const dj = derivedJoints(e.pathology_ids);
          const phase = PHASES.find((p) => p.value === e.rehab_phase)?.label;
          const diff = DIFFICULTIES.find((d) => d.value === e.difficulty)?.label;
          return (
            <Row
              key={e.id}
              title={e.title}
              subtitle={
                <span>
                  {e.pathology_ids.map((pid) => pathologies.find((p) => p.id === pid)?.name).filter(Boolean).join(", ") || "No injuries"}
                  {dj.length > 0 && <> · <span className="italic">{dj.map((j) => j.name).join(", ")}</span></>}
                  {(diff || phase) && <> · {[diff, phase].filter(Boolean).join(" · ")}</>}
                </span>
              }
              right={<Badge variant={e.is_active ? "default" : "outline"}>{e.is_active ? "Active" : "Inactive"}</Badge>}
              onEdit={() => setEditing({ ...e })}
              onDelete={() => del(e.id)}
            />
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">No exercises found.</p>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} Exercise</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Title">
                  <Input value={editing.title} onChange={(ev) => setEditing({ ...editing, title: ev.target.value, slug: editing.slug || slugify(ev.target.value) })} />
                </Field>
                <Field label="Slug">
                  <Input value={editing.slug} onChange={(ev) => setEditing({ ...editing, slug: ev.target.value })} />
                </Field>
              </div>
              <Field label="Short description">
                <Input value={editing.short_description ?? ""} onChange={(ev) => setEditing({ ...editing, short_description: ev.target.value })} />
              </Field>
              <Field label="Full instructions">
                <Textarea rows={5} value={editing.full_instructions ?? ""} onChange={(ev) => setEditing({ ...editing, full_instructions: ev.target.value })} />
              </Field>
              <Field label="Assigned injuries">
                <MultiPicker
                  options={pathologies.map((p) => ({ id: p.id, name: p.name }))}
                  selected={editing.pathology_ids}
                  onChange={(ids) => setEditing({ ...editing, pathology_ids: ids })}
                  placeholder="Search injuries..."
                />
              </Field>
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
                <span className="text-muted-foreground">Derived joints: </span>
                {derivedJoints(editing.pathology_ids).length > 0
                  ? derivedJoints(editing.pathology_ids).map((j) => j.name).join(", ")
                  : <span className="italic text-muted-foreground">None — assign injuries to derive joints.</span>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Difficulty">
                  <Select value={editing.difficulty ?? ""} onValueChange={(v) => setEditing({ ...editing, difficulty: v })}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Rehab phase">
                  <Select value={editing.rehab_phase ?? ""} onValueChange={(v) => setEditing({ ...editing, rehab_phase: v })}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{PHASES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Sets/reps/time">
                  <Input value={editing.equipment_needed ?? ""} onChange={(ev) => setEditing({ ...editing, equipment_needed: ev.target.value })} placeholder="e.g. 3 sets × 10 reps" />
                </Field>
                <Field label="Precautions">
                  <Input value={editing.precautions ?? ""} onChange={(ev) => setEditing({ ...editing, precautions: ev.target.value })} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Image URL">
                  <Input value={editing.image_url ?? ""} onChange={(ev) => setEditing({ ...editing, image_url: ev.target.value })} />
                </Field>
                <Field label="Video URL">
                  <Input value={editing.video_url ?? ""} onChange={(ev) => setEditing({ ...editing, video_url: ev.target.value })} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Sort order">
                  <Input type="number" value={editing.sort_order} onChange={(ev) => setEditing({ ...editing, sort_order: Number(ev.target.value) })} />
                </Field>
                <div className="flex flex-col gap-2 justify-end">
                  <div className="flex items-center gap-3">
                    <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={editing.is_general_exercise} onCheckedChange={(v) => setEditing({ ...editing, is_general_exercise: v })} />
                    <Label>General joint exercise</Label>
                  </div>
                </div>
              </div>
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

/* ============ PT Locations (unchanged) ============ */
type Location = any;
const emptyLoc = { name: "", phone: "", address: "", city: "", region: "", website: "", notes: "", specialties: [] as string[] };

const LocationsAdmin = () => {
  const [items, setItems] = useState<Location[]>([]);
  const [editing, setEditing] = useState<Location | null>(null);
  const [specInput, setSpecInput] = useState("");

  const load = async () => {
    const { data } = await supabase.from("pt_locations").select("*").order("region").order("name");
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const { error } = editing.id
      ? await supabase.from("pt_locations").update(editing).eq("id", editing.id)
      : await supabase.from("pt_locations").insert(editing);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Saved" }); setEditing(null); load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this location?")) return;
    await supabase.from("pt_locations").delete().eq("id", id);
    load();
  };

  if (editing) {
    return (
      <div className="bg-card border rounded-xl p-6 mt-6 space-y-4">
        <div className="flex justify-between"><h3 className="font-semibold text-lg">{editing.id ? "Edit" : "New"} Location</h3><Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button></div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Name"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
          <Field label="Phone"><Input value={editing.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></Field>
          <Field label="Address"><Input value={editing.address || ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></Field>
          <Field label="City"><Input value={editing.city || ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></Field>
          <Field label="Region"><Input value={editing.region || ""} onChange={(e) => setEditing({ ...editing, region: e.target.value })} /></Field>
          <Field label="Website"><Input value={editing.website || ""} onChange={(e) => setEditing({ ...editing, website: e.target.value })} /></Field>
        </div>
        <Field label="Specialties">
          <div className="flex flex-wrap gap-2 mb-2">
            {(editing.specialties || []).map((s: string, i: number) => (
              <span key={i} className="bg-secondary px-2 py-1 rounded text-sm flex items-center gap-1">
                {s}<button onClick={() => setEditing({ ...editing, specialties: editing.specialties.filter((_: any, ix: number) => ix !== i) })}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={specInput} onChange={(e) => setSpecInput(e.target.value)} placeholder="Add specialty" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (specInput.trim()) { setEditing({ ...editing, specialties: [...(editing.specialties || []), specInput.trim()] }); setSpecInput(""); } } }} />
            <Button type="button" variant="outline" onClick={() => { if (specInput.trim()) { setEditing({ ...editing, specialties: [...(editing.specialties || []), specInput.trim()] }); setSpecInput(""); } }}>Add</Button>
          </div>
        </Field>
        <Field label="Notes"><Textarea rows={3} value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></Field>
        <div className="flex gap-2"><Button onClick={save}>Save</Button><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button></div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Button onClick={() => setEditing({ ...emptyLoc })}><Plus className="w-4 h-4 mr-2" />New Location</Button>
      <div className="mt-4 space-y-2">
        {items.map((i) => (
          <Row key={i.id} title={i.name} subtitle={`${i.city || ""} · ${i.region || ""}`} onEdit={() => setEditing(i)} onDelete={() => del(i.id)} />
        ))}
      </div>
    </div>
  );
};

/* ============ Page shell ============ */
const Admin = () => {
  const { signOut, user } = useAuth();

  return (
    <RequireAdmin>
      <Layout>
        <section className="py-10">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Signed in as {user?.email}</p>
              </div>
              <Button variant="outline" onClick={signOut}><LogOut className="w-4 h-4 mr-2" />Sign out</Button>
            </div>

            <Tabs defaultValue="joints">
              <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="joints">Joints</TabsTrigger>
                <TabsTrigger value="injuries">Injuries</TabsTrigger>
                <TabsTrigger value="exercises">Exercises</TabsTrigger>
                <TabsTrigger value="locations">PT Locations</TabsTrigger>
              </TabsList>
              <TabsContent value="joints"><JointsAdmin /></TabsContent>
              <TabsContent value="injuries"><InjuriesAdmin /></TabsContent>
              <TabsContent value="exercises"><ExercisesAdmin /></TabsContent>
              <TabsContent value="locations"><LocationsAdmin /></TabsContent>
            </Tabs>
          </div>
        </section>
      </Layout>
    </RequireAdmin>
  );
};

export default Admin;
