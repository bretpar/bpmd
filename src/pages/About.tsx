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
            Dr. Brendan Parker is a physician specializing in non-operative sports medicine, with a passion for helping patients recover from injuries and return to the activities they value most. As a lifelong athlete who played multiple sports, including collegiate volleyball, and completed two Ironman 140.6 events, Dr. Parker understands the importance of staying active and the frustration that can come with injury. His goal is to help athletes of all levels—from high school and collegiate competitors to weekend warriors—get back to doing what they love.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Originally from Seattle, Dr. Parker studied and trained across several states before returning home to Washington. He attended the University of Toledo College of Medicine in Ohio, then completed his Emergency Medicine residency in Chicago, Illinois. During residency, he volunteered in medical tents at multiple athletic events throughout the city, where he developed a strong foundation in the emergency care of athletes. Wanting to expand his expertise beyond acute injury management, he pursued fellowship training in Non-Operative Sports Medicine at the University of Arizona in Tucson.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Now practicing in Edmonds, Washington, Dr. Parker combines his background in Emergency Medicine and Sports Medicine to provide evidence-based, patient-focused care. He approaches injuries from a non-surgical perspective and works closely with each patient to develop personalized treatment plans. His care incorporates musculoskeletal diagnostics, ultrasound-guided procedures, rehabilitation strategies, and shared decision-making to help patients understand their options and move toward their goals.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-12">
            Dr. Parker lives in Seattle with his wife and three children. As a family, they enjoy exploring the city and attending local sporting events. Although his Ironman racing days are behind him, he still enjoys playing soccer and running along the Burke-Gilman Trail. He brings that same love of movement and active living to the care he provides every patient.
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
