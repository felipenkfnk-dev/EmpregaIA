/* eslint-disable no-console */
const API_BASE = "https://serpapi.com/search.json";
const SERPAPI_KEY = process.env.SERPAPI_KEY;

// 🧠 Normaliza localização para o padrão aceito pela SerpAPI (Google Jobs)
function normalizeLocation(input) {
  if (!input || String(input).trim() === "") return "Brazil";

  const raw = String(input).trim();
  const lc = raw.toLowerCase();

  const map = {
    brasil: "Brazil",
    "brasil, br": "Brazil",
    br: "Brazil",
    "br-": "Brazil",
    brazil: "Brazil",
  };

  if (map[lc]) return map[lc];

  // Ex.: “São Paulo, Brasil” → “São Paulo, Brazil”
  if (lc.includes("brasil")) return raw.replace(/brasil/gi, "Brazil");

  return raw; // mantém cidades/estados já em EN: "São Paulo, Brazil"
}

// 🔗 Monta URL da SerpAPI com hl/gl para resultados em PT-BR
function buildUrl({ q, location, type = "jobs" }) {
  const params = new URLSearchParams({
    api_key: SERPAPI_KEY || "",
    engine: type === "jobs" ? "google_jobs" : "google",
    q: q || "",
    location: normalizeLocation(location),
    hl: "pt-BR", // idioma dos resultados
    gl: "br",    // país BR
  });
  return `${API_BASE}?${params.toString()}`;
}

// 📦 Normaliza os resultados de vagas vindos da API
function normalizeItems(json) {
  const list = json?.jobs_results || json?.job_results || [];

  return list.map((j) => {
    const firstApply =
      Array.isArray(j?.apply_options) && j.apply_options.length > 0
        ? j.apply_options[0]?.link
        : null;

    const link = firstApply || j?.link || j?.google_links?.job_view_link || "";

    return {
      title: j?.title || "",
      company: j?.company_name || j?.company || "",
      location: j?.location || "",
      link,
      description: j?.description || j?.snippet || "",
    };
  });
}

// 🚀 Função principal: busca vagas no Google Jobs via SerpAPI
async function searchJobsSerper({ q, location, type = "jobs" }) {
  if (!SERPAPI_KEY) {
    throw new Error("SERPAPI_KEY ausente no ambiente.");
  }

  const url = buildUrl({ q, location, type });
  const started = Date.now();

  const res = await fetch(url, { method: "GET" });
  const text = await res.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // loga erros de parse para debug
    console.error("[SerpAPI][ParseError]", { status: res.status, body: text });
    throw new Error(`Resposta inválida da SerpAPI (status ${res.status}).`);
  }

  // trata erros vindos da SerpAPI
  if (!res.ok || json?.error) {
    console.error("[SerpAPI][Error]", {
      status: res.status,
      error: json?.error,
      params: { q, location: normalizeLocation(location), type },
    });
    throw new Error(json?.error || `SerpAPI falhou (status ${res.status}).`);
  }

  const items = normalizeItems(json);

  console.info("[SerpAPI][OK]", {
    ms: Date.now() - started,
    count: items.length,
    params: { q, location: normalizeLocation(location), type },
  });

  return { ok: true, items };
}

module.exports = { searchJobsSerper };
