import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://brendanparkermd.com";
const SUPABASE_URL = "https://recwqewfzkkfzvbatesk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlY3dxZXdmemtrZnp2YmF0ZXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MDQ3OTQsImV4cCI6MjA5MTI4MDc5NH0.e0fELPOZPt3c-Z8WuGd4oXaFnrZZ--WmoFn3NlIGmno";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

async function supabaseSelect(table: string, query: string): Promise<any[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase query failed: ${res.status} ${res.statusText} for ${url}`);
  }
  return res.json();
}

// Routes intentionally excluded from the sitemap:
// - /resources, /orthopedic-resources, /rehab_exercises, /injuries, /injuries/:slug
//   → legacy redirects (<Navigate>) to canonical pages; not indexable destinations.
// - /ultrasound-admin, /admin, /exercise-library-admin, /auth → private/admin routes.
async function generateEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/about", changefreq: "monthly", priority: "0.8" },
    { path: "/services", changefreq: "monthly", priority: "0.8" },
    { path: "/ultrasound", changefreq: "weekly", priority: "0.8" },
    { path: "/pt-exercises", changefreq: "weekly", priority: "0.7" },
    { path: "/exercise-library", changefreq: "weekly", priority: "0.8" },
    { path: "/exercise-library/search", changefreq: "weekly", priority: "0.6" },
    { path: "/pt-locations", changefreq: "monthly", priority: "0.7" },
    { path: "/contact", changefreq: "monthly", priority: "0.7" },
  ];

  // Ultrasound injection detail pages
  const injections = await supabaseSelect(
    "ultrasound_injections",
    "select=slug&status=eq.published"
  );
  for (const inj of injections) {
    entries.push({
      path: `/ultrasound/${inj.slug}`,
      changefreq: "monthly",
      priority: "0.6",
    });
  }

  // Exercise library regions
  const locations = await supabaseSelect("body_locations", "select=slug");
  for (const loc of locations) {
    entries.push({
      path: `/exercise-library/region/${loc.slug}`,
      changefreq: "weekly",
      priority: "0.6",
    });
    entries.push({
      path: `/exercise-library/region/${loc.slug}/general`,
      changefreq: "weekly",
      priority: "0.5",
    });
  }

  // Pathology pages
  const pathologies = await supabaseSelect(
    "pathologies",
    "select=slug,body_locations!pathologies_body_location_id_fkey(slug)&is_active=eq.true"
  );
  for (const p of pathologies) {
    const locSlug = p.body_locations?.slug;
    if (locSlug && p.slug) {
      entries.push({
        path: `/exercise-library/region/${locSlug}/pathology/${p.slug}`,
        changefreq: "weekly",
        priority: "0.5",
      });
    }
  }

  return entries;
}

function toXml(entries: SitemapEntry[]): string {
  const today = new Date().toISOString().split("T")[0];
  const urls = entries.map((e) => {
    const lines = [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      ...(e.changefreq ? [`    <changefreq>${e.changefreq}</changefreq>`] : []),
      ...(e.priority ? [`    <priority>${e.priority}</priority>`] : []),
      `  </url>`,
    ];
    return lines.join("\n");
  });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

async function main() {
  const entries = await generateEntries();
  const xml = toXml(entries);
  writeFileSync(resolve("public/sitemap.xml"), xml);
  console.log(`sitemap.xml written with ${entries.length} entries`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
