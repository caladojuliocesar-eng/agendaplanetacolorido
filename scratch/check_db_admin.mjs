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
  console.log("--- INICIANDO DIAGNÓSTICO COM ADMIN SDK ---");
  const collections = ["escolas", "alunos", "usuarios", "registros_diarios", "logs_pedagogicos"];
  for (const col of collections) {
    const snap = await db.collection(col).get();
    console.log(`\n[${col.toUpperCase()}] Encontrados: ${snap.size}`);
    // Print first 5 items
    let count = 0;
    snap.forEach(d => {
      if (count < 5) {
        console.log(` - ID: ${d.id} | Data:`, JSON.stringify(d.data()).substring(0, 200));
      }
      count++;
    });
  }
  process.exit(0);
}

run().catch(console.error);
