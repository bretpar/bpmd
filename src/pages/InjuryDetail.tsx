import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import ContactCTA from "@/components/ContactCTA";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

const Section = ({ title, body }: { title: string; body?: string }) => {
  if (!body?.trim()) return null;
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
      <div className="text-muted-foreground whitespace-pre-line leading-relaxed">{body}</div>
    </div>
  );
};

const InjuryDetail = () => {
  const { slug } = useParams();
  const [injury, setInjury] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: inj } = await supabase.from("injuries").select("*").eq("slug", slug).eq("published", true).maybeSingle();
      setInjury(inj);
      if (inj) {
        const { data: links } = await supabase.from("injury_exercises").select("sort_order, exercises(*)").eq("injury_id", inj.id).order("sort_order");
        setExercises((links || []).map((l: any) => l.exercises).filter(Boolean));
        const { data: locs } = await supabase.from("pt_locations").select("*").order("name").limit(6);
        setLocations(locs || []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <Layout><div className="container mx-auto py-24 text-center text-muted-foreground">Loading...</div></Layout>;
  if (!injury) return (
    <Layout>
      <div className="container mx-auto py-24 text-center">
        <h1 className="text-2xl font-bold mb-2">Not Found</h1>
        <Link to="/injuries" className="text-primary hover:underline">← Back to injuries</Link>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <article className="py-12 md:py-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <Link to="/injuries" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="w-4 h-4" /> All injuries
          </Link>

          {injury.body_region && <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">{injury.body_region}</p>}
          <h1 className="text-4xl font-bold text-foreground mb-4">{injury.name}</h1>
          {injury.summary && <p className="text-lg text-muted-foreground mb-8">{injury.summary}</p>}
          {injury.cover_image_url && <img src={injury.cover_image_url} alt={injury.name} className="w-full rounded-xl mb-8" />}

          <div className="space-y-8">
            <Section title="Overview" body={injury.overview} />
            <Section title="Symptoms" body={injury.symptoms} />
            <Section title="Causes" body={injury.causes} />
            <Section title="When to See a Doctor" body={injury.when_to_see_doctor} />
            <Section title="Treatment" body={injury.treatment_overview} />

            {exercises.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Recommended Exercises</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {exercises.map((e) => (
                    <div key={e.id} className="bg-card border border-border rounded-lg p-4">
                      <h3 className="font-medium text-foreground">{e.name}</h3>
                      {e.description && <p className="text-sm text-muted-foreground mt-1">{e.description}</p>}
                      {e.difficulty && <span className="inline-block mt-2 text-xs bg-secondary px-2 py-0.5 rounded">{e.difficulty}</span>}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">These exercises are educational. Consult your provider before starting.</p>
              </div>
            )}

            {locations.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Find Physical Therapy Nearby</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {locations.map((l) => (
                    <div key={l.id} className="bg-card border border-border rounded-lg p-4">
                      <h3 className="font-medium">{l.name}</h3>
                      <p className="text-sm text-muted-foreground">{l.city}</p>
                      {l.phone && <a href={`tel:${l.phone.replace(/-/g, "")}`} className="text-sm text-primary">{l.phone}</a>}
                    </div>
                  ))}
                </div>
                <Link to="/pt-locations" className="text-primary text-sm font-medium hover:underline mt-3 inline-block">View all clinics →</Link>
              </div>
            )}
          </div>
        </div>
      </article>
      <ContactCTA />
    </Layout>
  );
};

export default InjuryDetail;
