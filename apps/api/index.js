// apps/api/index.js
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { searchJobsSerpAPI } from "./services/search.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/healthz", (_req, res) => res.send("ok"));

app.get("/debug/env", (_req, res) => {
  res.json({
    serpapiKeyPresent: Boolean(process.env.SERPAPI_KEY),
    serpapiKeyLength: process.env.SERPAPI_KEY
      ? String(process.env.SERPAPI_KEY.length)
      : "0",
  });
});

app.get("/", (_req, res) => {
  res.json({ message: "API EmpregaIA está online 🚀" });
});

app.get("/api/search", async (req, res) => {
  try {
    const { q, location = "Brazil", lang = "pt-BR", pageToken = null } = req.query;
    if (!q) return res.status(400).json({ ok: false, error: "Parâmetro 'q' é obrigatório." });

    const { items, nextPageToken } = await searchJobsSerpAPI({
      q,
      location,
      lang,
      pageToken,
    });

    return res.json({ ok: true, items, nextPageToken });
  } catch (err) {
    console.error("❌ /api/search:", err.message);
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
