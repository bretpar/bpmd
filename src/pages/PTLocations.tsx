import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import ContactCTA from "@/components/ContactCTA";
import { Search, Phone, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface PTClinic {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  address: string | null;
  region: string | null;
  specialties: string[] | null;
  website?: string | null;
}

const PTLocations = () => {
  const [clinics, setClinics] = useState<PTClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<string>("All");
  const [city, setCity] = useState<string>("All");
  const [specialty, setSpecialty] = useState<string>("All");

  useEffect(() => {
    supabase.from("pt_locations").select("*").order("region").order("name").then(({ data }) => {
      setClinics((data as any) || []);
      setLoading(false);
    });
  }, []);

  const allRegions = useMemo(() => ["All", ...Array.from(new Set(clinics.map((c) => c.region).filter(Boolean) as string[]))], [clinics]);
  const allCities = useMemo(() => {
    const cities = clinics.map((c) => (c.city || "").split(",")[0].trim()).filter(Boolean);
    return ["All", ...Array.from(new Set(cities))];
  }, [clinics]);
  const allSpecialties = useMemo(
    () => ["All", ...Array.from(new Set(clinics.flatMap((c) => c.specialties || []))).sort()],
    [clinics]
  );

  const filtered = clinics.filter((c) => {
    const matchSearch = `${c.name} ${c.city || ""} ${c.address || ""} ${c.region || ""} ${(c.specialties || []).join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchRegion = region === "All" || c.region === region;
    const matchCity = city === "All" || (c.city || "").startsWith(city);
    const matchSpecialty = specialty === "All" || (c.specialties || []).includes(specialty);
    return matchSearch && matchRegion && matchCity && matchSpecialty;
  });

  const groupedRegions = Array.from(new Set(filtered.map((c) => c.region).filter(Boolean) as string[]));
  const hasFilters = search || region !== "All" || city !== "All" || specialty !== "All";

  const clearFilters = () => { setSearch(""); setRegion("All"); setCity("All"); setSpecialty("All"); };

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
              <Input placeholder="Search by clinic name, address, or specialty..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FilterSelect label="Region" value={region} onChange={setRegion} options={allRegions} />
              <FilterSelect label="City" value={city} onChange={setCity} options={allCities} />
              <FilterSelect label="Specialty" value={specialty} onChange={setSpecialty} options={allSpecialties} />
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {clinics.length} clinics</span>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                  <X className="w-3.5 h-3.5 mr-1" />Clear filters
                </Button>
              )}
            </div>
          </div>

          <div className="max-w-4xl mx-auto space-y-10">
            {loading && <p className="text-center text-muted-foreground">Loading clinics...</p>}
            {groupedRegions.map((r) => (
              <div key={r}>
                <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">{r}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {filtered.filter((c) => c.region === r).map((clinic) => (
                    <div key={clinic.id} className="bg-card rounded-xl p-5 shadow-card border border-border hover:shadow-elevated transition-shadow">
                      <h3 className="font-semibold text-foreground text-lg mb-2">{clinic.name}</h3>
                      <div className="flex flex-col gap-1.5 text-sm text-muted-foreground mb-3">
                        {clinic.phone && (
                          <a href={`tel:${clinic.phone.replace(/-/g, "")}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                            <Phone className="w-4 h-4 shrink-0" /> {clinic.phone}
                          </a>
                        )}
                        {(clinic.address || clinic.city) && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{clinic.address}{clinic.address && clinic.city ? ", " : ""}{clinic.city}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(clinic.specialties || []).map((s) => (
                          <Badge key={s} variant="secondary" className="cursor-pointer text-xs" onClick={() => setSpecialty(s)}>{s}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No clinics match your filters.</p>
                <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
              </div>
            )}
          </div>
        </div>
      </section>
      <ContactCTA />
    </Layout>
  );
};

const FilterSelect = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[]; }) => (
  <label className="block">
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </label>
);

export default PTLocations;
