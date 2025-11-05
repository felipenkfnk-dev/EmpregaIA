// apps/api/services/search.js
const axios = require("axios");

const SERPER_ENDPOINT = "https://google.serper.dev/jobs";
const SERPER_KEY = process.env.SERPER_API_KEY;

if (!SERPER_KEY) {
  console.error("❌ SERPER_API_KEY não encontrada nas variáveis de ambiente.");
}

/**
 * Busca vagas na API do Serper.dev (Google Jobs)
 * @param {Object} params
 * @param {string} params.q - termo de busca (obrigatório)
 * @param {string} [params.location] - local opcional (cidade, estado ou país)
 * @param {number} [params.page=1]
 * @param {number} [params.perPage=10]
 */
async function searchJobsSerper({ q, location = "", page = 1, perPage = 10 }) {
  if (!q || !q.trim()) {
    throw new Error("O parâmetro 'q' é obrigatório.");
  }
  if (!SERPER_KEY) {
    throw new Error("Falta SERPER_API_KEY nas variáveis de ambiente.");
  }

  // A API do Serper espera o termo completo em 'q' (ex: "desenvolvedor Brazil")
  const query = location ? `${q} ${location}` : q;

  try {
    const { data } = await axios.post(
      SERPER_ENDPOINT,
      {
        q: query,
        num: Number(perPage),
        page: Number(page),
      },
      {
        headers: {
          "X-API-KEY": SERPER_KEY,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    // Normalização dos resultados
    const jobs = Array.isArray(data?.jobs) ? data.jobs : [];

    return jobs.map((job, idx) => ({
      id: job.jobId || job.jobIdSnippet || `${job.title}-${idx}`,
      title: job.title || "",
      company: job.companyName || job.company || "",
      location: job.location || "",
      postedAt: job.date || job.timestamp || "",
      snippet: job.description || job.snippet || "",
      url: job.jobUrl || job.link || job.applyLink || "",
      salary: job.salary || "",
      source: "serper",
    }));
  } catch (err) {
    // Mostra detalhes no log do Render (sem travar o servidor)
    console.error("❌ Erro na consulta ao Serper:", {
      status: err.response?.status,
      data: err.response?.data || err.message,
    });

    // Retorna erro controlado
    throw new Error("Erro interno ao consultar a API de vagas.");
  }
}

module.exports = { searchJobsSerper };
