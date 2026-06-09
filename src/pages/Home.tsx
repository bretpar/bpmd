import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass, Waves, Dumbbell, MapPin, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import ContactCTA from "@/components/ContactCTA";
import heroTrack from "@/assets/hero-track.jpg";

const interestCards = [
  { title: "Ultrasound Injections", description: "Guided injection procedures for precision treatment", icon: Waves, link: "/ultrasound" },
  { title: "Therapy Exercises", description: "Patient-friendly exercises organized by joint and condition", icon: Dumbbell, link: "/exercise-library" },
  { title: "Ortho Compass", description: "Orthopedic resource hub for evidence-based information", icon: Compass, link: "/services" },
  { title: "PT Locations", description: "Find trusted physical therapy clinics nearby", icon: MapPin, link: "/pt-locations" },
];

const Home = () => (
  <Layout>
    {/* Hero */}
    <section className="relative overflow-hidden min-h-[78vh] md:min-h-[85vh] flex items-center">
      <div className="absolute inset-0">
        <img
          src={heroTrack}
          alt="Modern running track lanes representing active sports medicine care"
          className="w-full h-full object-cover object-center"
          width={1920}
          height={1080}
        />
        {/* Layered overlays for strong text contrast, weighted to the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(213,75%,10%)]/95 via-[hsl(213,72%,14%)]/85 sm:via-[hsl(213,72%,14%)]/75 to-[hsl(213,72%,18%)]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(213,75%,8%)]/70 via-transparent to-[hsl(213,75%,8%)]/30" />
      </div>
      <div className="relative container mx-auto px-4 lg:px-8 py-20 md:py-28">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-[hsl(199,89%,55%)]/15 border border-[hsl(199,89%,65%)]/40 text-[hsl(199,95%,80%)] font-semibold tracking-[0.15em] uppercase text-xs backdrop-blur-sm">
            Non-Operative Sports Medicine
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-[1.1] [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]">
            Get Back to What You Love
          </h1>
          <p className="text-white/90 text-lg md:text-xl leading-relaxed mb-8 max-w-xl [text-shadow:0_1px_12px_rgba(0,0,0,0.4)]">
            Evidence-based, non-surgical care for sports injuries, joint pain, and active lifestyles — tailored to your goals.
          </p>

          {/* Credibility line */}
          <div className="flex items-start gap-2 mb-8 text-white/85 text-sm max-w-lg">
            <ShieldCheck className="w-4 h-4 mt-0.5 text-[hsl(199,95%,75%)] flex-shrink-0" />
            <span>Board-certified sports medicine physician focused on keeping patients active without surgery.</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link to="/contact" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-[hsl(213,75%,18%)] hover:bg-white hover:shadow-[0_12px_40px_-8px_rgba(255,255,255,0.5)] hover:-translate-y-0.5 active:translate-y-0 gap-2 rounded-full px-8 py-6 text-base font-semibold shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] transition-all duration-200"
              >
                Schedule an Appointment <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/services" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto gap-2 rounded-full px-8 py-6 text-base font-semibold border-2 border-white/70 text-white bg-[hsl(213,75%,12%)]/70 hover:bg-[hsl(213,75%,18%)]/85 hover:border-white hover:-translate-y-0.5 active:translate-y-0 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] transition-all duration-200"
              >
                Learn About Care Options
              </Button>
            </Link>
          </div>
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
