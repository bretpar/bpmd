import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass, Waves, Dumbbell, MapPin, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import ContactCTA from "@/components/ContactCTA";
import heroNew from "@/assets/hero-new.jpg";

const interestCards = [
  { title: "Ortho Compass", description: "Orthopedic resource hub for evidence-based information", icon: Compass, link: "/resources" },
  { title: "Ultrasound Injections", description: "Guided injection procedures for precision treatment", icon: Waves, link: "/ultrasound" },
  { title: "Exercise Library", description: "Patient-friendly exercises by diagnosis, body region, and joint health", icon: Dumbbell, link: "/exercise-library" },
  { title: "PT Locations", description: "Find trusted physical therapy clinics nearby", icon: MapPin, link: "/pt-locations" },
];

const Home = () => (
  <Layout>
    {/* Hero */}
    <section className="relative overflow-hidden min-h-[70vh] md:min-h-[80vh] flex items-center">
      <div className="absolute inset-0">
        <img
          src={heroNew}
          alt="Sports medicine physician evaluating a patient"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-1 bg-gradient-to-r from-[hsl(213,72%,18%)]/92 via-[hsl(213,72%,22%)]/75 to-transparent" />
        <div className="absolute inset-1 bg-gradient-to-t from-[hsl(213,72%,18%)]/50 via-transparent to-transparent" />
      </div>
      <div className="relative container mx-auto px-4 lg:px-8 py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="text-[hsl(199,89%,65%)] font-semibold mb-3 tracking-wider uppercase text-sm">
            Non-Operative Sports Medicine
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-[1.1]">
            Get Back to What You Love
          </h1>
          <p className="text-white/80 text-lg md:text-xl leading-relaxed mb-8 max-w-xl">
            Evidence-based, non-surgical care for sports injuries, joint pain, and active lifestyles — tailored to your goals.
          </p>

          {/* Credibility line */}
          <div className="flex items-center gap-2 mb-8 text-white/70 text-sm">
            <ShieldCheck className="w-4 h-4 text-[hsl(199,89%,65%)]" />
            <span>Board-certified sports medicine physician focused on keeping patients active without surgery.</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/contact">
              <Button
                size="lg"
                className="bg-white text-[hsl(213,72%,28%)] hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] gap-2 rounded-full px-8 py-6 text-base font-semibold shadow-[0_8px_30px_-8px_rgba(255,255,255,0.25)] transition-all duration-200"
              >
                Schedule an Appointment <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/services">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 rounded-full px-8 py-6 text-base font-semibold border-white/30 text-white bg-white/5 backdrop-blur-sm hover:bg-white/15 hover:border-white/40 transition-all duration-200"
              >
                Learn About Care Options
              </Button>
            </Link>
          </p>
        </div>
      </div>
    </section>

    {/* Interest Cards */}
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Explore My Specialties</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Viewing conditions from a non-surgical perspective, I strive to provide treatment choices for as many patients as possible.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {interestCards.map((card) => (
            <Link
              key={card.title}
              to={card.link}
              className="group bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 border border-border hover:border-primary/20"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <card.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>

    {/* About Preview */}
    <section className="py-16 bg-card border-y border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Evidence-Based Care Tailored for You</h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            By integrating evidence-based healthcare into patient-focused treatments, we work together to return you back to your cherished activities. Viewing conditions from a non-surgical perspective, I strive to provide choices for treatment.
          </p>
          <Link to="/about">
            <Button variant="outline" className="gap-2">
              More About Me <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>

    <ContactCTA />
  </Layout>
);

export default Home;
