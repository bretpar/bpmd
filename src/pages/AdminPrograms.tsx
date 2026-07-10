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
import { Plus, Copy, Trash2, ArrowLeft, ExternalLink, Sparkles, LayoutTemplate, FileText, BookmarkPlus } from "lucide-react";
import { slugify, type Program, type Status } from "@/lib/programTypes";

const sb = supabase as any;

type ChooserMode = "blank" | "existing" | "template";

const AdminProgramsInner = () => {
  const nav = useNavigate();
  const [items, setItems] = useState<Program[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [chooser, setChooser] = useState<null | { mode: ChooserMode; name: string; slug: string; sourceId: string }>(null);

  const load = async () => {
    const [{ data }, { data: tpls }] = await Promise.all([
      sb.from("exercise_programs").select("*").order("name"),
      sb.from("program_templates").select("id, name").order("name"),
    ]);
    setItems((data || []) as Program[]);
    setTemplates(tpls || []);
  };
  useEffect(() => { load(); }, []);

  const openChooser = (mode: ChooserMode) => setChooser({ mode, name: "", slug: "", sourceId: "" });

  const runCreate = async () => {
    if (!chooser) return;
    if (!chooser.name.trim()) return toast({ title: "Name required", variant: "destructive" });
    const slug = chooser.slug.trim() || slugify(chooser.name);

    if (chooser.mode === "blank") {
      const { data, error } = await sb.from("exercise_programs")
        .insert({ name: chooser.name.trim(), slug, status: "draft" }).select("id").single();
      if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
      setChooser(null);
      nav(`/admin/programs/${data.id}`);
      return;
    }

    if (chooser.mode === "existing") {
      if (!chooser.sourceId) return toast({ title: "Pick a source program", variant: "destructive" });
      const { data: src } = await sb.from("exercise_programs").select("*").eq("id", chooser.sourceId).maybeSingle();
      if (!src) return toast({ title: "Source not found", variant: "destructive" });
      const { data: created, error } = await sb.from("exercise_programs").insert({
        ...src, id: undefined, slug, name: chooser.name.trim(), status: "draft",
      }).select("id").single();
      if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
      const { data: phases } = await sb.from("program_phases").select("*").eq("program_id", src.id).order("sort_order");
      for (const ph of phases || []) {
        const { data: newPh } = await sb.from("program_phases")
          .insert({ ...ph, id: undefined, program_id: created.id, created_at: undefined, updated_at: undefined })
          .select("id").single();
        const { data: pe } = await sb.from("phase_exercises").select("*").eq("phase_id", ph.id).order("sort_order");
        if (pe?.length && newPh) {
          await sb.from("phase_exercises").insert(pe.map((x: any) => ({
            ...x, id: undefined, phase_id: newPh.id, created_at: undefined, updated_at: undefined,
          })));
        }
      }
      setChooser(null);
      nav(`/admin/programs/${created.id}`);
      return;
    }

    // template
    if (!chooser.sourceId) return toast({ title: "Pick a template", variant: "destructive" });
    const { data: tpl } = await sb.from("program_templates").select("*").eq("id", chooser.sourceId).maybeSingle();
    if (!tpl) return toast({ title: "Template not found", variant: "destructive" });
    const { data: created, error } = await sb.from("exercise_programs").insert({
      name: chooser.name.trim(),
      slug,
      body_region: tpl.body_region,
      condition: tpl.condition,
      intro_text: tpl.intro_text,
      estimated_duration: tpl.estimated_duration,
      acceptable_discomfort: tpl.acceptable_discomfort,
      reduce_or_stop: tpl.reduce_or_stop,
      seek_medical_care: tpl.seek_medical_care,
      status: "draft",
    }).select("id").single();
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    const { data: tphases } = await sb.from("template_phases").select("*").eq("template_id", tpl.id).order("sort_order");
    for (const tph of tphases || []) {
      const { data: newPh } = await sb.from("program_phases").insert({
        program_id: created.id, sort_order: tph.sort_order, title: tph.title, goal: tph.goal,
        frequency: tph.frequency, estimated_workout_minutes: tph.estimated_workout_minutes,
        approximate_duration: tph.approximate_duration, progression_criteria: tph.progression_criteria,
        warning_text: tph.warning_text,
      }).select("id").single();
      const { data: tpe } = await sb.from("template_phase_exercises").select("*").eq("phase_id", tph.id).order("sort_order");
      if (tpe?.length && newPh) {
        await sb.from("phase_exercises").insert(tpe.map((x: any) => ({
          phase_id: newPh.id, exercise_id: x.exercise_id, sort_order: x.sort_order,
          override_sets: x.override_sets, override_reps: x.override_reps,
          override_hold_seconds: x.override_hold_seconds, override_duration: x.override_duration,
          override_frequency: x.override_frequency, is_required: x.is_required,
        })));
      }
    }
    setChooser(null);
    nav(`/admin/programs/${created.id}`);
  };

  const duplicate = async (p: Program) => {
    const newSlug = `${p.slug}-copy-${Date.now().toString(36)}`;
    const { data, error } = await sb.from("exercise_programs")
      .insert({ ...p, id: undefined, slug: newSlug, name: `${p.name} (copy)`, status: "draft" })
      .select("id").single();
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    const { data: phases } = await sb.from("program_phases").select("*").eq("program_id", p.id).order("sort_order");
    for (const ph of phases || []) {
      const { data: newPh } = await sb.from("program_phases")
        .insert({ ...ph, id: undefined, program_id: data.id, created_at: undefined, updated_at: undefined })
        .select("id").single();
      const { data: pe } = await sb.from("phase_exercises").select("*").eq("phase_id", ph.id).order("sort_order");
      if (pe?.length && newPh) {
        await sb.from("phase_exercises").insert(pe.map((x: any) => ({
          ...x, id: undefined, phase_id: newPh.id, created_at: undefined, updated_at: undefined,
        })));
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

  const saveAsTemplate = async (p: Program) => {
    const name = prompt("Template name?", `${p.name} template`);
    if (!name) return;
    const { data: full } = await sb.from("exercise_programs").select("*").eq("id", p.id).maybeSingle();
    const { data: tpl, error } = await sb.from("program_templates").insert({
      name, description: null,
      body_region: full.body_region, condition: full.condition, intro_text: full.intro_text,
      estimated_duration: full.estimated_duration,
      acceptable_discomfort: full.acceptable_discomfort,
      reduce_or_stop: full.reduce_or_stop, seek_medical_care: full.seek_medical_care,
    }).select("id").single();
    if (error || !tpl) return toast({ title: "Failed", description: error?.message, variant: "destructive" });
    const { data: phases } = await sb.from("program_phases").select("*").eq("program_id", p.id).order("sort_order");
    for (const ph of phases || []) {
      const { data: newPh } = await sb.from("template_phases").insert({
        template_id: tpl.id, sort_order: ph.sort_order, title: ph.title, goal: ph.goal, frequency: ph.frequency,
        estimated_workout_minutes: ph.estimated_workout_minutes, approximate_duration: ph.approximate_duration,
        progression_criteria: ph.progression_criteria, warning_text: ph.warning_text,
      }).select("id").single();
      const { data: pe } = await sb.from("phase_exercises").select("*").eq("phase_id", ph.id).order("sort_order");
      if (pe?.length && newPh) {
        await sb.from("template_phase_exercises").insert(pe.map((x: any) => ({
          phase_id: newPh.id, exercise_id: x.exercise_id, sort_order: x.sort_order,
          override_sets: x.override_sets, override_reps: x.override_reps,
          override_hold_seconds: x.override_hold_seconds, override_duration: x.override_duration,
          override_frequency: x.override_frequency, is_required: x.is_required,
        })));
      }
    }
    toast({ title: "Saved as template" });
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
            <ArrowLeft className="w-4 h-4" /> Admin
          </Link>
          <h1 className="text-3xl font-bold">Exercise Programs</h1>
          <p className="text-muted-foreground text-sm">Diagnosis-based programs made of ordered phases.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline"><Link to="/admin/exercise-library">Exercise Library</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/programs/templates"><LayoutTemplate className="w-4 h-4 mr-1" />Templates</Link></Button>
          <Button asChild><Link to="/admin/programs/new"><Sparkles className="w-4 h-4 mr-1" />Create Guided Program</Link></Button>
          <Button variant="secondary" onClick={() => openChooser("blank")}><Plus className="w-4 h-4 mr-1" />New</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-2 mb-6">
        <button onClick={() => openChooser("blank")} className="p-4 rounded-lg border border-border bg-card text-left hover:bg-muted/40">
          <FileText className="w-5 h-5 mb-2 text-muted-foreground" />
          <p className="font-medium text-sm">Blank program</p>
          <p className="text-xs text-muted-foreground">Start from scratch in the full editor.</p>
        </button>
        <button onClick={() => openChooser("existing")} className="p-4 rounded-lg border border-border bg-card text-left hover:bg-muted/40">
          <Copy className="w-5 h-5 mb-2 text-muted-foreground" />
          <p className="font-medium text-sm">From existing program</p>
          <p className="text-xs text-muted-foreground">Duplicate an existing program as a new draft.</p>
        </button>
        <button onClick={() => openChooser("template")} className="p-4 rounded-lg border border-border bg-card text-left hover:bg-muted/40">
          <LayoutTemplate className="w-5 h-5 mb-2 text-muted-foreground" />
          <p className="font-medium text-sm">From template</p>
          <p className="text-xs text-muted-foreground">Seed from a saved template ({templates.length} available).</p>
        </button>
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
              <Button size="icon" variant="ghost" onClick={() => saveAsTemplate(p)} aria-label="Save as template" title="Save as template"><BookmarkPlus className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => duplicate(p)} aria-label="Duplicate"><Copy className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => del(p)} aria-label="Delete"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-center py-8 text-muted-foreground">No programs yet.</p>}
      </div>

      <Dialog open={!!chooser} onOpenChange={(o) => !o && setChooser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {chooser?.mode === "blank" && "New blank program"}
              {chooser?.mode === "existing" && "Duplicate an existing program"}
              {chooser?.mode === "template" && "New from template"}
            </DialogTitle>
          </DialogHeader>
          {chooser && (
            <div className="space-y-3">
              <div><Label>Name</Label>
                <Input value={chooser.name} onChange={(e) => setChooser({ ...chooser, name: e.target.value, slug: chooser.slug || slugify(e.target.value) })} />
              </div>
              <div><Label>Slug</Label>
                <Input value={chooser.slug} onChange={(e) => setChooser({ ...chooser, slug: e.target.value })} />
              </div>
              {chooser.mode === "existing" && (
                <div><Label>Source program</Label>
                  <Select value={chooser.sourceId} onValueChange={(v) => setChooser({ ...chooser, sourceId: v })}>
                    <SelectTrigger><SelectValue placeholder="Choose one" /></SelectTrigger>
                    <SelectContent>
                      {items.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {chooser.mode === "template" && (
                <div><Label>Source template</Label>
                  <Select value={chooser.sourceId} onValueChange={(v) => setChooser({ ...chooser, sourceId: v })}>
                    <SelectTrigger><SelectValue placeholder="Choose one" /></SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setChooser(null)}>Cancel</Button>
            <Button onClick={runCreate}>Create</Button>
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
