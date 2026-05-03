import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import ContactCTA from "@/components/ContactCTA";
import { Search, Phone, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PTClinic {
  name: string;
  phone: string;
  city: string;
  address: string;
  region: string;
  specialties: string[];
  website?: string;
  notes?: string;
}

const clinics: PTClinic[] = [
  { name: "Olympic Sport Rehab", phone: "425-650-1900", city: "Mountlake Terrace, WA", address: "6808 220th Street SW, Suite #303", region: "Edmonds", specialties: ["Sports", "Orthopedic", "Post-Op"] },
  { name: "Pacific Sports Rehab", phone: "425-712-1978", city: "Mountlake Terrace, WA 98043", address: "6912 220th St SW Suite #205", region: "Edmonds", specialties: ["Sports", "Manual Therapy"] },
  { name: "Olympic Spine & Sports Therapy", phone: "425-368-3297", city: "Mountlake Terrace, WA 98043", address: "6603 220th SW Suite #102", region: "Edmonds", specialties: ["Spine", "Sports", "Dry Needling"] },
  { name: "IRG PT", phone: "425-774-3226", city: "Edmonds, WA 98026", address: "7315 212th St SW Suite 104", region: "Edmonds", specialties: ["Orthopedic", "Post-Op", "Vestibular"] },
  { name: "Premier Physical Therapy", phone: "425-745-4910", city: "Mill Creek, WA 98012", address: "16030 Bothell-Everett Hwy Suite #200", region: "Lynnwood & Mill Creek", specialties: ["Orthopedic", "Manual Therapy"] },
  { name: "Summit Rehabilitation", phone: "425-409-0218", city: "Lynnwood, WA 98037", address: "17525 Hwy 99 Suite C", region: "Lynnwood & Mill Creek", specialties: ["Orthopedic", "Post-Op", "Sports"] },
  { name: "Impact Physical Therapy", phone: "425-778-2325", city: "Lynnwood, WA 98036", address: "4300 198th St SW", region: "Lynnwood & Mill Creek", specialties: ["Sports", "Manual Therapy", "Dry Needling"] },
  { name: "Core Physical Therapy", phone: "206-546-2220", city: "Shoreline, WA 98133", address: "1227 N 205th St", region: "Shoreline", specialties: ["Orthopedic", "Spine"] },
  { name: "IRG PT", phone: "206-420-0221", city: "Seattle, WA 98133", address: "13242 Aurora Ave NE Suite #103", region: "Shoreline", specialties: ["Orthopedic", "Vestibular", "Post-Op"] },
];

const PTLocations = () => {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<string>("All");
  const [city, setCity] = useState<string>("All");
  const [specialty, setSpecialty] = useState<string>("All");

  const allRegions = useMemo(() => ["All", ...Array.from(new Set(clinics.map((c) => c.region)))], []);
  const allCities = useMemo(() => {
    const cities = clinics.map((c) => c.city.split(",")[0].trim());
    return ["All", ...Array.from(new Set(cities))];
  }, []);
  const allSpecialties = useMemo(
    () => ["All", ...Array.from(new Set(clinics.flatMap((c) => c.specialties))).sort()],
    []
  );

  const filtered = clinics.filter((c) => {
    const matchSearch = `${c.name} ${c.city} ${c.address} ${c.region} ${c.specialties.join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchRegion = region === "All" || c.region === region;
    const matchCity = city === "All" || c.city.startsWith(city);
    const matchSpecialty = specialty === "All" || c.specialties.includes(specialty);
    return matchSearch && matchRegion && matchCity && matchSpecialty;
  });

  const groupedRegions = Array.from(new Set(filtered.map((c) => c.region)));
  const hasFilters = search || region !== "All" || city !== "All" || specialty !== "All";

  const clearFilters = () => {
    setSearch("");
    setRegion("All");
    setCity("All");
    setSpecialty("All");
  };

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">Physical Therapy</p>
            <h1 className="text-4xl font-bold text-foreground mb-4">Find a PT Clinic</h1>
            <p className="text-muted-foreground text-lg">
              Search trusted physical therapy clinics near our office. Filter by city, region, or specialty.
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by clinic name, address, or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FilterSelect label="Region" value={region} onChange={setRegion} options={allRegions} />
              <FilterSelect label="City" value={city} onChange={setCity} options={allCities} />
              <FilterSelect label="Specialty" value={specialty} onChange={setSpecialty} options={allSpecialties} />
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {clinics.length} clinics
              </span>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                  <X className="w-3.5 h-3.5 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          <div className="max-w-4xl mx-auto space-y-10">
            {groupedRegions.map((r) => (
              <div key={r}>
                <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">{r}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {filtered
                    .filter((c) => c.region === r)
                    .map((clinic, i) => (
                      <div
                        key={`${clinic.name}-${i}`}
                        className="bg-card rounded-xl p-5 shadow-card border border-border hover:shadow-elevated transition-shadow"
                      >
                        <h3 className="font-semibold text-foreground text-lg mb-2">{clinic.name}</h3>
                        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground mb-3">
                          <a
                            href={`tel:${clinic.phone.replace(/-/g, "")}`}
                            className="flex items-center gap-2 hover:text-primary transition-colors"
                          >
                            <Phone className="w-4 h-4 shrink-0" /> {clinic.phone}
                          </a>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                              {clinic.address}, {clinic.city}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {clinic.specialties.map((s) => (
                            <Badge
                              key={s}
                              variant="secondary"
                              className="cursor-pointer text-xs"
                              onClick={() => setSpecialty(s)}
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No clinics match your filters.</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
      <ContactCTA />
    </Layout>
  );
};

const FilterSelect = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) => (
  <label className="block">
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </label>
);

export default PTLocations;
