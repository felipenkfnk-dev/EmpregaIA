// apps/api/services/search.js
import fetch from "node-fetch";

const SERPAPI_KEY = process.env.SERPAPI_KEY;

function normalizeJob(j, idx) {
  const id = j.job_id || `${j.job_title || j.title}-${j.company_name}-${idx}`;
  return {
    id,
    title: j.job_title || j.title || "",
    company: j.company_name || "",
    location: j.location || "",
    description_snippet: j.description || j.snippet || "",
    posted_at: j.detected_extensions?.posted_at || null,
    salary: j.detected_extensions?.salary || null,
    remote: Boolean(
      (j.detected_extensions?.work_from_home ?? null) ||
      /remoto|remote/i.test(`${j.location} ${j.job_title} ${j.description}`)
    ),
    type: j.detected_extensions?.schedule_type || null,
    via: j.via || "Google Jobs",
    job_link: j.share_link || j.job_link,
    apply_link: j.apply_options?.[0]?.link || j.job_apply_link || j.job_link || null,
    apply_options: (j.apply_options || []).map((opt, k) => ({
      id: `${id}-opt-${k}`,
      label: opt.title || opt.name || "Aplicar",
      link: opt.link
    })),
    logo: j.thumbnail || null,
    source: "serpapi-google-jobs",
  };
}

/**
 * Busca Google Jobs via SerpAPI.
 * Paginação: use pageToken (next_page_token retornado na resposta anterior).
 */
export async function searchJobsSerpAPI({
  q,
  location = "Brazil",
  lang = "pt-BR",
  pageToken = null,
}) {
  if (!SERPAPI_KEY) throw new Error("SERPAPI_KEY ausente nas variáveis de ambiente.");

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_jobs");
  url.searchParams.set("q", q);
  if (location) url.searchParams.set("location", location);
  url.searchParams.set("hl", "pt-BR"); // idioma português
  url.searchParams.set("gl", "br"); // país Brasil
  url.searchParams.set("uule", "w+CAIQICIUQsO1byBBcgFvIEp1bmN0aW9u"); // São Paulo codificado
  url.searchParams.set("api_key", SERPAPI_KEY);

  if (pageToken) url.searchParams.set("next_page_token", pageToken); // ✅ novo

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`SerpAPI ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  const raw = data.jobs_results || [];
  const items = raw.map(normalizeJob);
  const nextPageToken = data.serpapi_pagination?.next_page_token || null;

  return { items, nextPageToken };
}
