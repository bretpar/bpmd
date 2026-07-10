import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowLeft, Printer, Play, Clock, Repeat, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2,
} from "lucide-react";
import { useFullProgram } from "@/hooks/usePrograms";
import { prescription } from "@/lib/programTypes";
import { trackEvent, trackExercisePageView } from "@/lib/analytics";

const storageKey = (programId: string, phaseId: string) => `bpmd:progress:${programId}:${phaseId}`;
const loadDone = (programId: string, phaseId: string): Record<string, boolean> => {
  try { return JSON.parse(localStorage.getItem(storageKey(programId, phaseId)) || "{}"); } catch { return {}; }
};
const saveDone = (programId: string, phaseId: string, v: Record<string, boolean>) => {
  localStorage.setItem(storageKey(programId, phaseId), JSON.stringify(v));
};

const ProgramView = () => {
  const { slug = "" } = useParams();
  const { data, loading, notFound } = useFullProgram(slug);

  useEffect(() => {
    if (data) trackEvent("program_view", { program: data.program.slug });
  }, [data]);

  if (loading) return <Layout><div className="container mx-auto py-24 text-center text-muted-foreground">Loading...</div></Layout>;
  if (notFound || !data) return (
    <Layout>
      <div className="container mx-auto py-24 text-center">
        <h1 className="text-2xl font-bold mb-2">Program not found</h1>
        <Link to="/exercise-library" className="text-primary hover:underline">← Back to exercises</Link>
      </div>
    </Layout>
  );

  const { program, phases } = data;
  const currentPhase = phases[0];

  return (
    <Layout>
      <SEO
        title={`${program.name} Exercise Program | Brendan Parker, MD`}
        description={program.intro_text?.slice(0, 155) || `Guided exercise program for ${program.condition || program.name}.`}
        path={`/programs/${program.slug}`}
      />
      <section className="py-8 md:py-12 print:py-4">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <div className="print:hidden">
            <Link to="/exercise-library" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </div>

          <header className="mb-8">
            {program.body_region && <p className="text-primary text-sm font-medium uppercase tracking-wide mb-1">{program.body_region}</p>}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{program.name}</h1>
            {program.condition && <p className="text-muted-foreground mt-1">{program.condition}</p>}
            {program.intro_text && <p className="mt-4 text-muted-foreground leading-relaxed">{program.intro_text}</p>}

            {currentPhase && (
              <div className="mt-6 p-5 rounded-xl border border-border bg-card">
                <p className="text-xs uppercase text-muted-foreground tracking-wide">Current phase</p>
                <p className="font-semibold text-lg">{currentPhase.title}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                  {currentPhase.estimated_workout_minutes && <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" />{currentPhase.estimated_workout_minutes} min</span>}
                  {currentPhase.frequency && <span className="inline-flex items-center gap-1"><Repeat className="w-4 h-4" />{currentPhase.frequency}</span>}
                  <span>{currentPhase.exercises.length} exercise(s)</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 print:hidden">
                  <Button asChild><Link to={`/programs/${program.slug}/workout`} onClick={() => trackEvent("program_start", { program: program.slug })}>
                    <Play className="w-4 h-4 mr-2" />Start Today's Workout
                  </Link></Button>
                  <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print Program</Button>
                </div>
              </div>
            )}
          </header>

          <Accordion type="single" collapsible defaultValue={currentPhase?.id}>
            {phases.map((ph, i) => (
              <AccordionItem key={ph.id} value={ph.id}>
                <AccordionTrigger className="text-left">
                  <div>
                    <div className="font-semibold">{i + 1}. {ph.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex gap-3 flex-wrap">
                      {ph.estimated_workout_minutes && <span>{ph.estimated_workout_minutes} min</span>}
                      {ph.frequency && <span>{ph.frequency}</span>}
                      <span>{ph.exercises.length} exercise(s)</span>
                      {ph.approximate_duration && <span>~{ph.approximate_duration}</span>}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {ph.goal && <p className="text-sm mb-3"><span className="font-medium">Goal: </span>{ph.goal}</p>}
                  {ph.progression_criteria && <p className="text-sm mb-3"><span className="font-medium">Progress when: </span>{ph.progression_criteria}</p>}
                  {ph.warning_text && (
                    <p className="text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-3 mb-3 inline-flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                      <span>{ph.warning_text}</span>
                    </p>
                  )}
                  <div className="space-y-2 print:space-y-4">
                    {ph.exercises.map((pe) => (
                      <div key={pe.id} className="p-3 rounded-md border border-border">
                        <div className="flex items-start gap-3">
                          {pe.exercise?.image_url && (
                            <img src={pe.exercise.image_url} alt={pe.exercise.name} className="w-16 h-16 rounded object-cover shrink-0 print:w-24 print:h-24" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{pe.exercise?.name}</p>
                              {!pe.is_required && <Badge variant="outline" className="text-xs">Optional</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{prescription(pe)}</p>
                            {pe.exercise?.short_description && (
                              <p className="text-xs text-muted-foreground mt-1 print:text-sm">{pe.exercise.short_description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
      <style>{`
        @media print {
          nav, header .print\\:hidden, footer, .print\\:hidden { display: none !important; }
        }
      `}</style>
    </Layout>
  );
};

export const ProgramWorkout = () => {
  const { slug = "" } = useParams();
  const nav = useNavigate();
  const { data, loading } = useFullProgram(slug);
  const phase = data?.phases?.[0];
  const exercises = phase?.exercises || [];

  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (data && phase) setDone(loadDone(data.program.id, phase.id));
  }, [data, phase]);

  useEffect(() => {
    if (data) trackExercisePageView({ program: data.program.slug, index: idx });
  }, [idx, data]);

  if (loading) return <Layout><div className="container mx-auto py-24 text-center text-muted-foreground">Loading...</div></Layout>;
  if (!data || !phase) return <Layout><div className="container mx-auto py-24 text-center">Program not found.</div></Layout>;

  const total = exercises.length;
  const completeCount = Object.values(done).filter(Boolean).length;
  const finished = total > 0 && completeCount === total;
  const current = exercises[idx];

  const toggle = (v: boolean) => {
    if (!current) return;
    const next = { ...done, [current.id]: v };
    setDone(next);
    saveDone(data.program.id, phase.id, next);
    if (v) trackEvent("exercise_complete", { program: data.program.slug, exercise: current.exercise?.slug });
  };

  return (
    <Layout>
      <SEO title={`${data.program.name} Workout | Brendan Parker, MD`} description="Guided exercise session." path={`/programs/${slug}/workout`} />
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-2xl">
          <button onClick={() => nav(-1)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to program
          </button>

          <div className="mb-6">
            <p className="text-xs uppercase tracking-wide text-primary">{data.program.name}</p>
            <h1 className="text-2xl font-bold">{phase.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{completeCount} of {total} exercises completed</p>
            <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: total ? `${(completeCount / total) * 100}%` : "0%" }} />
            </div>
          </div>

          {finished ? (
            <div className="text-center p-8 rounded-xl border border-border bg-card">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-semibold mb-1">Great work — session complete!</h2>
              <p className="text-muted-foreground text-sm mb-4">Remember to note any pain or difficulty for your next visit.</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => { const empty = {}; setDone(empty); saveDone(data.program.id, phase.id, empty); setIdx(0); }}>Reset</Button>
                <Button asChild><Link to={`/programs/${slug}`}>Back to program</Link></Button>
              </div>
            </div>
          ) : current ? (
            <div className="p-5 rounded-xl border border-border bg-card space-y-4">
              {current.exercise?.image_url && (
                <img src={current.exercise.image_url} alt={current.exercise.name} className="w-full rounded-lg object-cover max-h-64" />
              )}
              {current.exercise?.video_url && (
                <a href={current.exercise.video_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Watch video demo →</a>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Exercise {idx + 1} of {total}</p>
                <h2 className="text-xl font-semibold">{current.exercise?.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{prescription(current)}</p>
              </div>
              {current.exercise?.instructions && (
                <div>
                  <p className="text-sm font-medium mb-1">How to do it</p>
                  <p className="text-sm whitespace-pre-line text-muted-foreground">{current.exercise.instructions}</p>
                </div>
              )}
              {current.exercise?.what_to_feel && (
                <div className="p-3 rounded bg-muted/50">
                  <p className="text-xs font-medium">What you should feel</p>
                  <p className="text-sm">{current.exercise.what_to_feel}</p>
                </div>
              )}
              {current.exercise?.common_mistakes && (
                <div className="p-3 rounded bg-muted/50">
                  <p className="text-xs font-medium">Common mistake</p>
                  <p className="text-sm">{current.exercise.common_mistakes}</p>
                </div>
              )}
              {current.exercise?.safety_notes && (
                <div className="p-3 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                  <div><p className="text-xs font-medium">Safety</p><p className="text-sm">{current.exercise.safety_notes}</p></div>
                </div>
              )}
              <label className="flex items-center gap-2 pt-2 border-t border-border">
                <Checkbox checked={!!done[current.id]} onCheckedChange={(v) => toggle(!!v)} />
                <span className="text-sm">Mark complete</span>
              </label>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
                  <ChevronLeft className="w-4 h-4 mr-1" />Previous
                </Button>
                <Button onClick={() => setIdx((i) => Math.min(total - 1, i + 1))} disabled={idx >= total - 1}>
                  Next<ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">This phase has no exercises yet.</p>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ProgramView;
