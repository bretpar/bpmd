import Layout from "@/components/Layout";
import ContactCTA from "@/components/ContactCTA";
import { GraduationCap, Stethoscope, Heart, Award } from "lucide-react";

const highlights = [
  { icon: Stethoscope, title: "Sports Medicine", text: "Specializing in non-operative management of musculoskeletal conditions." },
  { icon: GraduationCap, title: "Evidence-Based", text: "Treatment strategies rooted in the latest medical research and guidelines." },
  { icon: Heart, title: "Patient-Centered", text: "Collaborative approach focused on returning you to your cherished activities." },
  { icon: Award, title: "Comprehensive Care", text: "From diagnosis to rehabilitation, providing holistic treatment pathways." },
];

const About = () => (
  <Layout>
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">About</p>
          <h1 className="text-4xl font-bold text-foreground mb-6">Brendan Parker, MD</h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            Dr. Brendan Parker is a physician specializing in non-operative sports medicine, dedicated to integrating evidence-based healthcare into patient-focused treatments.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            With a philosophy centered on viewing conditions from a non-surgical perspective, Dr. Parker strives to provide treatment choices that empower patients. His goal is to discuss strategies that enable patients to return to the activities they value most.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-12">
            Located in Edmonds, Washington, Dr. Parker works closely with patients to develop personalized treatment plans, leveraging the latest in musculoskeletal diagnostics, ultrasound-guided procedures, and rehabilitation protocols.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {highlights.map((h) => (
            <div key={h.title} className="bg-card rounded-xl p-6 shadow-card border border-border text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <h.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{h.title}</h3>
              <p className="text-sm text-muted-foreground">{h.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
    <ContactCTA />
  </Layout>
);

export default About;
