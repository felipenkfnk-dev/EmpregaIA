// apps/api/index.js
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { searchJobsSerpAPI } from "./services/search.js";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ proteção contra excesso de requisições (30 por minuto por IP)
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // máximo de 30 req/min
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ✅ rota de verificação de status (para o Render)
app.get("/healthz", (_req, res) => res.send("ok"));

// ✅ rota de debug (opcional)
app.get("/debug/env", (_req, res) => {
  res.json({
    serpapiKeyPresent: Boolean(process.env.SERPAPI_KEY),
    serpapiKeyLength: process.env.SERPAPI_KEY
      ? String(process.env.SERPAPI_KEY.length)
      : "0",
  });
});

// ✅ rota principal de status
app.get("/", (_req, res) => {
  res.json({ message: "API EmpregaIA está online 🚀" });
});

// ✅ rota principal de busca (Google Jobs via SerpAPI)
app.get("/api/search", async (req, res) => {
  try {
    const {
      q,
      location = "Brazil",
      page = "0",
      perPage = "10",
      lang = "pt-BR",
    } = req.query;

    if (!q) {
      return res
        .status(400)
        .json({ ok: false, error: "Parâmetro 'q' é obrigatório." });
    }

    const { items, nextPage } = await searchJobsSerpAPI({
      q,
      location,
      page: Number(page) || 0,
      perPage: Number(perPage) || 10,
      lang,
    });

    return res.json({ ok: true, items, nextPage });
  } catch (err) {
    console.error("❌ Erro interno /api/search:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Erro interno ao buscar vagas.",
      hint: err.message,
      provider: "serpapi",
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));

export default app;
