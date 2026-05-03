import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const baseNavLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Services", path: "/services" },
  { label: "Orthopedic Resources", path: "/resources" },
  { label: "Injuries", path: "/injuries" },
  { label: "Physical Therapy", path: "/pt-exercises" },
  { label: "Ultrasound", path: "/ultrasound" },
  { label: "Contact", path: "/contact" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isAdmin } = useAuth();
  const navLinks = isAdmin ? [...baseNavLinks, { label: "Admin", path: "/admin" }] : baseNavLinks;

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-medical flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">BP</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-semibold text-foreground">Brendan Parker</span>
            <span className="text-muted-foreground text-sm ml-1">MD</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <a href="tel:4253395447" className="flex items-center gap-2 text-sm text-primary font-medium">
            <Phone className="w-4 h-4" />
            425-339-5447
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-md text-muted-foreground hover:bg-muted"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-card">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a href="tel:4253395447" className="flex items-center gap-2 px-3 py-2.5 text-sm text-primary font-medium mt-2 border-t border-border pt-4">
              <Phone className="w-4 h-4" />
              425-339-5447
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
