import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, MapPin, Mail, CheckCircle, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [copied, setCopied] = useState(false);
  const fullAddress = "21401 72nd Ave W, Edmonds, WA 98026";

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      toast({ title: "Address copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy address", variant: "destructive" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: "Message sent!", description: "We'll get back to you as soon as possible." });
  };

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">Get in Touch</p>
            <h1 className="text-4xl font-bold text-foreground mb-4">Contact</h1>
            <p className="text-muted-foreground text-lg">
              Specializing in Non-Operative Sports Medicine
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Info */}
            <div className="space-y-6">
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <h3 className="font-semibold text-foreground mb-4">Office Information</h3>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <a href="tel:4253395447" className="flex items-center gap-3 hover:text-primary transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Phone</p>
                      <p>425-339-5447</p>
                    </div>
                  </a>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                  <div className="flex-1">
                      <p className="font-medium text-foreground">Address</p>
                      <p>21401 72nd Ave W<br />Edmonds, WA 98026</p>
                    </div>
                    <button
                      onClick={copyAddress}
                      className="shrink-0 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      aria-label="Copy address to clipboard"
                      title="Copy address"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl overflow-hidden shadow-card border border-border">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=21401+72nd+Ave+W+Edmonds+WA+98026"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open clinic location in Google Maps"
                >
                  <iframe
                    title="Clinic Location — 21401 72nd Ave W, Edmonds, WA 98026"
                    src="https://www.google.com/maps?q=21401+72nd+Ave+W,+Edmonds,+WA+98026&output=embed"
                    width="100%"
                    height="220"
                    style={{ border: 0, pointerEvents: "none" }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </a>
              </div>
            </div>

            {/* Form */}
            <div className="bg-card rounded-xl p-6 shadow-card border border-border">
              {submitted ? (
                <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                  <CheckCircle className="w-14 h-14 text-primary mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Thank You!</h3>
                  <p className="text-muted-foreground">Your message has been sent. We'll get back to you shortly.</p>
                  <Button variant="outline" className="mt-6" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", message: "" }); }}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="font-semibold text-foreground mb-4">Send a Message</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Name</label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
                      <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help you?" rows={5} />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-medical text-primary-foreground hover:opacity-90">
                      Send Message
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
