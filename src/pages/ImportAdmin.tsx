import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";

const sb = supabase as any;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const DIFFICULTY_MAP: Record<string, string> = {
  easy: "beginner",
  beginner: "beginner",
  moderate: "intermediate",
  intermediate: "intermediate",
  advanced: "advanced",
  hard: "advanced",
};

const PHASE_MAP: Record<string, string> = {
  acute: "acute",
  "early rehab": "early_rehab",
  early_rehab: "early_rehab",
  "early-rehab": "early_rehab",
  strengthening: "strengthening",
  "return to activity": "return_to_activity",
  return_to_activity: "return_to_activity",
  "return-to-activity": "return_to_activity",
  maintenance: "maintenance",
};

const parseBool = (v: any): boolean => {
  if (v === undefined || v === null || v === "") return true;
  const s = String(v).trim().toLowerCase();
  return !["false", "no", "0", "inactive", "off"].includes(s);
};

const norm = (s: any) => String(s ?? "").trim();
const lower = (s: any) => norm(s).toLowerCase();

const pick = (row: any, ...keys: string[]) => {
  const map: Record<string, any> = {};
  Object.keys(row).forEach((k) => (map[k.trim().toLowerCase()] = row[k]));
  for (const k of keys) {
    const v = map[k.toLowerCase()];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return "";
};

type InjuryRow = {
  rowIndex: number;
  name: string;
  slug: string;
  short_description: string;
  full_description: string;
  assigned_joints_raw: string;
  joint_slugs: string[];
  joint_ids: string[];
  sort_order: number;
  is_active: boolean;
  action: "create" | "update";
  existingId?: string;
  errors: string[];
};

type ExerciseRow = {
  rowIndex: number;
  title: string;
  slug: string;
  short_description: string;
  full_instructions: string;
  assigned_injuries_raw: string;
  injury_slugs: string[];
  injury_ids: string[];
  joint_ids: string[];
  difficulty: string | null;
  rehab_phase: string | null;
  sets_reps_time: string;
  precautions: string;
  image_url: string;
  video_url: string;
  sort_order: number;
  is_active: boolean;
  is_general_exercise: boolean;
  action: "create" | "update";
  existingId?: string;
  errors: string[];
};

const splitList = (s: string) =>
  s
    .split(/[;|\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);

export default function ImportAdmin() {
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [injuries, setInjuries] = useState<InjuryRow[]>([]);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [done, setDone] = useState<string | null>(null);

  const reset = () => {
    setInjuries([]);
    setExercises([]);
    setDone(null);
    setFileName("");
  };

  const onFile = async (file: File) => {
    reset();
    setParsing(true);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });

      const findSheet = (...names: string[]) => {
        for (const n of names) {
          const match = wb.SheetNames.find((s) => s.trim().toLowerCase() === n.toLowerCase());
          if (match) return wb.Sheets[match];
        }
        return null;
      };

      const injSheet = findSheet("Injuries", "Injury", "Pathologies");
      const exSheet = findSheet("Exercises", "Exercise");

      if (!injSheet && !exSheet) {
        toast({
          title: "No matching sheets found",
          description: "File must contain a sheet named 'Injuries' and/or 'Exercises'. For CSV uploads, use one file per sheet.",
          variant: "destructive",
        });
        setParsing(false);
        return;
      }

      // Load existing data for matching
      const [{ data: jointsData }, { data: pathData }, { data: exData }] = await Promise.all([
        sb.from("body_locations").select("id, name, slug"),
        sb.from("pathologies").select("id, name, slug"),
        sb.from("rehab_exercises").select("id, slug"),
      ]);

      const joints = (jointsData || []) as { id: string; name: string; slug: string }[];
      const pathologies = (pathData || []) as { id: string; name: string; slug: string }[];
      const existingExBySlug = new Map<string, string>(
        (exData || []).map((e: any) => [e.slug, e.id])
      );

      const jointBySlug = new Map(joints.map((j) => [j.slug.toLowerCase(), j]));
      const jointByName = new Map(joints.map((j) => [j.name.toLowerCase(), j]));
      const pathBySlug = new Map(pathologies.map((p) => [p.slug.toLowerCase(), p]));
      const pathByName = new Map(pathologies.map((p) => [p.name.toLowerCase(), p]));

      const injRows: InjuryRow[] = [];
      const exRows: ExerciseRow[] = [];

      // Track slugs we will create in injuries pass so exercises can reference them
      const stagedInjurySlugs = new Map<string, { name: string; joint_ids: string[] }>();

      if (injSheet) {
        const raw: any[] = XLSX.utils.sheet_to_json(injSheet, { defval: "" });
        const slugSeen = new Set<string>();
        raw.forEach((r, i) => {
          const errors: string[] = [];
          const name = norm(pick(r, "Name", "Injury", "Injury Name"));
          let slug = norm(pick(r, "Slug"));
          const short_description = norm(pick(r, "Short description", "Short Description", "Short"));
          const full_description = norm(pick(r, "Full description", "Full Description", "Full"));
          const assigned = norm(pick(r, "Assigned joints", "Assigned Joints", "Joints"));
          const sort_order = parseInt(norm(pick(r, "Sort order", "Sort Order", "Order")) || "0", 10) || 0;
          const is_active = parseBool(pick(r, "Active", "Is Active"));

          if (!name && !slug) return; // skip blank rows
          if (!name) errors.push("Name is required");
          if (!slug) slug = slugify(name);
          if (slugSeen.has(slug)) errors.push(`Duplicate slug in file: ${slug}`);
          slugSeen.add(slug);

          const jointTokens = splitList(assigned);
          const joint_ids: string[] = [];
          const joint_slugs: string[] = [];
          jointTokens.forEach((t) => {
            const j = jointBySlug.get(t.toLowerCase()) || jointByName.get(t.toLowerCase());
            if (j) {
              joint_ids.push(j.id);
              joint_slugs.push(j.slug);
            } else {
              errors.push(`Joint not found: "${t}"`);
            }
          });

          const existing = pathBySlug.get(slug.toLowerCase());
          const row: InjuryRow = {
            rowIndex: i + 2,
            name,
            slug,
            short_description,
            full_description,
            assigned_joints_raw: assigned,
            joint_slugs,
            joint_ids,
            sort_order,
            is_active,
            action: existing ? "update" : "create",
            existingId: existing?.id,
            errors,
          };
          injRows.push(row);
          stagedInjurySlugs.set(slug.toLowerCase(), { name, joint_ids });
        });
      }

      if (exSheet) {
        const raw: any[] = XLSX.utils.sheet_to_json(exSheet, { defval: "" });
        const slugSeen = new Set<string>();
        raw.forEach((r, i) => {
          const errors: string[] = [];
          const title = norm(pick(r, "Title", "Name", "Exercise"));
          let slug = norm(pick(r, "Slug"));
          const short_description = norm(pick(r, "Short description", "Short Description", "Short"));
          const full_instructions = norm(pick(r, "Full instructions", "Full Instructions", "Instructions"));
          const assigned = norm(pick(r, "Assigned injuries", "Assigned Injuries", "Injuries"));
          const diffRaw = lower(pick(r, "Difficulty"));
          const phaseRaw = lower(pick(r, "Rehab phase", "Rehab Phase", "Phase"));
          const sets_reps_time = norm(pick(r, "Sets/reps/time", "Sets/Reps/Time", "Sets reps time", "Dosage"));
          const precautions = norm(pick(r, "Precautions"));
          const image_url = norm(pick(r, "Image URL", "Image"));
          const video_url = norm(pick(r, "Video URL", "Video"));
          const sort_order = parseInt(norm(pick(r, "Sort order", "Sort Order", "Order")) || "0", 10) || 0;
          const is_active = parseBool(pick(r, "Active", "Is Active"));
          const is_general_exercise = (() => {
            const v = pick(r, "General joint exercise", "General Joint Exercise", "General");
            if (v === "" || v === undefined || v === null) return false;
            const s = String(v).trim().toLowerCase();
            return ["true", "yes", "1", "y", "general"].includes(s);
          })();

          if (!title && !slug) return;
          if (!title) errors.push("Title is required");
          if (!slug) slug = slugify(title);
          if (slugSeen.has(slug)) errors.push(`Duplicate slug in file: ${slug}`);
          slugSeen.add(slug);

          let difficulty: string | null = null;
          if (diffRaw) {
            difficulty = DIFFICULTY_MAP[diffRaw] || null;
            if (!difficulty) errors.push(`Invalid difficulty: "${diffRaw}" (use Easy, Moderate, Advanced)`);
          }

          let rehab_phase: string | null = null;
          if (phaseRaw) {
            rehab_phase = PHASE_MAP[phaseRaw] || null;
            if (!rehab_phase)
              errors.push(`Invalid rehab phase: "${phaseRaw}" (use Acute, Early rehab, Strengthening, Return to activity, Maintenance)`);
          }

          const injuryTokens = splitList(assigned);
          const injury_ids: string[] = [];
          const injury_slugs: string[] = [];
          const jointIdSet = new Set<string>();
          injuryTokens.forEach((t) => {
            const tl = t.toLowerCase();
            const p = pathBySlug.get(tl) || pathByName.get(tl);
            if (p) {
              injury_ids.push(p.id);
              injury_slugs.push(p.slug);
            } else if (stagedInjurySlugs.has(tl) || stagedInjurySlugs.has(slugify(t))) {
              const key = stagedInjurySlugs.has(tl) ? tl : slugify(t);
              injury_slugs.push(key);
              stagedInjurySlugs.get(key)!.joint_ids.forEach((id) => jointIdSet.add(id));
            } else {
              errors.push(`Injury not found: "${t}"`);
            }
          });

          // derive joints from matched existing injuries
          // (staged ones already added above; existing ones need lookup of their joints later — done at import time)

          if (!is_general_exercise && injuryTokens.length === 0) {
            errors.push("Assigned injuries required unless marked as a general joint exercise");
          }

          const existing = existingExBySlug.get(slug);
          exRows.push({
            rowIndex: i + 2,
            title,
            slug,
            short_description,
            full_instructions,
            assigned_injuries_raw: assigned,
            injury_slugs,
            injury_ids,
            joint_ids: Array.from(jointIdSet),
            difficulty,
            rehab_phase,
            sets_reps_time,
            precautions,
            image_url,
            video_url,
            sort_order,
            is_active,
            is_general_exercise,
            action: existing ? "update" : "create",
            existingId: existing,
            errors,
          });
        });
      }

      setInjuries(injRows);
      setExercises(exRows);
    } catch (e: any) {
      toast({ title: "Failed to parse file", description: e.message, variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  const totalErrors =
    injuries.reduce((n, r) => n + r.errors.length, 0) +
    exercises.reduce((n, r) => n + r.errors.length, 0);

  const canImport =
    !importing && !parsing && (injuries.length > 0 || exercises.length > 0) && totalErrors === 0;

  const runImport = async () => {
    setImporting(true);
    setDone(null);
    try {
      let injCreated = 0;
      let injUpdated = 0;
      let exCreated = 0;
      let exUpdated = 0;

      // Resolve injuries first so exercises can reference newly-created slugs
      const slugToPathId = new Map<string, string>();
      const slugToJointIds = new Map<string, string[]>();

      for (const r of injuries) {
        const payload = {
          name: r.name,
          slug: r.slug,
          short_description: r.short_description || null,
          full_description: r.full_description || null,
          sort_order: r.sort_order,
          is_active: r.is_active,
          body_location_id: r.joint_ids[0] || null,
        };
        let id = r.existingId;
        if (id) {
          const { error } = await sb.from("pathologies").update(payload).eq("id", id);
          if (error) throw new Error(`Injury row ${r.rowIndex}: ${error.message}`);
          injUpdated++;
        } else {
          const { data, error } = await sb.from("pathologies").insert(payload).select("id").single();
          if (error) throw new Error(`Injury row ${r.rowIndex}: ${error.message}`);
          id = data.id;
          injCreated++;
        }
        await sb.from("pathology_locations").delete().eq("pathology_id", id);
        if (r.joint_ids.length) {
          await sb.from("pathology_locations").insert(
            r.joint_ids.map((body_location_id) => ({ pathology_id: id, body_location_id }))
          );
        }
        slugToPathId.set(r.slug.toLowerCase(), id!);
        slugToJointIds.set(r.slug.toLowerCase(), r.joint_ids);
      }

      // Re-fetch pathologies with their joints for any not in this import
      const { data: pathData } = await sb.from("pathologies").select("id, slug");
      const allPathBySlug = new Map<string, string>((pathData || []).map((p: any) => [p.slug.toLowerCase(), p.id]));
      const { data: plData } = await sb.from("pathology_locations").select("pathology_id, body_location_id");
      const jointsByPathId = new Map<string, string[]>();
      (plData || []).forEach((r: any) => {
        const arr = jointsByPathId.get(r.pathology_id) || [];
        arr.push(r.body_location_id);
        jointsByPathId.set(r.pathology_id, arr);
      });

      for (const r of exercises) {
        // Resolve injury_ids (combining pre-existing and newly-created)
        const finalInjuryIds: string[] = [];
        const finalJointIds = new Set<string>(r.joint_ids);
        r.injury_slugs.forEach((s) => {
          const id = allPathBySlug.get(s.toLowerCase());
          if (id) {
            finalInjuryIds.push(id);
            (jointsByPathId.get(id) || []).forEach((j) => finalJointIds.add(j));
          }
        });
        // Also include direct injury_ids matched at parse time
        r.injury_ids.forEach((id) => {
          if (!finalInjuryIds.includes(id)) {
            finalInjuryIds.push(id);
            (jointsByPathId.get(id) || []).forEach((j) => finalJointIds.add(j));
          }
        });

        const instructions =
          r.sets_reps_time
            ? `${r.full_instructions ? r.full_instructions + "\n\n" : ""}Sets / Reps / Time: ${r.sets_reps_time}`
            : r.full_instructions;

        const payload = {
          title: r.title,
          slug: r.slug,
          short_description: r.short_description || null,
          full_instructions: instructions || null,
          difficulty: r.difficulty,
          rehab_phase: r.rehab_phase,
          precautions: r.precautions || null,
          image_url: r.image_url || null,
          video_url: r.video_url || null,
          sort_order: r.sort_order,
          is_active: r.is_active,
          is_general_exercise: r.is_general_exercise,
        };

        let id = r.existingId;
        if (id) {
          const { error } = await sb.from("rehab_exercises").update(payload).eq("id", id);
          if (error) throw new Error(`Exercise row ${r.rowIndex}: ${error.message}`);
          exUpdated++;
        } else {
          const { data, error } = await sb.from("rehab_exercises").insert(payload).select("id").single();
          if (error) throw new Error(`Exercise row ${r.rowIndex}: ${error.message}`);
          id = data.id;
          exCreated++;
        }

        await sb.from("rehab_exercise_pathologies").delete().eq("exercise_id", id);
        await sb.from("rehab_exercise_locations").delete().eq("exercise_id", id);

        if (finalInjuryIds.length) {
          await sb.from("rehab_exercise_pathologies").insert(
            finalInjuryIds.map((pathology_id) => ({ exercise_id: id, pathology_id }))
          );
        }
        const jointIds = Array.from(finalJointIds);
        if (jointIds.length) {
          await sb.from("rehab_exercise_locations").insert(
            jointIds.map((body_location_id) => ({ exercise_id: id, body_location_id }))
          );
        }
      }

      setDone(
        `Imported successfully: ${injCreated} injuries created, ${injUpdated} updated; ${exCreated} exercises created, ${exUpdated} updated.`
      );
      toast({ title: "Import complete" });
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const hasPreview = injuries.length > 0 || exercises.length > 0;

  return (
    <div className="mt-6 space-y-6">
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="font-semibold text-lg">Bulk import injuries & exercises</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a CSV or Excel file containing an <strong>Injuries</strong> sheet and/or an{" "}
              <strong>Exercises</strong> sheet. Existing records are matched by slug and updated;
              missing slugs are created.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
                disabled={parsing || importing}
                className="max-w-xs"
              />
              {fileName && (
                <span className="text-sm text-muted-foreground truncate">{fileName}</span>
              )}
              {hasPreview && (
                <Button variant="outline" size="sm" onClick={reset} disabled={importing}>
                  Clear
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Injury columns: Name, Slug, Short description, Full description, Assigned joints, Sort
              order, Active. Exercise columns: Title, Slug, Short description, Full instructions,
              Assigned injuries, Difficulty (Easy/Moderate/Advanced), Rehab phase, Sets/reps/time,
              Precautions, Image URL, Video URL, Sort order, Active, General joint exercise. Use
              semicolons to separate multiple joints or injuries.
            </p>
          </div>
        </div>
      </Card>

      {parsing && (
        <div className="text-center py-10 text-muted-foreground">Parsing file…</div>
      )}

      {done && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Done</AlertTitle>
          <AlertDescription>{done}</AlertDescription>
        </Alert>
      )}

      {hasPreview && (
        <>
          {totalErrors > 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{totalErrors} issue{totalErrors === 1 ? "" : "s"} found</AlertTitle>
              <AlertDescription>
                Fix the highlighted rows in your file and re-upload. Import is disabled until all
                issues are resolved.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Ready to import</AlertTitle>
              <AlertDescription>
                {injuries.length} injuries, {exercises.length} exercises. Review the preview below
                and click Import.
              </AlertDescription>
            </Alert>
          )}

          {injuries.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Injuries preview ({injuries.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground border-b">
                    <tr>
                      <th className="p-2">Row</th>
                      <th className="p-2">Action</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Slug</th>
                      <th className="p-2">Joints</th>
                      <th className="p-2">Active</th>
                      <th className="p-2">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {injuries.map((r, i) => (
                      <tr key={i} className={`border-b ${r.errors.length ? "bg-destructive/5" : ""}`}>
                        <td className="p-2 text-muted-foreground">{r.rowIndex}</td>
                        <td className="p-2">
                          <Badge variant={r.action === "create" ? "default" : "secondary"}>
                            {r.action}
                          </Badge>
                        </td>
                        <td className="p-2 font-medium">{r.name}</td>
                        <td className="p-2 text-muted-foreground">{r.slug}</td>
                        <td className="p-2">{r.joint_slugs.join(", ")}</td>
                        <td className="p-2">{r.is_active ? "Yes" : "No"}</td>
                        <td className="p-2 text-destructive text-xs">{r.errors.join("; ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {exercises.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Exercises preview ({exercises.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground border-b">
                    <tr>
                      <th className="p-2">Row</th>
                      <th className="p-2">Action</th>
                      <th className="p-2">Title</th>
                      <th className="p-2">Slug</th>
                      <th className="p-2">Injuries</th>
                      <th className="p-2">Difficulty</th>
                      <th className="p-2">Phase</th>
                      <th className="p-2">General</th>
                      <th className="p-2">Active</th>
                      <th className="p-2">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercises.map((r, i) => (
                      <tr key={i} className={`border-b ${r.errors.length ? "bg-destructive/5" : ""}`}>
                        <td className="p-2 text-muted-foreground">{r.rowIndex}</td>
                        <td className="p-2">
                          <Badge variant={r.action === "create" ? "default" : "secondary"}>
                            {r.action}
                          </Badge>
                        </td>
                        <td className="p-2 font-medium">{r.title}</td>
                        <td className="p-2 text-muted-foreground">{r.slug}</td>
                        <td className="p-2">{r.injury_slugs.join(", ")}</td>
                        <td className="p-2 capitalize">{r.difficulty || "—"}</td>
                        <td className="p-2">{r.rehab_phase || "—"}</td>
                        <td className="p-2">{r.is_general_exercise ? "Yes" : ""}</td>
                        <td className="p-2">{r.is_active ? "Yes" : "No"}</td>
                        <td className="p-2 text-destructive text-xs">{r.errors.join("; ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={reset} disabled={importing}>
              Cancel
            </Button>
            <Button onClick={runImport} disabled={!canImport} className="gap-2">
              <Upload className="h-4 w-4" />
              {importing ? "Importing…" : "Import"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
