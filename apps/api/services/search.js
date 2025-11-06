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
    job_link: j.share_link || j.job_link || null,
    apply_link:
      j.apply_options?.[0]?.link || j.job_apply_link || j.job_link || null,
    apply_options: (j.apply_options || []).map((opt, k) => ({
      id: `${id}-opt-${k}`,
      label: opt.title || opt.name || "Aplicar",
      link: opt.link,
    })),
    logo: j.thumbnail || null,
    source: "serpapi-google-jobs",
  };
}

/**
 * Busca Google Jobs via SerpAPI (pt-BR + Brasil).
 * Paginação: use pageToken (next_page_token da resposta anterior).
 */
export async function searchJobsSerpAPI({
  q,
  location = "Brazil",
  lang = "pt-BR",
  pageToken = null,
}) {
  if (!SERPAPI_KEY) throw new Error("SERPAPI_KEY ausente nas variáveis de ambiente.");
  if (!q) throw new Error("Parâmetro 'q' é obrigatório.");

  // monta URL com idioma/país corretos
  const buildUrl = (opts = {}) => {
    const u = new URL("https://serpapi.com/search.json");
    u.searchParams.set("engine", "google_jobs");
    u.searchParams.set("q", q);
    if (opts.location) u.searchParams.set("location", opts.location);
    u.searchParams.set("hl", lang || "pt-BR"); // idioma
    u.searchParams.set("gl", "br");            // país Brasil
    if (opts.pageToken) u.searchParams.set("next_page_token", opts.pageToken);
    u.searchParams.set("api_key", SERPAPI_KEY);
    return u.toString();
  };

  // 1ª tentativa: com location informado
  let resp = await fetch(buildUrl({ location, pageToken }));
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`SerpAPI ${resp.status}: ${text}`);
  }
  let data = await resp.json();
  let items = (data.jobs_results || []).map(normalizeJob);
  let nextPageToken = data.serpapi_pagination?.next_page_token || null;

  // Fallback: se não veio nada, tenta sem location mantendo gl=br (amplia o leque)
  if (items.length === 0 && location) {
    resp = await fetch(buildUrl({ pageToken })); // sem location
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`SerpAPI ${resp.status}: ${text}`);
    }
    data = await resp.json();
    items = (data.jobs_results || []).map(normalizeJob);
    nextPageToken = data.serpapi_pagination?.next_page_token || null;
  }

  return { items, nextPageToken };
}
