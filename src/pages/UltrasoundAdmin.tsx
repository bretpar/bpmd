import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import RequireAdmin from "@/components/RequireAdmin";
import { supabase } from "@/integrations/supabase/client";
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
import { toast } from "@/hooks/use-toast";
import { Pencil, Plus, Search, Trash2, ExternalLink, Upload } from "lucide-react";

const sb = supabase as any;

const REGIONS = ["Shoulder", "Elbow", "Wrist/Hand", "Hip", "Knee", "Foot/Ankle", "Other"] as const;
const STATUSES = ["draft", "published", "hidden"] as const;
type Status = (typeof STATUSES)[number];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

interface Injection {
  id: string;
  name: string;
  slug: string;
  body_region: string;
  conditions_treated: string | null;
  short_summary: string | null;
  full_explanation: string | null;
  why_ultrasound: string | null;
  procedure_steps: string | null;
  medications: string | null;
  risks: string | null;
  post_care: string | null;
  when_to_call: string | null;
  procedure_image_url: string | null;
  ultrasound_image_url: string | null;
  diagram_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: Status;
  featured: boolean;
  accepts_appointments: boolean;
  sort_order: number;
  updated_at: string;
}

const emptyInjection = (): Injection => ({
  id: "",
  name: "",
  slug: "",
  body_region: "Shoulder",
  conditions_treated: "",
  short_summary: "",
  full_explanation: "",
  why_ultrasound: "",
  procedure_steps: "",
  medications: "",
  risks: "",
  post_care: "",
  when_to_call: "",
  procedure_image_url: "",
  ultrasound_image_url: "",
  diagram_image_url: "",
  seo_title: "",
  seo_description: "",
  status: "draft",
  featured: false,
  accepts_appointments: true,
  sort_order: 0,
  updated_at: new Date().toISOString(),
});

const statusBadge = (s: Status) => {
  const styles: Record<Status, string> = {
    draft: "bg-muted text-muted-foreground",
    published: "bg-primary text-primary-foreground",
    hidden: "bg-destructive/10 text-destructive",
  };
  return <Badge className={styles[s]}>{s}</Badge>;
};

function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `ultrasound/${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from("media").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = sb.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl);
      toast({ title: "Image uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <div className="flex gap-2 items-start">
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL or upload"
        />
        <label className="shrink-0">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button type="button" size="sm" variant="outline" asChild disabled={uploading}>
            <span className="cursor-pointer">
              <Upload className="w-4 h-4 mr-1" />
              {uploading ? "..." : "Upload"}
            </span>
          </Button>
        </label>
      </div>
      {value && (
        <img src={value} alt="" className="mt-2 h-20 w-auto rounded border object-cover" />
      )}
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <Label className="mb-1.5 block">{label}</Label>
    {children}
  </div>
);

function InjectionEditor({
  injection,
  onClose,
  onSaved,
}: {
  injection: Injection;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Injection>(injection);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Injection>(k: K, v: Injection[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) return toast({ title: "Name required", variant: "destructive" });
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug?.trim() || slugify(form.name),
    };
    const { id, ...rest } = payload as any;
    const { error } = id
      ? await sb.from("ultrasound_injections").update(rest).eq("id", id)
      : await sb.from("ultrasound_injections").insert(rest);
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Injection saved" });
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit Injection" : "Add Injection"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Injection name">
              <Input
                value={form.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!form.id && !form.slug) set("slug", slugify(e.target.value));
                }}
              />
            </Field>
            <Field label="Slug">
              <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Body region">
              <Select value={form.body_region} onValueChange={(v) => set("body_region", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => set("status", v as Status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Sort order">
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => set("sort_order", parseInt(e.target.value) || 0)}
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2">
              <Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
              <span className="text-sm">Featured</span>
            </label>
            <label className="flex items-center gap-2">
              <Switch
                checked={form.accepts_appointments}
                onCheckedChange={(v) => set("accepts_appointments", v)}
              />
              <span className="text-sm">Accept appointments</span>
            </label>
          </div>

          <Field label="Short summary (for public card)">
            <Textarea
              rows={2}
              value={form.short_summary || ""}
              onChange={(e) => set("short_summary", e.target.value)}
            />
          </Field>

          <Field label="What is this injection?">
            <Textarea rows={4} value={form.full_explanation || ""} onChange={(e) => set("full_explanation", e.target.value)} />
          </Field>

          <Field label="Indications / conditions treated">
            <Textarea
              rows={2}
              value={form.conditions_treated || ""}
              onChange={(e) => set("conditions_treated", e.target.value)}
              placeholder="e.g. Rotator cuff tendinopathy, subacromial bursitis"
            />
          </Field>

          <Field label="Step-by-step procedure">
            <Textarea rows={4} value={form.procedure_steps || ""} onChange={(e) => set("procedure_steps", e.target.value)} />
          </Field>

          <ImageUploadField label="Optional image" value={form.procedure_image_url} onChange={(v) => set("procedure_image_url", v)} />

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="SEO title">
              <Input value={form.seo_title || ""} onChange={(e) => set("seo_title", e.target.value)} />
            </Field>
            <Field label="SEO meta description">
              <Input value={form.seo_description || ""} onChange={(e) => set("seo_description", e.target.value)} />
            </Field>
          </div>

          <p className="text-xs text-muted-foreground border-t pt-3">
            Shared content (overview, pre-care, post-care, risks, when to call) is edited in the
            <strong> Shared Content</strong> section and reused on every injection page.
          </p>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const UltrasoundAdminInner = () => {
  const [items, setItems] = useState<Injection[]>([]);
  const [editing, setEditing] = useState<Injection | null>(null);
  const [q, setQ] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = async () => {
    const { data, error } = await sb
      .from("ultrasound_injections")
      .select("*")
      .order("body_region")
      .order("sort_order")
      .order("name");
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((i) => {
      if (regionFilter !== "all" && i.body_region !== regionFilter) return false;
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (term && !`${i.name} ${i.conditions_treated || ""}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [items, q, regionFilter, statusFilter]);

  const remove = async (id: string) => {
    if (!confirm("Delete this injection? This cannot be undone.")) return;
    const { error } = await sb.from("ultrasound_injections").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Deleted" });
    load();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Ultrasound Injection Library</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage published ultrasound-guided procedures.</p>
        </div>
        <Button onClick={() => setEditing(emptyInjection())} className="gap-2">
          <Plus className="w-4 h-4" /> Add Injection
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search injections..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regions</SelectItem>
            {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Region</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Featured</th>
                <th className="px-3 py-2 font-medium">Appts</th>
                <th className="px-3 py-2 font-medium">Updated</th>
                <th className="px-3 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{i.name}</td>
                  <td className="px-3 py-2">{i.body_region}</td>
                  <td className="px-3 py-2">{statusBadge(i.status)}</td>
                  <td className="px-3 py-2">{i.featured ? "Yes" : "—"}</td>
                  <td className="px-3 py-2">{i.accepts_appointments ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                    {new Date(i.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      {i.status === "published" && (
                        <Button asChild size="sm" variant="ghost" title="View public page">
                          <Link to={`/ultrasound/${i.slug}`} target="_blank">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setEditing(i)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(i.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">No injections found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <InjectionEditor
          injection={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
};

const UltrasoundAdmin = () => (
  <RequireAdmin>
    <Layout>
      <UltrasoundAdminInner />
    </Layout>
  </RequireAdmin>
);

export default UltrasoundAdmin;
