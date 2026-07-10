import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import RequireAdmin from "@/components/RequireAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

const sb = supabase as any;

type Template = {
  id: string;
  name: string;
  description: string | null;
  body_region: string | null;
  condition: string | null;
  intro_text: string | null;
  estimated_duration: string | null;
};

const Inner = () => {
  const [items, setItems] = useState<Template[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Template | null>(null);

  const load = async () => {
    const [{ data }, { data: phases }] = await Promise.all([
      sb.from("program_templates").select("*").order("name"),
      sb.from("template_phases").select("template_id"),
    ]);
    setItems((data || []) as Template[]);
    const c: Record<string, number> = {};
    (phases || []).forEach((p: any) => { c[p.template_id] = (c[p.template_id] || 0) + 1; });
    setCounts(c);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) return toast({ title: "Name required", variant: "destructive" });
    const { error } = await sb.from("program_templates").update({
      name: editing.name.trim(),
      description: editing.description || null,
      body_region: editing.body_region || null,
      condition: editing.condition || null,
      intro_text: editing.intro_text || null,
      estimated_duration: editing.estimated_duration || null,
    }).eq("id", editing.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setEditing(null); load();
  };

  const del = async (t: Template) => {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    const { error } = await sb.from("program_templates").delete().eq("id", t.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    load();
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <Link to="/admin/programs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
        <ArrowLeft className="w-4 h-4" /> Programs
      </Link>
      <h1 className="text-3xl font-bold mb-1">Program Templates</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Reusable phase + exercise blueprints. Use them from “New Program” to seed a new independent program.
        Exercise Library records are shared, not duplicated.
      </p>

      <div className="space-y-2">
        {items.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
            <div>
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-muted-foreground">
                {counts[t.id] || 0} phase(s){t.body_region ? ` · ${t.body_region}` : ""}{t.condition ? ` · ${t.condition}` : ""}
              </p>
              {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setEditing(t)} aria-label="Edit"><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => del(t)} aria-label="Delete"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">
            No templates yet. Build a program, then use “Save as template” from the wizard or program editor.
          </p>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit template</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Description</Label>
                <Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div><Label>Body region</Label>
                <Input value={editing.body_region ?? ""} onChange={(e) => setEditing({ ...editing, body_region: e.target.value })} /></div>
              <div><Label>Condition</Label>
                <Input value={editing.condition ?? ""} onChange={(e) => setEditing({ ...editing, condition: e.target.value })} /></div>
              <div><Label>Estimated duration</Label>
                <Input value={editing.estimated_duration ?? ""} onChange={(e) => setEditing({ ...editing, estimated_duration: e.target.value })} /></div>
              <div><Label>Intro text</Label>
                <Textarea rows={3} value={editing.intro_text ?? ""} onChange={(e) => setEditing({ ...editing, intro_text: e.target.value })} /></div>
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

const AdminProgramTemplates = () => (
  <RequireAdmin><Layout><Inner /></Layout></RequireAdmin>
);
export default AdminProgramTemplates;
