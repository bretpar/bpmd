import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const ContactCTA = () => (
  <section className="bg-gradient-medical py-16">
    <div className="container mx-auto px-4 lg:px-8 text-center">
      <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">Let's Get in Touch</h2>
      <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">
        Need medical advice or a second opinion? I'm here to help you.
      </p>
      <Link to="/contact">
        <Button size="lg" variant="secondary" className="gap-2">
          Contact Me <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  </section>
);

export default ContactCTA;
