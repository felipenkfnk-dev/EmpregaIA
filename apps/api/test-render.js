// test-render.js
const API_BASE = "https://empregaia-api.onrender.com";

async function main() {
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userContent: "oi EmpregaIA, me ajuda com vagas de atendimento?"
      }),
    });

    console.log("Status:", res.status);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Erro ao chamar a API do Render:", err);
  }
}

main();
