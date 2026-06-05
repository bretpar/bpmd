import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import ContactCTA from "@/components/ContactCTA";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  Activity,
  Eye,
  Heart,
  Image as ImageIcon,
  ChevronRight,
  Stethoscope,
} from "lucide-react";

const sb = supabase as any;

const REGIONS = ["Shoulder", "Elbow", "Wrist/Hand", "Hip", "Knee", "Foot/Ankle", "Other"];

const DEFAULT_POST_CARE = `• Keep the area clean and dry for the rest of the day.
• Avoid heavy activity involving the injected area for 24–48 hours unless instructed otherwise.
• Mild soreness can occur for 1–2 days.
• Ice may be used as directed.
• Avoid soaking in a bath, pool, or hot tub for 24 hours.
• Contact the clinic for fever, spreading redness, drainage, severe worsening pain, or new weakness/numbness.`;

const DISCLAIMER =
  "This information is for general education only and does not replace medical advice. The appropriate treatment depends on your diagnosis, exam, imaging, and medical history.";

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
  status: string;
  featured: boolean;
  accepts_appointments: boolean;
}

function ImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10 ${className}`}>
      <Stethoscope className="w-10 h-10 text-primary/30" />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16 md:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl">
          <p className="uppercase tracking-wide text-sm font-medium opacity-80 mb-3">Ultrasound</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Ultrasound-Guided Procedures</h1>
          <p className="text-lg md:text-xl opacity-90 mb-4">
            Real-time image guidance for accurate musculoskeletal injections.
          </p>
          <p className="opacity-80 mb-8 max-w-2xl">
            Ultrasound lets us see joints, tendons, bursae, soft tissues, nerves, vessels, and the needle itself in real time — so injections can be placed precisely where they're intended.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link to="/contact">Schedule an Evaluation <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
              <a href="#injections">View Injection Options</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyUltrasound() {
  const items = [
    { icon: Activity, title: "More accurate placement", body: "Real-time imaging helps direct the needle to the targeted structure rather than relying on landmarks alone." },
    { icon: Eye, title: "Real-time visualization", body: "We can see soft tissues, joint spaces, and nearby nerves and vessels during the procedure." },
    { icon: Heart, title: "Patient-centered care", body: "Each plan is tailored to your diagnosis, exam, imaging, and goals — with time to answer your questions." },
  ];
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-3">Why ultrasound guidance?</h2>
          <p className="text-muted-foreground">A practical, image-guided approach to musculoskeletal injections.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((it) => (
            <Card key={it.title} className="p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <it.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{it.title}</h3>
              <p className="text-sm text-muted-foreground">{it.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function InjectionCard({ inj }: { inj: Injection }) {
  const img = inj.procedure_image_url || inj.ultrasound_image_url || inj.diagram_image_url;
  return (
    <Link to={`/ultrasound/${inj.slug}`} className="group">
      <Card className="overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow border-border">
        {img ? (
          <img src={img} alt={inj.name} className="h-44 w-full object-cover" loading="lazy" />
        ) : (
          <ImagePlaceholder className="h-44 w-full" />
        )}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">{inj.body_region}</Badge>
            {inj.featured && <Badge className="text-xs bg-accent text-accent-foreground">Featured</Badge>}
          </div>
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{inj.name}</h3>
          {inj.short_summary && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{inj.short_summary}</p>
          )}
          {inj.conditions_treated && (
            <p className="text-xs text-muted-foreground mb-4"><span className="font-medium text-foreground">Treats: </span>{inj.conditions_treated}</p>
          )}
          <div className="mt-auto inline-flex items-center text-primary font-medium text-sm">
            Learn More <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

function InjectionLibrary() {
  const [items, setItems] = useState<Injection[]>([]);
  const [region, setRegion] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.from("ultrasound_injections")
      .select("*")
      .eq("status", "published")
      .order("featured", { ascending: false })
      .order("sort_order")
      .order("name")
      .then(({ data }: any) => {
        setItems(data || []);
        setLoading(false);
      });
  }, []);

  const availableRegions = useMemo(
    () => REGIONS.filter((r) => items.some((i) => i.body_region === r)),
    [items],
  );

  const visible = useMemo(
    () => (region === "all" ? items : items.filter((i) => i.body_region === region)),
    [items, region],
  );

  const featured = visible.filter((i) => i.featured);
  const byRegion = useMemo(() => {
    const m: Record<string, Injection[]> = {};
    visible.filter((i) => !i.featured).forEach((i) => {
      (m[i.body_region] ||= []).push(i);
    });
    return m;
  }, [visible]);

  return (
    <section id="injections" className="py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-2xl mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Injection options</h2>
          <p className="text-muted-foreground">Explore the procedures offered. Suitability depends on your diagnosis and exam.</p>
        </div>

        {availableRegions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Button size="sm" variant={region === "all" ? "default" : "outline"} onClick={() => setRegion("all")}>
              All
            </Button>
            {availableRegions.map((r) => (
              <Button key={r} size="sm" variant={region === r ? "default" : "outline"} onClick={() => setRegion(r)}>
                {r}
              </Button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <Card className="p-10 text-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No injections published yet</h3>
            <p className="text-sm text-muted-foreground">Check back soon for more information.</p>
          </Card>
        ) : (
          <>
            {featured.length > 0 && (
              <div className="mb-12">
                <h3 className="text-sm uppercase tracking-wide text-muted-foreground mb-4">Featured</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featured.map((i) => <InjectionCard key={i.id} inj={i} />)}
                </div>
              </div>
            )}
            {Object.keys(byRegion).map((r) => (
              <div key={r} className="mb-10">
                <h3 className="text-xl font-semibold mb-4">{r}</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {byRegion[r].map((i) => <InjectionCard key={i.id} inj={i} />)}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}

const Ultrasound = () => (
  <Layout>
    <Hero />
    <WhyUltrasound />
    <InjectionLibrary />
    <ContactCTA />
  </Layout>
);

export default Ultrasound;

/* ============ Detail page ============ */

function Section({ title, body }: { title: string; body: string | null }) {
  if (!body) return null;
  return (
    <section className="py-6 border-t">
      <h2 className="text-xl font-semibold text-foreground mb-3">{title}</h2>
      <div className="text-muted-foreground whitespace-pre-line leading-relaxed">{body}</div>
    </section>
  );
}

export const UltrasoundDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [inj, setInj] = useState<Injection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    sb.from("ultrasound_injections")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data }: any) => {
        setInj(data);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (!inj) return;
    document.title = inj.seo_title || `${inj.name} | Ultrasound-Guided Procedures`;
    const meta =
      document.querySelector('meta[name="description"]') ||
      (() => {
        const m = document.createElement("meta");
        m.setAttribute("name", "description");
        document.head.appendChild(m);
        return m;
      })();
    meta.setAttribute("content", inj.seo_description || inj.short_summary || "Ultrasound-guided injection information.");
  }, [inj]);

  if (loading) {
    return <Layout><div className="container mx-auto py-24 text-center text-muted-foreground">Loading…</div></Layout>;
  }
  if (!inj) {
    return (
      <Layout>
        <div className="container mx-auto py-24 max-w-lg text-center">
          <h1 className="text-2xl font-bold mb-2">Injection not found</h1>
          <p className="text-muted-foreground mb-6">This procedure may not be published.</p>
          <Button asChild><Link to="/ultrasound">Back to procedures</Link></Button>
        </div>
      </Layout>
    );
  }

  const heroImg = inj.procedure_image_url || inj.ultrasound_image_url || inj.diagram_image_url;
  const postCare = (inj.post_care && inj.post_care.trim()) || DEFAULT_POST_CARE;

  return (
    <Layout>
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-12 md:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <Link to="/ultrasound" className="text-sm opacity-80 hover:opacity-100 inline-flex items-center mb-4">
            ← Back to procedures
          </Link>
          <div className="grid md:grid-cols-[1fr,320px] gap-8 items-start">
            <div>
              <Badge variant="secondary" className="mb-3">{inj.body_region}</Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{inj.name}</h1>
              {inj.short_summary && <p className="text-lg opacity-90">{inj.short_summary}</p>}
            </div>
            <div className="rounded-xl overflow-hidden bg-primary-foreground/10 aspect-[4/3] md:w-80">
              {heroImg ? (
                <img src={heroImg} alt={inj.name} className="w-full h-full object-cover" />
              ) : (
                <ImagePlaceholder className="w-full h-full" />
              )}
            </div>
          </div>
        </div>
      </section>

      <article className="py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          {inj.conditions_treated && (
            <div className="bg-muted/40 border rounded-lg p-4 mb-6">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Conditions treated</div>
              <div className="text-foreground">{inj.conditions_treated}</div>
            </div>
          )}

          <Section title="What is this injection?" body={inj.full_explanation} />
          <Section title="Why ultrasound is used" body={inj.why_ultrasound} />
          <Section title="What to expect step by step" body={inj.procedure_steps} />
          <Section title="Common medications used" body={inj.medications} />
          <Section title="Risks and side effects" body={inj.risks} />
          <Section title="Post-injection care" body={postCare} />
          <Section title="When to call the clinic" body={inj.when_to_call} />

          {(inj.ultrasound_image_url || inj.diagram_image_url) && (
            <section className="py-6 border-t">
              <h2 className="text-xl font-semibold text-foreground mb-3">Imaging</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {inj.ultrasound_image_url && (
                  <figure>
                    <img src={inj.ultrasound_image_url} alt={`${inj.name} ultrasound view`} className="rounded-lg border w-full" />
                    <figcaption className="text-xs text-muted-foreground mt-1">Ultrasound view</figcaption>
                  </figure>
                )}
                {inj.diagram_image_url && (
                  <figure>
                    <img src={inj.diagram_image_url} alt={`${inj.name} diagram`} className="rounded-lg border w-full" />
                    <figcaption className="text-xs text-muted-foreground mt-1">Diagram</figcaption>
                  </figure>
                )}
              </div>
            </section>
          )}

          <div className="mt-10 p-5 rounded-lg bg-muted/40 border text-sm text-muted-foreground">
            {DISCLAIMER}
          </div>

          <div className="mt-8 text-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/contact">Schedule an Evaluation <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            {!inj.accepts_appointments && (
              <p className="text-xs text-muted-foreground mt-3">
                Suitability for this specific procedure depends on your evaluation.
              </p>
            )}
          </div>
        </div>
      </article>
    </Layout>
  );
};
