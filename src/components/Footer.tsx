import { Link } from "react-router-dom";
import { Phone, MapPin, Mail } from "lucide-react";

const Footer = () => (
  <footer className="bg-foreground text-primary-foreground">
    <div className="container mx-auto px-4 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-medical flex items-center justify-center">
              <span className="font-bold text-lg text-primary-foreground">BP</span>
            </div>
            <div>
              <span className="font-semibold">Brendan Parker</span>
              <span className="text-primary-foreground/70 text-sm ml-1">MD</span>
            </div>
          </div>
          <p className="text-primary-foreground/70 text-sm leading-relaxed">
            Non-Operative Sports Medicine — evidence-based, patient-centered care to help you return to the activities you love.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Quick Links</h4>
          <nav className="flex flex-col gap-2 text-sm text-primary-foreground/70">
            <Link to="/about" className="hover:text-primary-foreground transition-colors">About</Link>
            <Link to="/services" className="hover:text-primary-foreground transition-colors">Services</Link>
            <Link to="/exercise-library" className="hover:text-primary-foreground transition-colors">Therapy Exercises</Link>
            <Link to="/pt-locations" className="hover:text-primary-foreground transition-colors">PT Locations</Link>
            <Link to="/contact" className="hover:text-primary-foreground transition-colors">Contact</Link>
          </nav>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Contact</h4>
          <div className="flex flex-col gap-3 text-sm text-primary-foreground/70">
            <a href="tel:4253395447" className="flex items-center gap-2 hover:text-primary-foreground transition-colors">
              <Phone className="w-4 h-4" /> 425-339-5447
            </a>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              21401 72nd Ave W, Edmonds, WA 98026
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10 mt-10 pt-6 text-center text-sm text-primary-foreground/50">
        © {new Date().getFullYear()} Brendan Parker, MD. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
