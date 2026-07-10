import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import RequireAdmin from "@/components/RequireAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Copy, Trash2, ArrowLeft, ExternalLink } from "lucide-react";
import { slugify, type Program, type Status } from "@/lib/programTypes";

const sb = supabase as any;

const AdminProgramsInner = () => {
  const nav = useNavigate();
  const [items, setItems] = useState<Program[]>([]);
  const [creating, setCreating] = useState<Partial<Program> | null>(null);

  const load = async () => {
    const { data } = await sb.from("exercise_programs").select("*").order("name");
    setItems((data || []) as Program[]);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!creating?.name?.trim()) return toast({ title: "Name required", variant: "destructive" });
    const payload = {
      slug: creating.slug || slugify(creating.name),
      name: creating.name.trim(),
      body_region: creating.body_region || null,
      condition: creating.condition || null,
      intro_text: creating.intro_text || null,
      estimated_duration: creating.estimated_duration || null,
      status: "draft" as Status,
    };
    const { data, error } = await sb.from("exercise_programs").insert(payload).select("id").single();
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setCreating(null);
    nav(`/admin/programs/${data.id}`);
  };

  const duplicate = async (p: Program) => {
    const newSlug = `${p.slug}-copy-${Date.now().toString(36)}`;
    const { data, error } = await sb.from("exercise_programs")
      .insert({ ...p, id: undefined, slug: newSlug, name: `${p.name} (copy)`, status: "draft" })
      .select("id").single();
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    // duplicate phases + phase_exercises
    const { data: phases } = await sb.from("program_phases").select("*").eq("program_id", p.id).order("sort_order");
    for (const ph of phases || []) {
      const { data: newPh } = await sb.from("program_phases")
        .insert({ ...ph, id: undefined, program_id: data.id })
        .select("id").single();
      const { data: pe } = await sb.from("phase_exercises").select("*").eq("phase_id", ph.id).order("sort_order");
      if (pe?.length && newPh) {
        await sb.from("phase_exercises").insert(pe.map((x: any) => ({ ...x, id: undefined, phase_id: newPh.id })));
      }
    }
    load();
  };

  const del = async (p: Program) => {
    if (!confirm(`Delete "${p.name}" and all its phases?`)) return;
    const { error } = await sb.from("exercise_programs").delete().eq("id", p.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    load();
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
            <ArrowLeft className="w-4 h-4" /> Admin
          </Link>
          <h1 className="text-3xl font-bold">Exercise Programs</h1>
          <p className="text-muted-foreground text-sm">Diagnosis-based programs made of ordered phases.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/admin/exercise-library">Exercise Library</Link></Button>
          <Button onClick={() => setCreating({ name: "", slug: "" })}><Plus className="w-4 h-4 mr-2" />New Program</Button>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((p) => (
          <div key={p.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={`/admin/programs/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                <Badge variant={p.status === "published" ? "default" : "outline"}>{p.status}</Badge>
                {p.body_region && <Badge variant="secondary">{p.body_region}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {p.condition || "—"}{p.estimated_duration ? ` · ${p.estimated_duration}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {p.status === "published" && (
                <Button asChild size="icon" variant="ghost">
                  <Link to={`/programs/${p.slug}`} target="_blank" aria-label="View"><ExternalLink className="w-4 h-4" /></Link>
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={() => duplicate(p)} aria-label="Duplicate"><Copy className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => del(p)} aria-label="Delete"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-center py-8 text-muted-foreground">No programs yet.</p>}
      </div>

      <Dialog open={!!creating} onOpenChange={(o) => !o && setCreating(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Program</DialogTitle></DialogHeader>
          {creating && (
            <div className="space-y-3">
              <div><Label>Name</Label>
                <Input value={creating.name ?? ""} onChange={(e) => setCreating({ ...creating, name: e.target.value, slug: creating.slug || slugify(e.target.value) })} />
              </div>
              <div><Label>Slug</Label>
                <Input value={creating.slug ?? ""} onChange={(e) => setCreating({ ...creating, slug: e.target.value })} />
              </div>
              <div><Label>Body region</Label>
                <Input value={creating.body_region ?? ""} onChange={(e) => setCreating({ ...creating, body_region: e.target.value })} />
              </div>
              <div><Label>Condition / diagnosis</Label>
                <Input value={creating.condition ?? ""} onChange={(e) => setCreating({ ...creating, condition: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(null)}>Cancel</Button>
            <Button onClick={create}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AdminPrograms = () => (
  <RequireAdmin><Layout><AdminProgramsInner /></Layout></RequireAdmin>
);
export default AdminPrograms;
