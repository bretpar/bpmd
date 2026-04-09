import { useState } from "react";
import Layout from "@/components/Layout";
import ContactCTA from "@/components/ContactCTA";
import { Search, Phone, MapPin, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PTClinic {
  name: string;
  phone: string;
  city: string;
  address: string;
  region: string;
  website?: string;
  notes?: string;
}

const clinics: PTClinic[] = [
  { name: "Olympic Sport Rehab", phone: "425-650-1900", city: "Mountlake Terrace, WA", address: "6808 220th Street SW, Suite #303", region: "Edmonds" },
  { name: "Pacific Sports Rehab", phone: "425-712-1978", city: "Mountlake Terrace, WA 98043", address: "6912 220th St SW Suite #205", region: "Edmonds" },
  { name: "Olympic Spine & Sports Therapy", phone: "425-368-3297", city: "Mountlake Terrace, WA 98043", address: "6603 220th SW Suite #102", region: "Edmonds" },
  { name: "IRG PT", phone: "425-774-3226", city: "Edmonds, WA 98026", address: "7315 212th St SW Suite 104", region: "Edmonds" },
  { name: "Premier Physical Therapy", phone: "425-745-4910", city: "Mill Creek, WA 98012", address: "16030 Bothell-Everett Hwy Suite #200", region: "Lynnwood & Mill Creek" },
  { name: "Summit Rehabilitation", phone: "425-409-0218", city: "Lynnwood, WA 98037", address: "17525 Hwy 99 Suite C", region: "Lynnwood & Mill Creek" },
  { name: "Impact Physical Therapy", phone: "425-778-2325", city: "Lynnwood, WA 98036", address: "4300 198th St SW", region: "Lynnwood & Mill Creek" },
  { name: "Core Physical Therapy", phone: "206-546-2220", city: "Shoreline, WA 98133", address: "1227 N 205th St", region: "Shoreline" },
  { name: "IRG PT", phone: "206-420-0221", city: "Seattle, WA 98133", address: "13242 Aurora Ave NE Suite #103", region: "Shoreline" },
];

const PTLocations = () => {
  const [search, setSearch] = useState("");
  const filtered = clinics.filter((c) =>
    `${c.name} ${c.city} ${c.address} ${c.region}`.toLowerCase().includes(search.toLowerCase())
  );

  const regions = [...new Set(filtered.map((c) => c.region))];

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">Physical Therapy</p>
            <h1 className="text-4xl font-bold text-foreground mb-4">PT Locations</h1>
            <p className="text-muted-foreground text-lg">Trusted physical therapy clinics near our office.</p>
          </div>

          <div className="max-w-3xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, city, or area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="max-w-3xl mx-auto space-y-10">
            {regions.map((region) => (
              <div key={region}>
                <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">{region}</h2>
                <div className="grid gap-4">
                  {filtered
                    .filter((c) => c.region === region)
                    .map((clinic, i) => (
                      <div key={`${clinic.name}-${i}`} className="bg-card rounded-xl p-5 shadow-card border border-border hover:shadow-elevated transition-shadow">
                        <h3 className="font-semibold text-foreground text-lg mb-2">{clinic.name}</h3>
                        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                          <a href={`tel:${clinic.phone.replace(/-/g, "")}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                            <Phone className="w-4 h-4 shrink-0" /> {clinic.phone}
                          </a>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{clinic.address}, {clinic.city}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No clinics found matching your search.</p>
            )}
          </div>
        </div>
      </section>
      <ContactCTA />
    </Layout>
  );
};

export default PTLocations;
