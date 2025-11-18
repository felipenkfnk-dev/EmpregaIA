// apps/api/services/chat.js
const fs = require("fs");
const path = require("path");

// -------------------------
// Caminhos base da EmpregaIA
// -------------------------
const personaPath = path.join(__dirname, "..", "personas", "empregaia.json");
const examplesPath = path.join(__dirname, "..", "examples", "empregaia-dialogos.json");

// -------------------------
// Carrega persona na inicialização do módulo
// -------------------------
let persona = null;

try {
  const raw = fs.readFileSync(personaPath, "utf-8");
  persona = JSON.parse(raw);
  console.log("[chat] Persona EmpregaIA carregada com sucesso.");
} catch (err) {
  console.error("[chat] Erro ao carregar persona EmpregaIA:", err.message);
  // fallback simples para não quebrar o sistema
  persona = {
    id: "empregaia-fallback",
    name: "EmpregaIA (fallback)",
    role: "system",
    system_message:
      "Você é a EmpregaIA, assistente de IA especializada em vagas e carreira. " +
      "Se a persona oficial não foi carregada, responda de forma simples, clara e profissional.",
  };
}

// -------------------------
// Carrega exemplos de diálogo (opcional)
// -------------------------
let examples = [];

try {
  if (fs.existsSync(examplesPath)) {
    const rawEx = fs.readFileSync(examplesPath, "utf-8");
    examples = JSON.parse(rawEx);
    console.log("[chat] Exemplos de diálogo da EmpregaIA carregados.");
  } else {
    console.log("[chat] Nenhum arquivo de exemplos encontrado (isso é opcional).");
  }
} catch (err) {
  console.warn("[chat] Não foi possível carregar exemplos de diálogo:", err.message);
  examples = [];
}

/**
 * Monta o array de mensagens no formato esperado pela API de chat.
 *
 * @param {object} params
 * @param {string} params.userContent - mensagem do usuário
 */
function buildMessages({ userContent }) {
  const msgs = [];

  // 1) Mensagem de sistema (persona)
  if (persona && persona.system_message) {
    msgs.push({
      role: persona.role || "system",
      content: persona.system_message,
    });
  }

  // 2) Exemplos de diálogo (se existirem)
  //
  // Suporta dois formatos:
  // a) [{ role, content }, ...]
  // b) [{ user: "...", assistant: "..." }, ...]
  if (Array.isArray(examples) && examples.length > 0) {
    for (const ex of examples) {
      // formato (b) – user/assistant
      if (ex.user && ex.assistant) {
        msgs.push({ role: "user", content: ex.user });
        msgs.push({ role: "assistant", content: ex.assistant });
        continue;
      }

      // formato (a) – role/content direto
      if (ex.role && ex.content) {
        msgs.push({ role: ex.role, content: ex.content });
      }
    }
  }

  // 3) Mensagem atual do usuário
  msgs.push({
    role: "user",
    content: userContent || "",
  });

  return msgs;
}

/**
 * Função principal de chat da EmpregaIA.
 * Por enquanto é um placeholder (não chama a OpenAI de verdade).
 *
 * Depois vamos substituir a parte de "reply" pela chamada da API de chat.
 *
 * @param {object} params
 * @param {string} params.userContent
 */
async function chatEmpregaIA({ userContent }) {
  const messages = buildMessages({ userContent });

  // 🔸 PLACEHOLDER:
  // Aqui NO FUTURO vamos chamar a API da OpenAI.
  // Por agora, retornamos algo estático + debug.
  const reply =
    "Sou a EmpregaIA em modo de teste. Recebi a sua mensagem e estou pronta para, em breve, buscar vagas e te orientar. " +
    "Por enquanto, ainda estou em fase de configuração técnica no backend.";

  return {
    ok: true,
    reply,
    debug: {
      personaId: persona?.id || null,
      personaLoaded: !!persona,
      examplesCount: examples.length || 0,
      messages,
    },
  };
}

module.exports = {
  chatEmpregaIA,
  buildMessages,
};
