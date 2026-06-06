import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import ContactCTA from "@/components/ContactCTA";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Image as ImageIcon, ChevronRight, Stethoscope, Calendar } from "lucide-react";

const sb = supabase as any;

const REGION_ORDER = ["Knee", "Shoulder", "Hip", "Elbow", "Wrist/Hand", "Foot/Ankle", "Other"];

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
  procedure_steps: string | null;
  procedure_image_url: string | null;
  ultrasound_image_url: string | null;
  diagram_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  featured: boolean;
  accepts_appointments: boolean;
}

interface SharedBlock {
  key: string;
  title: string;
  body: string | null;
}

function ImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10 ${className}`}>
      <Stethoscope className="w-10 h-10 text-primary/30" />
    </div>
  );
}

function useSharedContent() {
  const [blocks, setBlocks] = useState<Record<string, SharedBlock>>({});
  useEffect(() => {
    sb.from("ultrasound_content").select("*").then(({ data }: any) => {
      const m: Record<string, SharedBlock> = {};
      (data || []).forEach((b: SharedBlock) => { m[b.key] = b; });
      setBlocks(m);
    });
  }, []);
  return blocks;
}

function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16 md:py-20">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <p className="uppercase tracking-wide text-sm font-medium opacity-80 mb-3">Ultrasound</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Ultrasound-Guided Injections</h1>
        <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl">
          Real-time image guidance for accurate musculoskeletal injections.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary" className="gap-2">
            <Link to="/contact">Schedule an Evaluation <ArrowRight className="w-4 h-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
            <a href="#guides">View Injection Guides</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function SharedIntro({ blocks }: { blocks: Record<string, SharedBlock> }) {
  const overview = blocks.overview;
  const items: Array<{ key: string; id: string }> = [
    { key: "pre_care", id: "pre-care" },
    { key: "post_care", id: "post-care" },
    { key: "risks", id: "risks" },
    { key: "when_to_call", id: "when-to-call" },
  ];
  return (
    <section className="py-12 bg-muted/30 border-b">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        {overview && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-3">{overview.title}</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{overview.body}</p>
          </div>
        )}
        <Accordion type="multiple" className="bg-card border rounded-lg divide-y">
          {items.map(({ key, id }) => {
            const b = blocks[key];
            if (!b || !b.body) return null;
            return (
              <AccordionItem key={key} value={key} id={id} className="px-4 border-0 scroll-mt-24">
                <AccordionTrigger className="text-left font-semibold">{b.title}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {b.body}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </section>
  );
}

function InjectionCard({ inj }: { inj: Injection }) {
  const img = inj.procedure_image_url || inj.ultrasound_image_url || inj.diagram_image_url;
  return (
    <Card className="overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow border-border">
      {img ? (
        <img src={img} alt={inj.name} className="h-40 w-full object-cover" loading="lazy" />
      ) : (
        <ImagePlaceholder className="h-40 w-full" />
      )}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">{inj.body_region}</Badge>
          {inj.featured && <Badge className="text-xs bg-accent text-accent-foreground">Featured</Badge>}
        </div>
        <h3 className="font-semibold text-lg mb-2">{inj.name}</h3>
        {inj.short_summary && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{inj.short_summary}</p>
        )}
        <div className="mt-auto flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" className="gap-1">
            <Link to={`/ultrasound/${inj.slug}`}>Learn more <ChevronRight className="w-4 h-4" /></Link>
          </Button>
          {inj.accepts_appointments && (
            <Button asChild size="sm" className="gap-1">
              <Link to="/contact"><Calendar className="w-4 h-4" /> Schedule appointment</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function InjectionLibrary() {
  const [items, setItems] = useState<Injection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.from("ultrasound_injections")
      .select("*")
      .eq("status", "published")
      .order("sort_order")
      .order("name")
      .then(({ data }: any) => {
        setItems(data || []);
        setLoading(false);
      });
  }, []);

  const grouped = useMemo(() => {
    const m: Record<string, Injection[]> = {};
    items.forEach((i) => { (m[i.body_region] ||= []).push(i); });
    return m;
  }, [items]);

  const regionsInOrder = useMemo(() => {
    const known = REGION_ORDER.filter((r) => grouped[r]?.length);
    const extras = Object.keys(grouped).filter((r) => !REGION_ORDER.includes(r));
    return [...known, ...extras];
  }, [grouped]);

  return (
    <section id="guides" className="py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-2xl mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Joint-Specific Injection Guides</h2>
          <p className="text-muted-foreground">Explore injection options by body region. Suitability depends on your diagnosis and exam.</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <Card className="p-10 text-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No injections published yet</h3>
            <p className="text-sm text-muted-foreground">Check back soon for more information.</p>
          </Card>
        ) : (
          regionsInOrder.map((r) => (
            <div key={r} className="mb-10">
              <h3 className="text-xl font-semibold mb-4">{r}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {grouped[r].map((i) => <InjectionCard key={i.id} inj={i} />)}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

const Ultrasound = () => {
  const blocks = useSharedContent();
  return (
    <Layout>
      <Hero />
      <SharedIntro blocks={blocks} />
      <InjectionLibrary />
      <ContactCTA />
    </Layout>
  );
};

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
          <Section title="What is this injection?" body={inj.full_explanation} />
          {inj.conditions_treated && (
            <Section title="Indications and conditions treated" body={inj.conditions_treated} />
          )}
          <Section title="Step-by-step procedure" body={inj.procedure_steps} />

          <section className="py-6 border-t">
            <h2 className="text-xl font-semibold text-foreground mb-3">Before and after your injection</h2>
            <p className="text-muted-foreground mb-4">
              Pre- and post-injection instructions are the same across all ultrasound-guided procedures.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/ultrasound#pre-care">Pre-injection instructions</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/ultrasound#post-care">Post-injection care</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/ultrasound#risks">Risks & side effects</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/ultrasound#when-to-call">When to call the clinic</Link>
              </Button>
            </div>
          </section>

          <div className="mt-10 p-5 rounded-lg bg-muted/40 border text-sm text-muted-foreground">
            {DISCLAIMER}
          </div>

          {inj.accepts_appointments && (
            <div className="mt-8 text-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/contact"><Calendar className="w-4 h-4" /> Schedule an Appointment</Link>
              </Button>
            </div>
          )}
          {!inj.accepts_appointments && (
            <p className="text-xs text-muted-foreground mt-6 text-center">
              Suitability for this specific procedure depends on your evaluation.
            </p>
          )}
        </div>
      </article>
      {/* keep unused refs to avoid TS warning on blocks */}
      <span className="hidden">{Object.keys(blocks).length}</span>
    </Layout>
  );
};

