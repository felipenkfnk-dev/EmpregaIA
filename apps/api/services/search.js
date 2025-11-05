// apps/api/services/search.js
const axios = require("axios");

const SERPER_ENDPOINT = "https://google.serper.dev/jobs";

/**
 * Chama a Serper.dev (Google Jobs) e normaliza o retorno.
 * @param {Object} params
 * @param {string} params.q - termo de busca (obrigatório)
 * @param {string} [params.location] - cidade/estado/país (opcional)
 * @param {number} [params.page=1] - página (1..n)
 * @param {number} [params.perPage=10] - itens por página (máx recomendado 20)
 */
async function searchJobsSerper({ q, location = "", page = 1, perPage = 10 }) {
  if (!process.env.SERPER_API_KEY) {
    throw new Error("Falta SERPER_API_KEY nas variáveis de ambiente.");
  }

  const { data } = await axios.post(
    SERPER_ENDPOINT,
    { q, location },
    {
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    }
  );

  const all = Array.isArray(data?.jobs) ? data.jobs : [];

  const start = (Number(page) - 1) * Number(perPage);
  const end = start + Number(perPage);
  const pageItems = all.slice(start, end);

  const items = pageItems.map((j, idx) => ({
    id: j.jobId || j.jobIdSnippet || `${j.title}-${start + idx}`,
    title: j.title || "",
    company: j.companyName || j.company || "",
    location: j.location || "",
    posted_at: j.date || j.timestamp || null,
    snippet: j.description || j.snippet || "",
    url: j.jobUrl || j.link || j.applyLink || "",
    source: "serper",
  }));

  return {
    query: q,
    total: all.length,
    page: Number(page),
    perPage: Number(perPage),
    items,
  };
}

module.exports = { searchJobsSerper };
