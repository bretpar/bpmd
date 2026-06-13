import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import ContactCTA from "@/components/ContactCTA";
import { Compass, Waves, Dumbbell, MapPin, ArrowRight, ExternalLink, BookOpen } from "lucide-react";

const services = [
  { icon: Compass, title: "Orthopedic Consultation", description: "Comprehensive musculoskeletal evaluation and non-operative treatment planning for a wide range of conditions.", link: "/contact" },
  { icon: Waves, title: "Ultrasound-Guided Injections", description: "Precise, image-guided injection procedures for targeted pain relief and accelerated healing.", link: "/ultrasound" },
  { icon: Dumbbell, title: "Patient Exercises", description: "Structured exercise programs organized by body region to support your recovery journey.", link: "/exercise-library" },
  { icon: MapPin, title: "Physical Therapy Referrals", description: "Trusted network of physical therapy clinics near our office for hands-on rehabilitation.", link: "/pt-locations" },
];

const Services = () => (
  <Layout>
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">Services</p>
          <h1 className="text-4xl font-bold text-foreground mb-4">What We Offer</h1>
          <p className="text-muted-foreground text-lg">
            A comprehensive approach to non-operative sports medicine, from diagnosis through rehabilitation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {services.map((s) => (
            <Link
              key={s.title}
              to={s.link}
              className="group bg-card rounded-xl p-8 shadow-card hover:shadow-elevated transition-all duration-300 border border-border hover:border-primary/20"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <s.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-muted-foreground mb-4">{s.description}</p>
              <span className="inline-flex items-center text-sm text-primary font-medium gap-1 group-hover:gap-2 transition-all">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>

    <section className="py-16 md:py-20 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">Resources</p>
          <h2 className="text-3xl font-bold text-foreground mb-4">Orthopedic Resources</h2>
          <p className="text-muted-foreground text-lg">
            Curated resources to help you better understand musculoskeletal conditions and treatment options.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
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

          <div className="bg-card rounded-xl p-8 shadow-card border border-border">
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

export default Services;
