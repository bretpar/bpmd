import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, Activity, HeartPulse, ChevronRight, Search, AlertTriangle, Home as HomeIcon } from "lucide-react";

// ---------- Static taxonomies ----------
export const DIAGNOSES = [
  { slug: "shoulder-impingement", name: "Shoulder Impingement", region: "shoulder" },
  { slug: "rotator-cuff-tendinitis", name: "Rotator Cuff Tendinitis", region: "shoulder" },
  { slug: "rotator-cuff-tear", name: "Rotator Cuff Tear", region: "shoulder" },
  { slug: "frozen-shoulder", name: "Frozen Shoulder", region: "shoulder" },
  { slug: "shoulder-arthritis", name: "Shoulder Arthritis", region: "shoulder" },
  { slug: "shoulder-instability", name: "Shoulder Instability", region: "shoulder" },
  { slug: "knee-arthritis", name: "Knee Arthritis", region: "knee" },
  { slug: "patellofemoral-pain", name: "Patellofemoral Pain", region: "knee" },
  { slug: "meniscus-tear", name: "Meniscus Tear", region: "knee" },
  { slug: "it-band-syndrome", name: "IT Band Syndrome", region: "knee" },
  { slug: "hip-bursitis", name: "Hip Bursitis", region: "hip" },
  { slug: "low-back-pain", name: "Low Back Pain", region: "low-back" },
  { slug: "neck-strain", name: "Neck Strain", region: "neck" },
];

export const REGIONS = [
  { slug: "shoulder", name: "Shoulder" },
  { slug: "elbow", name: "Elbow" },
  { slug: "wrist-hand", name: "Wrist / Hand" },
  { slug: "hip", name: "Hip" },
  { slug: "knee", name: "Knee" },
  { slug: "ankle-foot", name: "Ankle / Foot" },
  { slug: "neck", name: "Neck" },
  { slug: "low-back", name: "Low Back" },
];

export const JOINT_HEALTH = [
  { slug: "shoulder-health", name: "Shoulder Health" },
  { slug: "knee-health", name: "Knee Health" },
  { slug: "hip-health", name: "Hip Health" },
  { slug: "low-back-health", name: "Low Back Health" },
  { slug: "neck-health", name: "Neck Health" },
  { slug: "ankle-health", name: "Ankle Health" },
];

const TYPE_LABELS: Record<string, string> = {
  stretch: "Stretches",
  mobility: "Mobility / Range of Motion",
  strengthening: "Strengthening",
};

const TYPE_LABELS_JOINT: Record<string, string> = {
  mobility: "Quick Mobility",
  stretch: "Stretching",
  strengthening: "Strengthening",
};

// ---------- Types ----------
type Exercise = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  body_region: string | null;
  joint_health_category: string | null;
  diagnosis_tags: string[] | null;
  exercise_type: string | null;
  equipment: string | null;
  difficulty: string | null;
  sets_reps_or_hold_time: string | null;
  instructions: string | null;
  purpose: string | null;
  you_should_feel: string | null;
  stop_if: string | null;
  common_mistakes: string | null;
  safety_tips: string | null;
  related_exercises: string[] | null;
  image_url: string | null;
  video_url: string | null;
};

// ---------- Disclaimer ----------
const Disclaimer = () => (
  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex gap-3">
    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
    <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
      These exercises are for general education and should not replace medical advice. Only perform
      exercises recommended by your clinician. Stop if you develop worsening pain, numbness, tingling,
      new weakness, or symptoms that concern you.
    </p>
  </div>
);

// ---------- Breadcrumbs ----------
const Crumbs = ({ items }: { items: { label: string; to?: string }[] }) => (
  <nav className="flex items-center flex-wrap gap-1 text-sm text-muted-foreground mb-6">
    <Link to="/" className="hover:text-foreground flex items-center gap-1"><HomeIcon className="w-3.5 h-3.5" /></Link>
    {items.map((it, i) => (
      <span key={i} className="flex items-center gap-1">
        <ChevronRight className="w-3.5 h-3.5" />
        {it.to ? <Link to={it.to} className="hover:text-foreground">{it.label}</Link> : <span className="text-foreground font-medium">{it.label}</span>}
      </span>
    ))}
  </nav>
);

// ---------- Exercise Card ----------
const ExerciseCard = ({ ex, onView }: { ex: Exercise; onView: (e: Exercise) => void }) => (
  <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
    <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
      {ex.image_url ? (
        <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <Activity className="w-10 h-10 text-muted-foreground/40" />
      )}
    </div>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg">{ex.name}</CardTitle>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {ex.exercise_type && <Badge variant="secondary" className="capitalize">{ex.exercise_type}</Badge>}
        {ex.body_region && <Badge variant="outline" className="capitalize">{ex.body_region.replace("-", " / ")}</Badge>}
        {ex.difficulty && <Badge variant="outline" className="capitalize">{ex.difficulty}</Badge>}
      </div>
    </CardHeader>
    <CardContent className="flex-1 flex flex-col gap-3 text-sm">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><span className="text-muted-foreground">Equipment:</span> <span className="font-medium">{ex.equipment || "None"}</span></div>
        <div><span className="text-muted-foreground">Dose:</span> <span className="font-medium">{ex.sets_reps_or_hold_time || "—"}</span></div>
      </div>
      {ex.instructions && <p className="text-muted-foreground line-clamp-3">{ex.instructions}</p>}
      {ex.you_should_feel && (
        <div className="bg-primary/5 border border-primary/20 rounded-md p-2.5">
          <p className="text-xs font-semibold text-primary mb-0.5">You should feel</p>
          <p className="text-xs text-foreground/80">{ex.you_should_feel}</p>
        </div>
      )}
      {ex.stop_if && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-md p-2.5">
          <p className="text-xs font-semibold text-destructive mb-0.5">Stop if</p>
          <p className="text-xs text-foreground/80">{ex.stop_if}</p>
        </div>
      )}
      <Button variant="outline" size="sm" className="mt-auto" onClick={() => onView(ex)}>View Details</Button>
    </CardContent>
  </Card>
);

// ---------- Detail Modal ----------
const DetailModal = ({ ex, allExercises, onClose, onView }: { ex: Exercise | null; allExercises: Exercise[]; onClose: () => void; onView: (e: Exercise) => void }) => {
  if (!ex) return null;
  const related = (ex.related_exercises || []).map((id) => allExercises.find((e) => e.id === id)).filter(Boolean) as Exercise[];
  return (
    <Dialog open={!!ex} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{ex.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 text-sm">
          <div className="flex flex-wrap gap-1.5">
            {ex.exercise_type && <Badge variant="secondary" className="capitalize">{ex.exercise_type}</Badge>}
            {ex.body_region && <Badge variant="outline" className="capitalize">{ex.body_region.replace("-", " / ")}</Badge>}
            {ex.difficulty && <Badge variant="outline" className="capitalize">{ex.difficulty}</Badge>}
            {ex.equipment && <Badge variant="outline">{ex.equipment}</Badge>}
          </div>
          {ex.image_url && <img src={ex.image_url} alt={ex.name} className="w-full rounded-lg" />}
          {ex.purpose && <Section title="Purpose">{ex.purpose}</Section>}
          {ex.instructions && <Section title="Step-by-step Instructions"><p className="whitespace-pre-line">{ex.instructions}</p></Section>}
          {ex.sets_reps_or_hold_time && <Section title="Sets / Reps / Hold Time">{ex.sets_reps_or_hold_time}</Section>}
          {ex.you_should_feel && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-sm font-semibold text-primary mb-1">You should feel</p>
              <p className="text-foreground/80">{ex.you_should_feel}</p>
            </div>
          )}
          {ex.stop_if && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm font-semibold text-destructive mb-1">Stop if</p>
              <p className="text-foreground/80">{ex.stop_if}</p>
            </div>
          )}
          {ex.common_mistakes && <Section title="Common Mistakes"><p className="whitespace-pre-line">{ex.common_mistakes}</p></Section>}
          {ex.safety_tips && <Section title="Safety Tips"><p className="whitespace-pre-line">{ex.safety_tips}</p></Section>}
          {(ex.diagnosis_tags?.length || ex.body_region) && (
            <Section title="Commonly Used For">
              <div className="flex flex-wrap gap-1.5">
                {ex.body_region && <Badge variant="outline" className="capitalize">{ex.body_region.replace("-", " / ")}</Badge>}
                {ex.diagnosis_tags?.map((t) => {
                  const dx = DIAGNOSES.find((d) => d.slug === t);
                  return <Badge key={t} variant="outline">{dx?.name || t}</Badge>;
                })}
              </div>
            </Section>
          )}
          {related.length > 0 && (
            <Section title="Related Exercises">
              <div className="flex flex-wrap gap-2">
                {related.map((r) => (
                  <Button key={r.id} variant="outline" size="sm" onClick={() => onView(r)}>{r.name}</Button>
                ))}
              </div>
            </Section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h4 className="font-semibold text-foreground mb-1.5">{title}</h4>
    <div className="text-foreground/80">{children}</div>
  </div>
);

// ---------- Filter Bar ----------
type Filters = { type: string; equipment: string; difficulty: string };
const FilterBar = ({ filters, setFilters, search, setSearch, equipmentOptions }: {
  filters: Filters; setFilters: (f: Filters) => void; search: string; setSearch: (s: string) => void; equipmentOptions: string[];
}) => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises..." className="pl-9" />
    </div>
    <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
      <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Types</SelectItem>
        <SelectItem value="stretch">Stretch</SelectItem>
        <SelectItem value="mobility">Mobility</SelectItem>
        <SelectItem value="strengthening">Strengthening</SelectItem>
      </SelectContent>
    </Select>
    <Select value={filters.equipment} onValueChange={(v) => setFilters({ ...filters, equipment: v })}>
      <SelectTrigger><SelectValue placeholder="All Equipment" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Equipment</SelectItem>
        {equipmentOptions.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
      </SelectContent>
    </Select>
    <Select value={filters.difficulty} onValueChange={(v) => setFilters({ ...filters, difficulty: v })}>
      <SelectTrigger><SelectValue placeholder="All Difficulty" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Difficulty</SelectItem>
        <SelectItem value="easy">Easy</SelectItem>
        <SelectItem value="moderate">Moderate</SelectItem>
        <SelectItem value="advanced">Advanced</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

// ---------- Grouped exercise list ----------
const GroupedExercises = ({ exercises, labels, onView }: { exercises: Exercise[]; labels: Record<string, string>; onView: (e: Exercise) => void }) => {
  const order = ["mobility", "stretch", "strengthening"];
  const grouped = order
    .map((t) => ({ type: t, label: labels[t], items: exercises.filter((e) => e.exercise_type === t) }))
    .filter((g) => g.items.length > 0);

  if (grouped.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No exercises found. Try adjusting your filters.</p>
      </div>
    );
  }
  return (
    <div className="space-y-10">
      {grouped.map((g) => (
        <section key={g.type}>
          <h2 className="text-2xl font-bold text-foreground mb-4 pb-2 border-b">{g.label}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {g.items.map((ex) => <ExerciseCard key={ex.id} ex={ex} onView={onView} />)}
          </div>
        </section>
      ))}
    </div>
  );
};

// ---------- Hooks ----------
const useExercises = () => {
  const [data, setData] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("exercises").select("*").eq("published", true).order("name").then(({ data }) => {
      setData((data as Exercise[]) || []);
      setLoading(false);
    });
  }, []);
  return { data, loading };
};

const useFiltered = (exercises: Exercise[]) => {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({ type: "all", equipment: "all", difficulty: "all" });
  const equipmentOptions = useMemo(() => Array.from(new Set(exercises.map((e) => e.equipment).filter(Boolean) as string[])).sort(), [exercises]);
  const filtered = useMemo(() => exercises.filter((e) => {
    if (search && !`${e.name} ${e.description || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.type !== "all" && e.exercise_type !== filters.type) return false;
    if (filters.equipment !== "all" && e.equipment !== filters.equipment) return false;
    if (filters.difficulty !== "all" && e.difficulty !== filters.difficulty) return false;
    return true;
  }), [exercises, search, filters]);
  return { filtered, search, setSearch, filters, setFilters, equipmentOptions };
};

// ---------- Pages ----------
export const ExerciseLibraryHome = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/exercise-library/search?q=${encodeURIComponent(search.trim())}`);
  };

  const cards = [
    { to: "/exercise-library/diagnosis", icon: Stethoscope, title: "Exercises by Diagnosis", subtitle: "Find stretches and strengthening exercises based on your diagnosis." },
    { to: "/exercise-library/region", icon: Activity, title: "Exercises by Body Region", subtitle: "Browse all exercises for a specific body part." },
    { to: "/exercise-library/joint-health", icon: HeartPulse, title: "General Joint Health", subtitle: "Simple routines for mobility, stretching, and strengthening." },
  ];
  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="text-center mb-10">
            <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">Patient Resources</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">Exercise Library</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose how you'd like to browse exercises.
            </p>
          </div>
          <form onSubmit={onSearch} className="max-w-xl mx-auto mb-10 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises..." className="pl-11 h-12 text-base" />
          </form>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {cards.map((c) => (
              <Link key={c.to} to={c.to} className="group">
                <Card className="h-full hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <c.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{c.title}</CardTitle>
                    <CardDescription className="text-base mt-2">{c.subtitle}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-primary text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Browse <ChevronRight className="w-4 h-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Disclaimer />
        </div>
      </section>
    </Layout>
  );
};

const PathwayList = ({ title, items, basePath, crumb }: { title: string; items: { slug: string; name: string }[]; basePath: string; crumb: string }) => (
  <Layout>
    <section className="py-10 md:py-16">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <Crumbs items={[{ label: "Exercise Library", to: "/exercise-library" }, { label: crumb }]} />
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{title}</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {items.map((it) => (
            <Link key={it.slug} to={`${basePath}/${it.slug}`}>
              <Card className="hover:shadow-md hover:border-primary/40 transition-all cursor-pointer">
                <CardContent className="p-5 flex items-center justify-between">
                  <span className="font-medium text-foreground">{it.name}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <Disclaimer />
      </div>
    </section>
  </Layout>
);

export const DiagnosisList = () => <PathwayList title="Exercises by Diagnosis" items={DIAGNOSES} basePath="/exercise-library/diagnosis" crumb="Exercises by Diagnosis" />;
export const RegionList = () => <PathwayList title="Exercises by Body Region" items={REGIONS} basePath="/exercise-library/region" crumb="Exercises by Body Region" />;
export const JointHealthList = () => <PathwayList title="General Joint Health" items={JOINT_HEALTH} basePath="/exercise-library/joint-health" crumb="General Joint Health" />;

const PathwayDetail = ({
  pageTitle, crumbParent, crumbParentTo, crumbCurrent, predicate, labels, exercises, loading,
}: {
  pageTitle: string; crumbParent: string; crumbParentTo: string; crumbCurrent: string;
  predicate: (e: Exercise) => boolean; labels: Record<string, string>; exercises: Exercise[]; loading: boolean;
}) => {
  const [active, setActive] = useState<Exercise | null>(null);
  const scoped = useMemo(() => exercises.filter(predicate), [exercises, predicate]);
  const { filtered, search, setSearch, filters, setFilters, equipmentOptions } = useFiltered(scoped);

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <Crumbs items={[
            { label: "Exercise Library", to: "/exercise-library" },
            { label: crumbParent, to: crumbParentTo },
            { label: crumbCurrent },
          ]} />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{pageTitle}</h1>
          <div className="mb-6"><Disclaimer /></div>
          <FilterBar filters={filters} setFilters={setFilters} search={search} setSearch={setSearch} equipmentOptions={equipmentOptions} />
          {loading ? (
            <p className="text-center py-12 text-muted-foreground">Loading exercises...</p>
          ) : (
            <GroupedExercises exercises={filtered} labels={labels} onView={setActive} />
          )}
        </div>
      </section>
      <DetailModal ex={active} allExercises={exercises} onClose={() => setActive(null)} onView={setActive} />
    </Layout>
  );
};

export const DiagnosisDetail = () => {
  const { slug = "" } = useParams();
  const dx = DIAGNOSES.find((d) => d.slug === slug);
  const { data, loading } = useExercises();
  if (!dx) return <Layout><div className="container mx-auto px-4 py-20 text-center">Diagnosis not found.</div></Layout>;
  return (
    <PathwayDetail
      pageTitle={dx.name}
      crumbParent="Exercises by Diagnosis"
      crumbParentTo="/exercise-library/diagnosis"
      crumbCurrent={dx.name}
      predicate={(e) => (e.diagnosis_tags || []).includes(slug)}
      labels={TYPE_LABELS}
      exercises={data}
      loading={loading}
    />
  );
};

export const RegionDetail = () => {
  const { slug = "" } = useParams();
  const region = REGIONS.find((r) => r.slug === slug);
  const { data, loading } = useExercises();
  if (!region) return <Layout><div className="container mx-auto px-4 py-20 text-center">Body region not found.</div></Layout>;
  return (
    <PathwayDetail
      pageTitle={region.name}
      crumbParent="Exercises by Body Region"
      crumbParentTo="/exercise-library/region"
      crumbCurrent={region.name}
      predicate={(e) => e.body_region === slug}
      labels={TYPE_LABELS}
      exercises={data}
      loading={loading}
    />
  );
};

export const JointHealthDetail = () => {
  const { slug = "" } = useParams();
  const cat = JOINT_HEALTH.find((j) => j.slug === slug);
  const { data, loading } = useExercises();
  if (!cat) return <Layout><div className="container mx-auto px-4 py-20 text-center">Category not found.</div></Layout>;
  return (
    <PathwayDetail
      pageTitle={cat.name}
      crumbParent="General Joint Health"
      crumbParentTo="/exercise-library/joint-health"
      crumbCurrent={cat.name}
      predicate={(e) => e.joint_health_category === slug}
      labels={TYPE_LABELS_JOINT}
      exercises={data}
      loading={loading}
    />
  );
};

export const ExerciseSearch = () => {
  const [active, setActive] = useState<Exercise | null>(null);
  const { data, loading } = useExercises();
  const params = new URLSearchParams(window.location.search);
  const initialQ = params.get("q") || "";
  const { filtered, search, setSearch, filters, setFilters, equipmentOptions } = useFiltered(data);
  useEffect(() => { if (initialQ) setSearch(initialQ); }, [initialQ]);

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <Crumbs items={[{ label: "Exercise Library", to: "/exercise-library" }, { label: "Search" }]} />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Search Exercises</h1>
          <FilterBar filters={filters} setFilters={setFilters} search={search} setSearch={setSearch} equipmentOptions={equipmentOptions} />
          {loading ? (
            <p className="text-center py-12 text-muted-foreground">Loading...</p>
          ) : (
            <GroupedExercises exercises={filtered} labels={TYPE_LABELS} onView={setActive} />
          )}
        </div>
      </section>
      <DetailModal ex={active} allExercises={data} onClose={() => setActive(null)} onView={setActive} />
    </Layout>
  );
};

export default ExerciseLibraryHome;
