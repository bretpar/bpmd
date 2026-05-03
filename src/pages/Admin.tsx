import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import RequireAdmin from "@/components/RequireAdmin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, X, LogOut } from "lucide-react";

type Injury = any;
type Exercise = any;
type Location = any;

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const Admin = () => {
  const { signOut, user } = useAuth();

  return (
    <RequireAdmin>
      <Layout>
        <section className="py-10">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Signed in as {user?.email}</p>
              </div>
              <Button variant="outline" onClick={signOut}><LogOut className="w-4 h-4 mr-2" />Sign out</Button>
            </div>

            <Tabs defaultValue="injuries">
              <TabsList>
                <TabsTrigger value="injuries">Injuries</TabsTrigger>
                <TabsTrigger value="exercises">Exercises</TabsTrigger>
                <TabsTrigger value="locations">PT Locations</TabsTrigger>
              </TabsList>
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

/* ---------------- Injuries ---------------- */
const emptyInjury = { name: "", slug: "", body_region: "", summary: "", overview: "", symptoms: "", causes: "", when_to_see_doctor: "", treatment_overview: "", cover_image_url: "", published: false };

const InjuriesAdmin = () => {
  const [items, setItems] = useState<Injury[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [editing, setEditing] = useState<Injury | null>(null);
  const [linkedIds, setLinkedIds] = useState<string[]>([]);

  const load = async () => {
    const { data } = await supabase.from("injuries").select("*").order("name");
    setItems(data || []);
    const { data: ex } = await supabase.from("exercises").select("id,name,body_region").order("name");
    setExercises(ex || []);
  };
  useEffect(() => { load(); }, []);

  const startEdit = async (item: Injury | null) => {
    setEditing(item || { ...emptyInjury });
    if (item?.id) {
      const { data } = await supabase.from("injury_exercises").select("exercise_id").eq("injury_id", item.id);
      setLinkedIds((data || []).map((r) => r.exercise_id));
    } else setLinkedIds([]);
  };

  const save = async () => {
    if (!editing) return;
    const payload = { ...editing, slug: editing.slug || slugify(editing.name) };
    const isNew = !payload.id;
    const { data, error } = isNew
      ? await supabase.from("injuries").insert(payload).select().single()
      : await supabase.from("injuries").update(payload).eq("id", payload.id).select().single();
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });

    const id = data.id;
    await supabase.from("injury_exercises").delete().eq("injury_id", id);
    if (linkedIds.length) {
      await supabase.from("injury_exercises").insert(linkedIds.map((eid, i) => ({ injury_id: id, exercise_id: eid, sort_order: i })));
    }
    toast({ title: "Saved" });
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this injury?")) return;
    const { error } = await supabase.from("injuries").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else load();
  };

  if (editing) {
    return (
      <div className="bg-card border rounded-xl p-6 mt-6 space-y-4">
        <div className="flex justify-between"><h3 className="font-semibold text-lg">{editing.id ? "Edit" : "New"} Injury</h3><Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.slug || slugify(e.target.value) })} /></Field>
          <Field label="Slug"><Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
          <Field label="Body Region"><Input value={editing.body_region || ""} onChange={(e) => setEditing({ ...editing, body_region: e.target.value })} placeholder="shoulder, knee, ..." /></Field>
          <Field label="Cover Image URL"><Input value={editing.cover_image_url || ""} onChange={(e) => setEditing({ ...editing, cover_image_url: e.target.value })} /></Field>
        </div>
        <Field label="Summary (1-2 sentences)"><Textarea rows={2} value={editing.summary || ""} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} /></Field>
        <Field label="Overview"><Textarea rows={5} value={editing.overview || ""} onChange={(e) => setEditing({ ...editing, overview: e.target.value })} /></Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Symptoms"><Textarea rows={4} value={editing.symptoms || ""} onChange={(e) => setEditing({ ...editing, symptoms: e.target.value })} /></Field>
          <Field label="Causes"><Textarea rows={4} value={editing.causes || ""} onChange={(e) => setEditing({ ...editing, causes: e.target.value })} /></Field>
          <Field label="When to See a Doctor"><Textarea rows={4} value={editing.when_to_see_doctor || ""} onChange={(e) => setEditing({ ...editing, when_to_see_doctor: e.target.value })} /></Field>
          <Field label="Treatment Overview"><Textarea rows={4} value={editing.treatment_overview || ""} onChange={(e) => setEditing({ ...editing, treatment_overview: e.target.value })} /></Field>
        </div>
        <Field label="Linked Exercises">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto border rounded-md p-3">
            {exercises.map((e) => (
              <label key={e.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={linkedIds.includes(e.id)} onChange={(ev) => setLinkedIds(ev.target.checked ? [...linkedIds, e.id] : linkedIds.filter((x) => x !== e.id))} />
                <span>{e.name} <span className="text-xs text-muted-foreground">({e.body_region})</span></span>
              </label>
            ))}
          </div>
        </Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> Published</label>
        <div className="flex gap-2"><Button onClick={save}>Save</Button><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button></div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Button onClick={() => startEdit(null)}><Plus className="w-4 h-4 mr-2" />New Injury</Button>
      <div className="mt-4 space-y-2">
        {items.map((i) => (
          <Row key={i.id} title={i.name} subtitle={`${i.body_region || "—"} · ${i.published ? "Published" : "Draft"}`} onEdit={() => startEdit(i)} onDelete={() => del(i.id)} />
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No injuries yet.</p>}
      </div>
    </div>
  );
};

/* ---------------- Exercises ---------------- */
const emptyExercise = { name: "", slug: "", description: "", instructions: "", difficulty: "beginner", body_region: "", video_url: "", image_url: "", published: true };

const ExercisesAdmin = () => {
  const [items, setItems] = useState<Exercise[]>([]);
  const [editing, setEditing] = useState<Exercise | null>(null);

  const load = async () => {
    const { data } = await supabase.from("exercises").select("*").order("body_region").order("name");
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload = { ...editing, slug: editing.slug || slugify(editing.name) };
    const { error } = payload.id
      ? await supabase.from("exercises").update(payload).eq("id", payload.id)
      : await supabase.from("exercises").insert(payload);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Saved" }); setEditing(null); load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this exercise?")) return;
    const { error } = await supabase.from("exercises").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else load();
  };

  if (editing) {
    return (
      <div className="bg-card border rounded-xl p-6 mt-6 space-y-4">
        <div className="flex justify-between"><h3 className="font-semibold text-lg">{editing.id ? "Edit" : "New"} Exercise</h3><Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button></div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Name"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.slug || slugify(e.target.value) })} /></Field>
          <Field label="Slug"><Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
          <Field label="Body Region"><Input value={editing.body_region || ""} onChange={(e) => setEditing({ ...editing, body_region: e.target.value })} /></Field>
          <Field label="Difficulty">
            <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={editing.difficulty || "beginner"} onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })}>
              <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
            </select>
          </Field>
          <Field label="Video URL"><Input value={editing.video_url || ""} onChange={(e) => setEditing({ ...editing, video_url: e.target.value })} /></Field>
          <Field label="Image URL"><Input value={editing.image_url || ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} /></Field>
        </div>
        <Field label="Description"><Textarea rows={2} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
        <Field label="Instructions"><Textarea rows={5} value={editing.instructions || ""} onChange={(e) => setEditing({ ...editing, instructions: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> Published</label>
        <div className="flex gap-2"><Button onClick={save}>Save</Button><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button></div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Button onClick={() => setEditing({ ...emptyExercise })}><Plus className="w-4 h-4 mr-2" />New Exercise</Button>
      <div className="mt-4 space-y-2">
        {items.map((i) => (
          <Row key={i.id} title={i.name} subtitle={`${i.body_region || "—"} · ${i.difficulty} · ${i.published ? "Published" : "Draft"}`} onEdit={() => setEditing(i)} onDelete={() => del(i.id)} />
        ))}
      </div>
    </div>
  );
};

/* ---------------- Locations ---------------- */
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

/* helpers */
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><Label className="mb-1.5 block">{label}</Label>{children}</div>
);
const Row = ({ title, subtitle, onEdit, onDelete }: { title: string; subtitle?: string; onEdit: () => void; onDelete: () => void }) => (
  <div className="flex items-center justify-between bg-card border rounded-lg p-3">
    <div><div className="font-medium">{title}</div>{subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}</div>
    <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={onEdit}><Pencil className="w-4 h-4" /></Button><Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="w-4 h-4" /></Button></div>
  </div>
);

export default Admin;
