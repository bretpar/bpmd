import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, ArrowRight, Compass, Waves, Dumbbell, MapPin } from "lucide-react";
import Layout from "@/components/Layout";
import ContactCTA from "@/components/ContactCTA";
import heroBg from "@/assets/hero-bg.jpg";

const interestCards = [
  { title: "Ortho Compass", description: "Orthopedic resource hub for evidence-based information", icon: Compass, link: "/resources" },
  { title: "Ultrasound Injections", description: "Guided injection procedures for precision treatment", icon: Waves, link: "/ultrasound" },
  { title: "Home Exercises", description: "Structured rehabilitation exercises by body region", icon: Dumbbell, link: "/pt-exercises" },
  { title: "PT Locations", description: "Find trusted physical therapy clinics nearby", icon: MapPin, link: "/pt-locations" },
];

const Home = () => (
  <Layout>
    {/* Hero */}
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="Modern sports medicine clinic" className="w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
      </div>
      <div className="relative container mx-auto px-4 lg:px-8 py-24 md:py-36">
        <div className="max-w-2xl">
          <p className="text-accent font-medium mb-2 tracking-wide uppercase text-sm">Non-Operative Sports Medicine</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-5 leading-tight">
            Patient-Centered Care
          </h1>
          <p className="text-primary-foreground/80 text-lg md:text-xl leading-relaxed mb-8 max-w-xl">
            Integrating evidence-based healthcare into patient-focused treatments, helping you return to the activities you love.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/contact">
              <Button size="lg" className="bg-gradient-medical hover:opacity-90 gap-2 text-primary-foreground">
                Schedule a Visit <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="tel:4253395447">
              <Button size="lg" variant="outline" className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Phone className="w-4 h-4" /> 425-339-5447
              </Button>
            </a>
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
