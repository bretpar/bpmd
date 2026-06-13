import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChevronRight,
  Search,
  
  Home as HomeIcon,
  Activity,
  Sparkles,
} from "lucide-react";
import { RehabExercise, useRehabExercises } from "@/hooks/useRehabExercises";

const PATIENT_EXERCISES_LABEL = "Patient Exercises";
const PATIENT_SAFETY_GUIDANCE =
  "Stop if pain sharply worsens, symptoms travel down the arm, numbness/tingling develops, weakness worsens, or you cannot raise the arm. Seek medical care after trauma, severe pain, fever, major swelling, or rapidly worsening function.";

// ---------- Safety Note (subtle, low-emphasis) ----------
const SafetyNote = () => (
  <div className="mt-10 pt-6 border-t border-border">
    <div className="bg-muted/50 rounded-xl p-5 md:p-6">
      <p className="text-xs text-muted-foreground leading-relaxed">
        <span className="font-medium text-foreground/80">Safety note:</span>{" "}
        These exercises are for general education and should not replace care from your clinician.
        Stop if symptoms worsen, pain becomes sharp, or you develop numbness, tingling, new weakness,
        or other concerning symptoms.
      </p>
    </div>
  </div>
);

// ---------- Breadcrumbs ----------
const Crumbs = ({ items }: { items: { label: string; to?: string }[] }) => (
  <nav className="flex items-center flex-wrap gap-1 text-sm text-muted-foreground mb-6">
    <Link to="/" className="hover:text-foreground flex items-center gap-1">
      <HomeIcon className="w-3.5 h-3.5" />
    </Link>
    {items.map((it, i) => (
      <span key={i} className="flex items-center gap-1">
        <ChevronRight className="w-3.5 h-3.5" />
        {it.to ? (
          <Link to={it.to} className="hover:text-foreground">{it.label}</Link>
        ) : (
          <span className="text-foreground font-medium">{it.label}</span>
        )}
      </span>
    ))}
  </nav>
);

// ---------- Row Card (stacked white card with chevron) ----------
const RowCard = ({
  to,
  title,
  emphasized,
  icon,
  subtitle,
}: {
  to: string;
  title: string;
  emphasized?: boolean;
  icon?: React.ReactNode;
  subtitle?: string;
}) => (
  <Link to={to} className="block">
    <Card
      className={`hover:shadow-md transition-all cursor-pointer ${
        emphasized ? "border-primary/50 hover:border-primary" : "hover:border-primary/40"
      }`}
    >
      <CardContent className="p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                emphasized ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-medium text-foreground text-base">{title}</div>
            {subtitle && (
              <div className="text-sm text-muted-foreground mt-0.5">{subtitle}</div>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  </Link>
);

// ---------- Exercise Detail Modal ----------
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h4 className="font-semibold text-foreground mb-1.5">{title}</h4>
    <div className="text-foreground/80 whitespace-pre-line">{children}</div>
  </div>
);

const looksLikeDosage = (value?: string | null) =>
  !!value && /\b(set|sets|rep|reps|hold|holds|second|seconds|minute|minutes|daily|times?|x|×)\b/i.test(value);

const splitExerciseDetails = (ex: RehabExercise) => {
  const equipmentRaw = ex.equipment?.trim() || "";
  const instructionsRaw = ex.instructions?.trim() || "";
  const dosageFromInstructions = instructionsRaw.match(/(?:Sets\s*\/\s*Reps\s*\/\s*Time|Sets\s*\/\s*Reps|Dosage):\s*([^\n]+)/i)?.[1]?.trim() || "";
  const dosage = looksLikeDosage(equipmentRaw) ? equipmentRaw : dosageFromInstructions;
  const instructions = dosageFromInstructions
    ? instructionsRaw.replace(/(?:\n\s*)?Sets\s*\/\s*Reps\s*\/\s*Time:\s*[^\n]+/i, "").trim()
    : instructionsRaw;
  const equipment = equipmentRaw && !looksLikeDosage(equipmentRaw) ? equipmentRaw : "";
  const holdMatch = dosage.match(/(?:hold|holds?)\s*([\w–-]+(?:\s*to\s*\w+)?\s*seconds?)/i);
  const frequencyMatch = dosage.match(/(\d[\w–-]*\s*times?\s*(?:per\s*)?(?:daily|day|week)|\d[\w–-]*\s*x\s*(?:daily|day|week)|daily)/i);

  return {
    equipment: equipment || "None",
    setsReps: dosage || "",
    holdTime: holdMatch?.[1] || "",
    frequency: frequencyMatch?.[1] || "",
    instructions,
  };
};

const DetailModal = ({ ex, onClose }: { ex: RehabExercise | null; onClose: () => void }) => {
  if (!ex) return null;
  const details = splitExerciseDetails(ex);
  return (
    <Dialog open={!!ex} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{ex.name}</DialogTitle>
          <DialogDescription>
            Exercise instructions, dosage, equipment, media availability, and safety guidance.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-sm">
          {ex.image_url ? (
            <img src={ex.image_url} alt={`${ex.name} demonstration`} className="w-full rounded-lg" />
          ) : !ex.video_url ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              Image/video coming soon.
            </div>
          ) : null}
          {ex.video_url && (
            <Section title="Video">
              <a
                href={ex.video_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline break-all"
              >
                {ex.video_url}
              </a>
            </Section>
          )}
          {ex.description && <Section title="Why this helps">{ex.description}</Section>}
          {details.instructions && (
            <Section title="How to do it">{details.instructions}</Section>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <Section title="Equipment">{details.equipment}</Section>
            {details.setsReps && <Section title="Sets/Reps">{details.setsReps}</Section>}
            {details.holdTime && <Section title="Hold Time">{details.holdTime}</Section>}
            {details.frequency && <Section title="Frequency">{details.frequency}</Section>}
          </div>
          {ex.precautions && (
            <div className="bg-muted/40 border border-border rounded-lg p-3">
              <p className="text-sm font-semibold text-foreground/80 mb-1">Stop if</p>
              <p className="text-foreground/70 whitespace-pre-line">{ex.precautions}</p>
            </div>
          )}
          <div className="bg-muted/40 border border-border rounded-lg p-3">
            <p className="text-sm font-semibold text-foreground/80 mb-1">
              When to stop or contact a clinician
            </p>
            <p className="text-foreground/70">{PATIENT_SAFETY_GUIDANCE}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ---------- Exercise Card (simple patient-friendly) ----------
const ExerciseCard = ({
  ex,
  onView,
}: {
  ex: RehabExercise;
  onView: (e: RehabExercise) => void;
}) => {
  const details = splitExerciseDetails(ex);

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      {ex.image_url ? (
        <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
          <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
        </div>
      ) : null}
      <CardContent className="p-5 flex-1 flex flex-col gap-3">
        <h3 className="font-semibold text-lg text-foreground leading-snug">{ex.name}</h3>
        {ex.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{ex.description}</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {ex.difficulty && (
            <Badge variant="outline" className="capitalize">{ex.difficulty}</Badge>
          )}
          {details.equipment !== "None" && (
            <Badge variant="secondary" className="font-normal">{details.equipment}</Badge>
          )}
          {details.setsReps && (
            <Badge variant="secondary" className="font-normal">{details.setsReps}</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" className="mt-auto" onClick={() => onView(ex)}>
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

const ExerciseList = ({
  exercises,
  emptyMessage,
}: {
  exercises: RehabExercise[];
  emptyMessage: string;
}) => {
  const [active, setActive] = useState<RehabExercise | null>(null);
  if (exercises.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-lg">
        <Activity className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {exercises.map((ex) => (
          <ExerciseCard key={ex.id} ex={ex} onView={setActive} />
        ))}
      </div>
      <DetailModal ex={active} onClose={() => setActive(null)} />
    </>
  );
};

// ---------- Body Locations + Pathologies fetch ----------
const useBodyLocations = () => {
  const [items, setItems] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (supabase as any)
      .from("body_locations")
      .select("id, slug, name")
      .order("sort_order")
      .order("name")
      .then(({ data }: any) => {
        setItems(data || []);
        setLoading(false);
      });
  }, []);
  return { items, loading };
};

const usePathologiesForLocation = (locationId: string | null) => {
  const [items, setItems] = useState<{ id: string; slug: string; name: string }[]>([]);
  useEffect(() => {
    if (!locationId) return;
    (supabase as any)
      .from("pathologies")
      .select("id, slug, name")
      .eq("body_location_id", locationId)
      .order("name")
      .then(({ data }: any) => setItems(data || []));
  }, [locationId]);
  return items;
};

// ---------- Main Library Home: "What joint hurts?" ----------
export const ExerciseLibraryHome = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { items: locations, loading } = useBodyLocations();

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/exercise-library/search?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <Layout>
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <div className="text-center mb-8">
            <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">
              Patient Resources
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Patient Exercise Library
            </h1>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Pick the area you'd like exercises for. You'll see general routines and condition-specific options.
            </p>
          </div>

          {loading ? (
            <p className="text-center py-12 text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-3 mb-8">
              {locations.map((loc) => (
                <RowCard
                  key={loc.id}
                  to={`/exercise-library/region/${loc.slug}`}
                  title={loc.name}
                />
              ))}
            </div>
          )}

          <form onSubmit={onSearch} className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Or search exercises..."
              className="pl-11 h-12 text-base"
            />
          </form>

          <SafetyNote />
        </div>
      </section>
    </Layout>
  );
};

// ---------- Joint (Region) Detail: General + Pathology cards ----------
export const RegionDetail = () => {
  const { slug = "" } = useParams();
  const { items: locations } = useBodyLocations();
  const location = locations.find((l) => l.slug === slug);
  const pathologies = usePathologiesForLocation(location?.id || null);
  const { data: exercises, loading } = useRehabExercises();

  const displayName = location?.name || slug;
  const generalExercises = useMemo(
    () =>
      exercises.filter(
        (e) => e.is_general_exercise && e.location_slugs.includes(slug)
      ),
    [exercises, slug]
  );

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <Crumbs
            items={[
              { label: PATIENT_EXERCISES_LABEL, to: "/exercise-library" },
              { label: displayName },
            ]}
          />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {displayName} Exercises
          </h1>
          <p className="text-muted-foreground text-base mb-6">
            Choose general {displayName.toLowerCase()} exercises or select a specific {displayName.toLowerCase()} condition below.
          </p>


          {loading ? (
            <p className="text-center py-12 text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-3 mb-8">
              {generalExercises.length > 0 && (
                <RowCard
                  to={`/exercise-library/region/${slug}/general`}
                  title={`General ${displayName} Exercises`}
                  subtitle="Mobility, stretching, and strengthening basics"
                  emphasized
                  icon={<Sparkles className="w-5 h-5" />}
                />
              )}

              {pathologies.length > 0 && (
                <>
                  <h2 className="text-lg font-semibold text-foreground pt-4 pb-1">
                    {displayName} Conditions
                  </h2>
                  {pathologies.map((p) => (
                    <RowCard
                      key={p.id}
                      to={`/exercise-library/region/${slug}/pathology/${p.slug}`}
                      title={p.name}
                    />
                  ))}
                </>
              )}

              {generalExercises.length === 0 && pathologies.length === 0 && (
                <div className="text-center py-16 border border-dashed border-border rounded-lg">
                  <Activity className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">
                    Exercises for this area are coming soon.
                  </p>
                </div>
              )}
            </div>
          )}
          <SafetyNote />
        </div>
      </section>
    </Layout>
  );
};

// ---------- General Exercises list for a joint ----------
export const RegionGeneralDetail = () => {
  const { slug = "" } = useParams();
  const { items: locations } = useBodyLocations();
  const location = locations.find((l) => l.slug === slug);
  const displayName = location?.name || slug;
  const { data: exercises, loading } = useRehabExercises();

  const list = useMemo(
    () =>
      exercises.filter(
        (e) => e.is_general_exercise && e.location_slugs.includes(slug)
      ),
    [exercises, slug]
  );

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <Crumbs
            items={[
              { label: PATIENT_EXERCISES_LABEL, to: "/exercise-library" },
              { label: displayName, to: `/exercise-library/region/${slug}` },
              { label: "General Exercises" },
            ]}
          />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            General {displayName} Exercises
          </h1>
          <p className="text-muted-foreground text-base mb-6">
            Foundational mobility, stretching, and strengthening routines for the {displayName.toLowerCase()}.
          </p>
          {loading ? (
            <p className="text-center py-12 text-muted-foreground">Loading...</p>
          ) : (
            <ExerciseList
              exercises={list}
              emptyMessage="General exercises coming soon for this joint."
            />
          )}
          <SafetyNote />
        </div>
      </section>
    </Layout>
  );
};

// ---------- Pathology exercises for a joint ----------
export const RegionPathologyDetail = () => {
  const { slug = "", pathologySlug = "" } = useParams();
  const { items: locations } = useBodyLocations();
  const location = locations.find((l) => l.slug === slug);
  const displayName = location?.name || slug;
  const { data: exercises, loading } = useRehabExercises();

  const list = useMemo(
    () => exercises.filter((e) => e.pathology_slugs.includes(pathologySlug)),
    [exercises, pathologySlug]
  );

  const pathologyName =
    list[0]?.pathology_names[list[0]?.pathology_slugs.indexOf(pathologySlug)] ||
    pathologySlug;

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <Crumbs
            items={[
              { label: PATIENT_EXERCISES_LABEL, to: "/exercise-library" },
              { label: displayName, to: `/exercise-library/region/${slug}` },
              { label: pathologyName },
            ]}
          />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {pathologyName}
          </h1>
          {loading ? (
            <p className="text-center py-12 text-muted-foreground">Loading...</p>
          ) : (
            <ExerciseList
              exercises={list}
              emptyMessage="Exercises for this condition are coming soon. Please ask your clinician for guidance."
            />
          )}
          <SafetyNote />
        </div>
      </section>
    </Layout>
  );
};

// ---------- Search ----------
export const ExerciseSearch = () => {
  const { data: exercises, loading } = useRehabExercises();
  const params = new URLSearchParams(window.location.search);
  const initialQ = params.get("q") || "";
  const [q, setQ] = useState(initialQ);

  const filtered = useMemo(() => {
    if (!q.trim()) return exercises;
    const needle = q.toLowerCase();
    return exercises.filter((e) =>
      [
        e.name,
        e.description || "",
        e.instructions || "",
        ...e.location_names,
        ...e.pathology_names,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [exercises, q]);

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <Crumbs
            items={[
              { label: PATIENT_EXERCISES_LABEL, to: "/exercise-library" },
              { label: "Search" },
            ]}
          />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Search Patient Exercises
          </h1>
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search exercises..."
              className="pl-11 h-12 text-base"
            />
          </div>
          {loading ? (
            <p className="text-center py-12 text-muted-foreground">Loading...</p>
          ) : (
            <ExerciseList
              exercises={filtered}
              emptyMessage="No exercises match your search."
            />
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ExerciseLibraryHome;
