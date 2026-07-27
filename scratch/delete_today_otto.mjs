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

const ALUNO_ID = "aluno_otto";
const TODAY_STR = "2026-07-27";

async function run() {
  console.log(`🧹 Removendo dados de hoje (${TODAY_STR}) para o aluno ${ALUNO_ID}...`);

  // 1. Deletar registro diário de hoje
  const recordId = `${ALUNO_ID}_${TODAY_STR}`;
  const recordRef = db.collection("registros_diarios").doc(recordId);
  const recordSnap = await recordRef.get();
  
  if (recordSnap.exists) {
    await recordRef.delete();
    console.log(`✅ Registro diário '${recordId}' removido com sucesso.`);
  } else {
    console.log(`ℹ️ Nenhum registro diário encontrado para hoje (${recordId}).`);
  }

  // 2. Deletar logs pedagógicos de hoje
  const logsSnap = await db.collection("logs_pedagogicos")
    .where("alunoId", "==", ALUNO_ID)
    .where("data", "==", TODAY_STR)
    .get();

  if (logsSnap.size > 0) {
    const batch = db.batch();
    logsSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
      console.log(`✅ Agendando remoção de log pedagógico: ${doc.id}`);
    });
    await batch.commit();
    console.log(`✅ ${logsSnap.size} log(s) pedagógico(s) removido(s) com sucesso.`);
  } else {
    console.log(`ℹ️ Nenhum log pedagógico encontrado para hoje.`);
  }

  console.log("=========================================");
  console.log("🎉 Limpeza concluída!");
  process.exit(0);
}

run().catch(console.error);
