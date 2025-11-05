// apps/api/index.js
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit"); // ✅ adicionado
const { searchJobsSerper } = require("./services/search");

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

// ✅ rota de verificação de status
app.get("/healthz", (_req, res) => res.send("ok"));

// Rota de teste
app.get("/", (req, res) => {
  res.json({ message: "API EmpregaIA está online 🚀" });
});

// Rota principal de busca
app.get("/api/search", async (req, res) => {
  try {
    const { q, location, page, perPage } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Parâmetro 'q' é obrigatório." });
    }

    const result = await searchJobsSerper({ q, location, page, perPage });
    res.json(result);
  } catch (error) {
    console.error("Erro na busca:", error.message);
    res.status(500).json({ error: "Erro interno ao buscar vagas." });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
