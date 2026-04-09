import Layout from "@/components/Layout";
import ContactCTA from "@/components/ContactCTA";
import { ExternalLink, Compass, BookOpen } from "lucide-react";

const Resources = () => (
  <Layout>
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">Resources</p>
          <h1 className="text-4xl font-bold text-foreground mb-4">Orthopedic Resources</h1>
          <p className="text-muted-foreground text-lg">
            Curated resources to help you better understand musculoskeletal conditions and treatment options.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <a
            href="https://www.ortho-compass.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-card rounded-xl p-8 shadow-card hover:shadow-elevated transition-all duration-300 border border-border hover:border-primary/20"
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <Compass className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                  Ortho Compass <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </h3>
                <p className="text-muted-foreground">
                  A comprehensive orthopedic resource providing evidence-based information on musculoskeletal conditions, treatment options, and rehabilitation strategies.
                </p>
              </div>
            </div>
          </a>

          <div className="mt-6 bg-card rounded-xl p-8 shadow-card border border-border">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Patient Education</h3>
                <p className="text-muted-foreground">
                  Additional resources and patient education materials are available during your office visit. Don't hesitate to ask about any condition or treatment plan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <ContactCTA />
  </Layout>
);

export default Resources;
