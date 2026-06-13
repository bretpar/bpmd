import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import ContactCTA from "@/components/ContactCTA";
import { ChevronRight, Activity } from "lucide-react";
import { useRehabExercises, REHAB_PHASE_LABELS } from "@/hooks/useRehabExercises";

const PTExercises = () => {
  const { data: exercises, loading } = useRehabExercises();
  const [openRegion, setOpenRegion] = useState<string | null>(null);

  // Group by body location (each exercise can appear in multiple regions)
  const grouped: Record<string, { name: string; items: typeof exercises }> = {};
  for (const ex of exercises) {
    if (ex.location_slugs.length === 0) {
      grouped["other"] ||= { name: "Other", items: [] };
      grouped["other"].items.push(ex);
      continue;
    }
    ex.location_slugs.forEach((slug, i) => {
      const name = ex.location_names[i] || slug;
      grouped[slug] ||= { name, items: [] };
      grouped[slug].items.push(ex);
    });
  }
  const regionKeys = Object.keys(grouped).sort((a, b) => grouped[a].name.localeCompare(grouped[b].name));

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">Physical Therapy</p>
            <h1 className="text-4xl font-bold text-foreground mb-4">Patient Exercise Library</h1>
            <p className="text-muted-foreground text-lg">
              Structured rehabilitation exercises organized by body region. Select a region below to view exercises.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {regionKeys.map((rk) => (
              <div key={rk} className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <button
                  onClick={() => setOpenRegion(openRegion === rk ? null : rk)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-semibold text-foreground text-lg">{grouped[rk].name}</span>
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${openRegion === rk ? "rotate-90" : ""}`} />
                </button>
                {openRegion === rk && (
                  <div className="border-t border-border px-5 pb-5">
                    <div className="grid gap-4 pt-4">
                      {grouped[rk].items.map((ex) => (
                        <div key={ex.id} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                          <div>
                            <h4 className="font-medium text-foreground">
                              {ex.name}
                              {ex.rehab_phase && (
                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                  · {REHAB_PHASE_LABELS[ex.rehab_phase] || ex.rehab_phase}
                                </span>
                              )}
                            </h4>
                            {ex.description && <p className="text-sm text-muted-foreground">{ex.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && <p className="text-center text-muted-foreground py-8">Loading exercises...</p>}
            {!loading && exercises.length === 0 && (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <Activity className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No active exercises yet. Check back soon.</p>
              </div>
            )}
          </div>

          <div className="text-center mt-10">
            <Link to="/pt-locations" className="text-primary font-medium hover:underline">
              View Physical Therapy Locations →
            </Link>
          </div>
        </div>
      </section>
      <ContactCTA />
    </Layout>
  );
};

export default PTExercises;
