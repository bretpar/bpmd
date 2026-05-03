import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Injuries = () => {
  const [injuries, setInjuries] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All");

  useEffect(() => {
    supabase.from("injuries").select("*").eq("published", true).order("name").then(({ data }) => setInjuries(data || []));
  }, []);

  const regions = useMemo(() => ["All", ...Array.from(new Set(injuries.map((i) => i.body_region).filter(Boolean)))], [injuries]);
  const filtered = injuries.filter((i) => {
    const m = `${i.name} ${i.summary || ""} ${i.body_region || ""}`.toLowerCase().includes(search.toLowerCase());
    return m && (region === "All" || i.body_region === region);
  });

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <p className="text-primary font-medium mb-2 uppercase tracking-wide text-sm">Patient Resources</p>
            <h1 className="text-4xl font-bold mb-4">Common Injuries</h1>
            <p className="text-muted-foreground text-lg">Learn about diagnoses, symptoms, and recovery exercises.</p>
          </div>

          <div className="max-w-3xl mx-auto mb-8 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search injuries (e.g. rotator cuff tear)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
            </div>
            <div className="flex flex-wrap gap-2">
              {regions.map((r) => (
                <button key={r} onClick={() => setRegion(r)} className={`px-3 py-1.5 text-sm rounded-full border ${region === r ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}>{r}</button>
              ))}
            </div>
          </div>

          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
            {filtered.map((i) => (
              <Link key={i.id} to={`/injuries/${i.slug}`} className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-elevated transition-shadow">
                <div className="text-xs text-primary font-medium uppercase tracking-wide mb-1">{i.body_region}</div>
                <h2 className="font-semibold text-foreground text-lg mb-1">{i.name}</h2>
                <p className="text-sm text-muted-foreground line-clamp-3">{i.summary}</p>
              </Link>
            ))}
            {filtered.length === 0 && <p className="text-muted-foreground text-center col-span-full py-12">No injuries found. {injuries.length === 0 && "Add some from the admin dashboard."}</p>}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Injuries;
