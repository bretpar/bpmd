import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import ContactCTA from "@/components/ContactCTA";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const REGION_LABELS: Record<string, string> = {
  neck: "Neck",
  shoulder: "Shoulder",
  elbow: "Elbow",
  "wrist-hand": "Wrist / Hand",
  hip: "Hip",
  knee: "Knee",
  "ankle-foot": "Ankle / Foot",
};
const ORDER = ["neck", "shoulder", "elbow", "wrist-hand", "hip", "knee", "ankle-foot"];

const PTExercises = () => {
  const [exercises, setExercises] = useState<any[]>([]);
  const [openRegion, setOpenRegion] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("exercises").select("*").eq("published", true).order("name").then(({ data }) => setExercises(data || []));
  }, []);

  const grouped = exercises.reduce((acc: Record<string, any[]>, e) => {
    const key = e.body_region || "other";
    (acc[key] ||= []).push(e);
    return acc;
  }, {});
  const regionKeys = [...ORDER.filter((k) => grouped[k]), ...Object.keys(grouped).filter((k) => !ORDER.includes(k))];

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">Physical Therapy</p>
            <h1 className="text-4xl font-bold text-foreground mb-4">Home Exercises</h1>
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
                  <span className="font-semibold text-foreground text-lg">{REGION_LABELS[rk] || rk}</span>
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${openRegion === rk ? "rotate-90" : ""}`} />
                </button>
                {openRegion === rk && (
                  <div className="border-t border-border px-5 pb-5">
                    <div className="grid gap-4 pt-4">
                      {grouped[rk].map((ex) => (
                        <div key={ex.id} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                          <div>
                            <h4 className="font-medium text-foreground">{ex.name}</h4>
                            {ex.description && <p className="text-sm text-muted-foreground">{ex.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {exercises.length === 0 && <p className="text-center text-muted-foreground py-8">Loading exercises...</p>}
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
