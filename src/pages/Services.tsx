import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import ContactCTA from "@/components/ContactCTA";
import { Compass, Waves, Dumbbell, MapPin, ArrowRight } from "lucide-react";

const services = [
  { icon: Compass, title: "Orthopedic Consultation", description: "Comprehensive musculoskeletal evaluation and non-operative treatment planning for a wide range of conditions.", link: "/resources" },
  { icon: Waves, title: "Ultrasound-Guided Injections", description: "Precise, image-guided injection procedures for targeted pain relief and accelerated healing.", link: "/ultrasound" },
  { icon: Dumbbell, title: "Rehabilitation Programs", description: "Structured exercise programs organized by body region to support your recovery journey.", link: "/pt-exercises" },
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
    <ContactCTA />
  </Layout>
);

export default Services;
