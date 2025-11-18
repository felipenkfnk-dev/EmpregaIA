// apps/api/test-chat.js

// Teste local do chat da EmpregaIA (sem chamar o Render)
// Executa diretamente a função chatEmpregaIA do services/chat.js

const { chatEmpregaIA } = require("./services/chat");

// Mensagem padrão, ou o que você passar pela linha de comando
// Ex.: node test-chat.js "quero vagas administrativas em São Paulo"
const userContent =
  process.argv.slice(2).join(" ") ||
  "quero vagas de marketing remoto em Curitiba";

async function main() {
  try {
    const result = await chatEmpregaIA({ userContent });

    console.log("=== EmpregaIA – Teste local do chat ===");
    console.log("ok:", result.ok);
    console.log("reply:", result.reply);
    console.log("personaLoaded:", result.debug?.personaLoaded);
    console.log("personaId:", result.debug?.personaId);
    console.log("examplesCount:", result.debug?.examplesCount);

    console.log("\nMensagens enviadas para o modelo:\n");
    console.dir(result.debug?.messages, { depth: null });
  } catch (err) {
    console.error("Erro ao rodar test-chat.js:", err);
    process.exit(1);
  }
}

main();
