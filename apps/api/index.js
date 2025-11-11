const express = require("express");
const cors = require("cors");
const { searchJobsSerper } = require("./services/search");

const app = express();
app.use(cors());
app.use(express.json());

// Healthcheck
app.get("/", (_req, res) => {
  res.json({ message: "API EmpregaIA está online 🚀" });
});

// Rota principal de busca
app.get("/api/search", async (req, res) => {
  try {
    const { q, location, type } = req.query;

    if (!q || String(q).trim() === "") {
      return res.status(400).json({
        ok: false,
        error: "Parâmetro 'q' é obrigatório.",
      });
    }

    const result = await searchJobsSerper({
      q: String(q).trim(),
      location: location ?? "Brazil", // default se vazio
      type: type === "jobs" ? "jobs" : "jobs", // por enquanto só jobs
    });

    return res.json(result);
  } catch (err) {
    console.error("[/api/search][Error]", {
      message: err?.message,
      stack: err?.stack,
    });
    return res.status(502).json({
      ok: false,
      error: "Falha ao consultar a fonte de vagas.",
      detail: err?.message || "Unknown error",
    });
  }
});

module.exports = app;
