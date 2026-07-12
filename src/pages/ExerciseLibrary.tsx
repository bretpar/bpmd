import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ChevronRight,
  Search,
  Home as HomeIcon,
  Activity,
  Sparkles,
  ListOrdered,
} from "lucide-react";
import { RehabExercise, REHAB_PHASE_ORDER } from "@/hooks/useRehabExercises";
import {
  useBodyLocations,
  useBodyLocationBySlug,
  usePathologiesForLocation,
  usePathologyBySlug,
  useExercisesForLocation,
  useExercisesForPathology,
  usePathologyProgram,
  useAllRehabExercises,
  usePrefetchRegion,
} from "@/hooks/useExerciseLibraryData";
import { prescription, type LibraryExercise, type PhaseExercise } from "@/lib/programTypes";


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
  onHoverPrefetch,
}: {
  to: string;
  title: string;
  emphasized?: boolean;
  icon?: React.ReactNode;
  subtitle?: string;
  onHoverPrefetch?: () => void;
}) => (
  <Link
    to={to}
    className="block"
    onMouseEnter={onHoverPrefetch}
    onFocus={onHoverPrefetch}
    onTouchStart={onHoverPrefetch}
  >
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

// ---------- Exercise Card (simple patient-friendly, collapsible Learn More) ----------
const ExerciseCard = ({
  ex,
  onView,
}: {
  ex: RehabExercise;
  onView: (e: RehabExercise) => void;
}) => {
  const details = splitExerciseDetails(ex);
  const [open, setOpen] = useState(false);
  const brief = (details.instructions || ex.description || "").split("\n")[0] || "";

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      {ex.image_url ? (
        <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
          <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
        </div>
      ) : null}
      <CardContent className="p-4 flex-1 flex flex-col gap-2">
        <h3 className="font-semibold text-base text-foreground leading-snug">{ex.name}</h3>
        {details.setsReps && (
          <p className="text-sm font-medium text-primary">{details.setsReps}</p>
        )}
        {brief && (
          <p className="text-sm text-muted-foreground line-clamp-2">{brief}</p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
          >
            Learn more <ChevronRight className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`} />
          </button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onView(ex)}>
            View Details
          </Button>
        </div>
        {open && (
          <div className="pt-2 border-t border-border text-sm space-y-1.5">
            {ex.description && <p className="text-muted-foreground">{ex.description}</p>}
            <div className="flex flex-wrap gap-1.5">
              {ex.difficulty && <Badge variant="outline" className="capitalize text-xs">{ex.difficulty}</Badge>}
              {details.equipment !== "None" && <Badge variant="secondary" className="text-xs font-normal">{details.equipment}</Badge>}
              {details.frequency && <Badge variant="secondary" className="text-xs font-normal">{details.frequency}</Badge>}
            </div>
          </div>
        )}
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

// ---------- Small loading skeletons ----------
const RowSkeleton = () => (
  <div className="rounded-lg border border-border bg-card p-5 flex items-center gap-3">
    <Skeleton className="w-10 h-10 rounded-lg" />
    <Skeleton className="h-4 flex-1 max-w-[60%]" />
  </div>
);
const RowSkeletonList = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <RowSkeleton key={i} />
    ))}
  </div>
);
const CardSkeleton = () => (
  <div className="rounded-lg border border-border bg-card overflow-hidden">
    <Skeleton className="aspect-video w-full rounded-none" />
    <div className="p-4 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-full" />
    </div>
  </div>
);
const CardGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);
const RetryBox = ({ onRetry }: { onRetry: () => void }) => (
  <div className="text-center py-12 border border-dashed border-border rounded-lg">
    <p className="text-muted-foreground mb-3">We couldn't load this content. Please try again.</p>
    <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
  </div>
);


// ---------- Main Library Home: "What joint hurts?" ----------
export const ExerciseLibraryHome = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: locations = [], isLoading, isError, refetch } = useBodyLocations();
  const prefetchRegion = usePrefetchRegion();

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/exercise-library/search?q=${encodeURIComponent(search.trim())}`);
  };


  return (
    <Layout>
      <SEO
        title="Patient Exercise Library | Brendan Parker, MD"
        description="Browse patient-friendly rehabilitation exercises organized by body region and condition. Curated by Dr. Brendan Parker for sports medicine recovery."
        path="/exercise-library"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Patient Exercise Library",
          "description": "Browse patient-friendly rehabilitation exercises organized by body region and condition. Curated by Dr. Brendan Parker for sports medicine recovery.",
          "author": { "@type": "Person", "name": "Brendan Parker, MD" },
          "publisher": { "@type": "MedicalBusiness", "name": "Brendan Parker, MD — Sports Medicine" },
          "url": "https://brendanparkermd.com/exercise-library"
        }}
      />
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

          {isLoading ? (
            <div className="mb-8"><RowSkeletonList count={6} /></div>
          ) : isError ? (
            <div className="mb-8"><RetryBox onRetry={() => refetch()} /></div>
          ) : (
            <div className="space-y-3 mb-8">
              {locations.map((loc) => (
                <RowCard
                  key={loc.id}
                  to={`/exercise-library/region/${loc.slug}`}
                  title={loc.name}
                  onHoverPrefetch={() => prefetchRegion(loc.slug)}
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
  const { data: location, isLoading: locLoading, isError: locError, refetch: refetchLoc } =
    useBodyLocationBySlug(slug);
  const {
    data: pathologies = [],
    isLoading: pathLoading,
    isError: pathError,
    refetch: refetchPath,
  } = usePathologiesForLocation(location?.id);
  const {
    data: exercises = [],
    isLoading: exLoading,
    isError: exError,
    refetch: refetchEx,
  } = useExercisesForLocation(location?.id);

  const displayName = location?.name || slug;
  const generalExercises = useMemo(
    () => exercises.filter((e) => e.is_general_exercise),
    [exercises]
  );

  const loading = locLoading || pathLoading || exLoading;
  const isError = locError || pathError || exError;

  return (
    <Layout>
      <SEO
        title={`${displayName} Exercises | Brendan Parker, MD`}
        description={`General and condition-specific rehabilitation exercises for the ${displayName}. Browse curated routines from Dr. Brendan Parker's sports medicine practice.`}
        path={`/exercise-library/region/${slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": `${displayName} Exercises`,
          "description": `General and condition-specific rehabilitation exercises for the ${displayName}. Browse curated routines from Dr. Brendan Parker's sports medicine practice.`,
          "author": { "@type": "Person", "name": "Brendan Parker, MD" },
          "publisher": { "@type": "MedicalBusiness", "name": "Brendan Parker, MD — Sports Medicine" },
          "url": `https://brendanparkermd.com/exercise-library/region/${slug}`
        }}
      />
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
            <div className="mb-8"><RowSkeletonList count={4} /></div>
          ) : isError ? (
            <div className="mb-8">
              <RetryBox
                onRetry={() => {
                  refetchLoc();
                  refetchPath();
                  refetchEx();
                }}
              />
            </div>
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
  const { data: location } = useBodyLocationBySlug(slug);
  const displayName = location?.name || slug;
  const {
    data: exercises = [],
    isLoading,
    isError,
    refetch,
  } = useExercisesForLocation(location?.id);

  const list = useMemo(
    () => exercises.filter((e) => e.is_general_exercise),
    [exercises]
  );

  return (
    <Layout>
      <SEO
        title={`General ${displayName} Exercises | Brendan Parker, MD`}
        description={`Foundational mobility, stretching, and strengthening exercises for the ${displayName}. Patient-friendly rehabilitation routines from Dr. Brendan Parker.`}
        path={`/exercise-library/region/${slug}/general`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": `General ${displayName} Exercises`,
          "description": `Foundational mobility, stretching, and strengthening exercises for the ${displayName}. Patient-friendly rehabilitation routines from Dr. Brendan Parker.`,
          "author": { "@type": "Person", "name": "Brendan Parker, MD" },
          "publisher": { "@type": "MedicalBusiness", "name": "Brendan Parker, MD — Sports Medicine" },
          "url": `https://brendanparkermd.com/exercise-library/region/${slug}/general`
        }}
      />
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
          {isLoading ? (
            <CardGridSkeleton count={6} />
          ) : isError ? (
            <RetryBox onRetry={() => refetch()} />
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


// ---------- Library-exercise renderers (for Recommended Recovery Program) ----------
type FullProgramShape = {
  id: string;
  slug: string;
  name: string;
  intro_text: string | null;
  estimated_duration: string | null;
  program_phases: Array<{
    id: string;
    title: string;
    sort_order: number;
    goal: string | null;
    estimated_workout_minutes: number | null;
    phase_exercises: Array<
      PhaseExercise & { exercise_library: LibraryExercise | null }
    >;
  }>;
};

const LibraryDetailModal = ({
  ex,
  pe,
  onClose,
}: {
  ex: LibraryExercise | null;
  pe?: PhaseExercise;
  onClose: () => void;
}) => {
  if (!ex) return null;
  const dose = pe ? prescription(pe, ex) : "";
  return (
    <Dialog open={!!ex} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{ex.name}</DialogTitle>
          <DialogDescription>
            Exercise instructions, prescription, and safety guidance.
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
              <a href={ex.video_url} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                {ex.video_url}
              </a>
            </Section>
          )}
          {ex.short_description && <Section title="Why this helps">{ex.short_description}</Section>}
          {ex.instructions && <Section title="How to do it">{ex.instructions}</Section>}
          {dose && <Section title="Prescription">{dose}</Section>}
          {ex.what_to_feel && <Section title="What you should feel">{ex.what_to_feel}</Section>}
          {ex.safety_notes && (
            <div className="bg-muted/40 border border-border rounded-lg p-3">
              <p className="text-sm font-semibold text-foreground/80 mb-1">Stop if</p>
              <p className="text-foreground/70 whitespace-pre-line">{ex.safety_notes}</p>
            </div>
          )}
          <div className="bg-muted/40 border border-border rounded-lg p-3">
            <p className="text-sm font-semibold text-foreground/80 mb-1">When to stop or contact a clinician</p>
            <p className="text-foreground/70">{PATIENT_SAFETY_GUIDANCE}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const LibraryExerciseCard = ({
  pe,
  onView,
}: {
  pe: PhaseExercise & { exercise_library: LibraryExercise | null };
  onView: (ex: LibraryExercise, pe: PhaseExercise) => void;
}) => {
  const ex = pe.exercise_library;
  const [open, setOpen] = useState(false);
  if (!ex) return null;
  const dose = prescription(pe, ex);
  const brief = (ex.instructions || "").split("\n")[0] || "";
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      {ex.image_url && (
        <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
          <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      <CardContent className="p-4 flex-1 flex flex-col gap-2">
        <h4 className="font-semibold text-base text-foreground leading-snug">{ex.name}</h4>
        {dose && <p className="text-sm font-medium text-primary">{dose}</p>}
        {brief && <p className="text-sm text-muted-foreground line-clamp-2">{brief}</p>}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
          >
            Learn more <ChevronRight className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`} />
          </button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onView(ex, pe)}>
            View Details
          </Button>
        </div>
        {open && (
          <div className="pt-2 border-t border-border text-sm space-y-1.5">
            {ex.short_description && <p className="text-muted-foreground">{ex.short_description}</p>}
            {ex.difficulty && <Badge variant="outline" className="capitalize text-xs">{ex.difficulty}</Badge>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};


// Group rehab exercises into simple patient-friendly categories.
const REHAB_GROUP_LABELS: Record<string, string> = {
  acute: "Pain Relief",
  early_rehab: "Mobility & Motion",
  strengthening: "Strengthening",
  return_to_activity: "Advanced / Return to Sport",
  maintenance: "Maintenance",
  other: "More Exercises",
};

const groupRehabExercises = (list: RehabExercise[]) => {
  const buckets = new Map<string, RehabExercise[]>();
  for (const e of list) {
    const key = e.rehab_phase && REHAB_GROUP_LABELS[e.rehab_phase] ? e.rehab_phase : "other";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(e);
  }
  const order = [...REHAB_PHASE_ORDER, "other"];
  return order
    .filter((k) => buckets.has(k))
    .map((k) => ({ key: k, label: REHAB_GROUP_LABELS[k], items: buckets.get(k)! }));
};

export const RegionPathologyDetail = () => {
  const { slug = "", pathologySlug = "" } = useParams();
  const { items: locations } = useBodyLocations();
  const location = locations.find((l) => l.slug === slug);
  const displayName = location?.name || slug;
  const { data: exercises, loading } = useRehabExercises();
  const [program, setProgram] = useState<FullProgramShape | null>(null);
  const [activeLib, setActiveLib] = useState<{ ex: LibraryExercise; pe?: PhaseExercise } | null>(null);
  const [activeRehab, setActiveRehab] = useState<RehabExercise | null>(null);

  const list = useMemo(
    () => exercises.filter((e) => e.pathology_slugs.includes(pathologySlug)),
    [exercises, pathologySlug]
  );

  const pathologyName =
    list[0]?.pathology_names[list[0]?.pathology_slugs.indexOf(pathologySlug)] ||
    pathologySlug;

  useEffect(() => {
    (async () => {
      const { data: p } = await (supabase as any)
        .from("pathologies")
        .select("exercise_program_id")
        .eq("slug", pathologySlug)
        .maybeSingle();
      if (!p?.exercise_program_id) { setProgram(null); return; }
      const { data: prog } = await (supabase as any)
        .from("exercise_programs")
        .select(`
          id, slug, name, intro_text, estimated_duration, status,
          program_phases (
            id, title, sort_order, goal, estimated_workout_minutes,
            phase_exercises (
              id, phase_id, exercise_id, sort_order,
              override_sets, override_reps, override_hold_seconds,
              override_duration, override_frequency, is_required,
              exercise_library ( * )
            )
          )
        `)
        .eq("id", p.exercise_program_id)
        .eq("status", "published")
        .maybeSingle();
      if (!prog) { setProgram(null); return; }
      // Sort nested arrays defensively.
      prog.program_phases = (prog.program_phases || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
      prog.program_phases.forEach((ph: any) => {
        ph.phase_exercises = (ph.phase_exercises || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
      });
      setProgram(prog);
    })();
  }, [pathologySlug]);

  const grouped = useMemo(() => groupRehabExercises(list), [list]);

  return (
    <Layout>
      <SEO
        title={`${pathologyName} Exercises | Brendan Parker, MD`}
        description={`Rehabilitation exercises for ${pathologyName} in the ${displayName}. Recovery routines curated by Dr. Brendan Parker for sports medicine patients.`}
        path={`/exercise-library/region/${slug}/pathology/${pathologySlug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": `${pathologyName} Exercises`,
          "description": `Rehabilitation exercises for ${pathologyName} in the ${displayName}. Recovery routines curated by Dr. Brendan Parker for sports medicine patients.`,
          "author": { "@type": "Person", "name": "Brendan Parker, MD" },
          "publisher": { "@type": "MedicalBusiness", "name": "Brendan Parker, MD — Sports Medicine" },
          "url": `https://brendanparkermd.com/exercise-library/region/${slug}/pathology/${pathologySlug}`
        }}
      />
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

          {/* ---------- Start Here ---------- */}
          {program && program.program_phases.length > 0 && (
            <div className="mb-10 rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-5 md:p-6 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <ListOrdered className="w-4 h-4 text-primary" />
                  <p className="text-xs uppercase tracking-wide text-primary font-medium">
                    Start Here
                  </p>
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-foreground">{program.name}</h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Start with these exercises. They are organized in the order patients typically progress through rehabilitation.
                </p>
              </div>

              <Accordion type="multiple" defaultValue={[program.program_phases[0]?.id]} className="px-2 md:px-4">
                {program.program_phases.map((ph, idx) => (
                  <AccordionItem key={ph.id} value={ph.id} className="border-b last:border-b-0">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex-1 text-left pr-3">
                        <div className="font-semibold text-foreground">
                          Phase {idx + 1} – {ph.title}
                        </div>
                        {ph.goal && (
                          <div className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{ph.goal}</div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {ph.phase_exercises.length} exercise{ph.phase_exercises.length === 1 ? "" : "s"}
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent>
                      {ph.goal && (
                        <p className="text-sm text-muted-foreground mb-4 px-1">{ph.goal}</p>
                      )}
                      {ph.phase_exercises.length === 0 ? (
                        <p className="text-sm text-muted-foreground px-1 pb-3">No exercises assigned yet.</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                          {ph.phase_exercises.map((pe) => (
                            <LibraryExerciseCard
                              key={pe.id}
                              pe={pe}
                              onView={(ex, p) => setActiveLib({ ex, pe: p })}
                            />
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* ---------- All Exercises ---------- */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">All Exercises</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Every exercise for {pathologyName.toLowerCase()}, grouped by category. Browse freely if you already know what you're looking for.
              </p>
            </div>

            {loading ? (
              <p className="text-center py-12 text-muted-foreground">Loading...</p>
            ) : list.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-lg">
                <Activity className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">
                  Exercises for this condition are coming soon. Please ask your clinician for guidance.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {grouped.map((g) => (
                  <div key={g.key}>
                    <h3 className="text-base font-semibold text-foreground mb-3 pb-1.5 border-b border-border">
                      {g.label}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {g.items.length} exercise{g.items.length === 1 ? "" : "s"}
                      </span>
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {g.items.map((ex) => (
                        <ExerciseCard key={ex.id} ex={ex} onView={setActiveRehab} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <SafetyNote />
        </div>
      </section>

      <LibraryDetailModal
        ex={activeLib?.ex ?? null}
        pe={activeLib?.pe}
        onClose={() => setActiveLib(null)}
      />
      <DetailModal ex={activeRehab} onClose={() => setActiveRehab(null)} />
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
      <SEO
        title="Search Patient Exercises | Brendan Parker, MD"
        description="Search the patient exercise library for rehabilitation routines by condition, body region, or exercise name. Curated by Dr. Brendan Parker."
        path="/exercise-library/search"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Search Patient Exercises",
          "description": "Search the patient exercise library for rehabilitation routines by condition, body region, or exercise name. Curated by Dr. Brendan Parker.",
          "author": { "@type": "Person", "name": "Brendan Parker, MD" },
          "publisher": { "@type": "MedicalBusiness", "name": "Brendan Parker, MD — Sports Medicine" },
          "url": "https://brendanparkermd.com/exercise-library/search"
        }}
      />
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
