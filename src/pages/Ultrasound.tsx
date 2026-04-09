import Layout from "@/components/Layout";
import ContactCTA from "@/components/ContactCTA";
import { Construction, Waves } from "lucide-react";

const Ultrasound = () => (
  <Layout>
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">Ultrasound</p>
          <h1 className="text-4xl font-bold text-foreground mb-6">Ultrasound-Guided Injections</h1>

          <div className="bg-card rounded-xl p-10 shadow-card border border-border">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5">
              <Construction className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-3">Under Construction</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              This section is currently being updated with detailed information about ultrasound-guided injection procedures. Please check back soon or contact us for more information.
            </p>
          </div>
        </div>
      </div>
    </section>
    <ContactCTA />
  </Layout>
);

export default Ultrasound;
