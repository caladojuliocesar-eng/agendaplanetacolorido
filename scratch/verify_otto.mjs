import admin from "firebase-admin";
import { readFileSync } from "fs";

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync("./service-account.json", "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (e) {
  console.error("❌ Erro ao ler service-account.json.", e);
  process.exit(1);
}

const db = admin.firestore();

async function run() {
  console.log("--- REVISANDO DADOS INSERIDOS PARA OTTO (ORDENAÇÃO EM MEMÓRIA) ---");
  
  console.log("\n[REGISTROS DIÁRIOS]");
  const recordsSnap = await db.collection("registros_diarios")
    .where("alunoId", "==", "aluno_otto")
    .get();

  const records = [];
  recordsSnap.forEach(d => records.push(d.data()));
  records.sort((a, b) => b.data.localeCompare(a.data));

  records.slice(0, 10).forEach(data => {
    console.log(`- Data: ${data.data} | Atividade: ${data.atividadeTexto.substring(0, 50)}...`);
    console.log(`  Alimentação: ${JSON.stringify(data.alimentacao)}`);
    console.log(`  Recados do Pai: ${JSON.stringify(data.mensagensPais || [])}`);
    console.log(`  Recados da Escola: ${JSON.stringify(data.mensagensProfessor || [])}`);
    console.log(`  Professor Observações: ${data.observacoes}`);
  });

  console.log("\n[LOGS PEDAGÓGICOS]");
  const logsSnap = await db.collection("logs_pedagogicos")
    .where("alunoId", "==", "aluno_otto")
    .get();

  const logs = [];
  logsSnap.forEach(d => logs.push(d.data()));
  logs.sort((a, b) => b.data.localeCompare(a.data));

  logs.slice(0, 10).forEach(data => {
    console.log(`- Data: ${data.data} | Pilar: ${data.pilarLabel} | Nota: ${data.nota}`);
  });

  process.exit(0);
}

run().catch(console.error);
