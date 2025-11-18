// apps/api/index.js
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const { searchJobsSerper } = require("./services/search");
const { chatEmpregaIA } = require("./services/chat");

const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60,
});
app.use(limiter);

// Rota raiz (saúde)
app.get("/", (req, res) => {
  res.json({ ok: true, message: "API EmpregaIA está online 🚀" });
});

// Rota principal de busca
app.get("/api/search", async (req, res) => {
  try {
    const { q, location, page, perPage } = req.query;

    if (!q) {
      return res.status(400).json({
        ok: false,
        error: "Parâmetro 'q' é obrigatório.",
      });
    }

    const result = await searchJobsSerper({
      q,
      location,
      page: page ? Number(page) : 1,
      perPage: perPage ? Number(perPage) : 10,
    });

    return res.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    console.error("[/api/search] Erro:", err);
    return res.status(500).json({
      ok: false,
      error: "Erro interno ao buscar vagas.",
      hint: err.message,
    });
  }
});

// ⭐ ROTA DO CHAT EMPREGAIA
app.post("/api/chat", async (req, res) => {
  try {
    const { userContent, message } = req.body || {};

    // aceita tanto "userContent" quanto "message"
    const text = (userContent || message || "").trim();

    if (!text) {
      return res.status(400).json({
        ok: false,
        error: "Campo 'userContent' é obrigatório.",
      });
    }

    const result = await chatEmpregaIA({ userContent: text });
    return res.json(result);

  } catch (err) {
    console.error("[/api/chat] Erro no chat:", err);
    return res.status(500).json({
      ok: false,
      error: "Erro interno ao processar o chat.",
      hint: err.message,
    });
  }
});

// Inicia servidor
app.listen(PORT, () => {
  console.log(`API EmpregaIA ouvindo na porta ${PORT} 🚀`);
});
