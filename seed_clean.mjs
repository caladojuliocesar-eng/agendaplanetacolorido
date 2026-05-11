import admin from "firebase-admin";
import { readFileSync } from "fs";

let serviceAccount;
try {
    serviceAccount = JSON.parse(readFileSync("./service-account.json", "utf8"));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (e) {
    console.error("❌ Erro ao ler service-account.json.");
    process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

const ESCOLA_ID = "planeta-colorido";

async function seed() {
  console.log("🚀 Iniciando Seed Limpo...");

  // 1. Escola
  await db.collection("escolas").doc(ESCOLA_ID).set({
    nome: "Escola Planeta Colorido",
    criadoEm: new Date().toISOString()
  });

  // 2. Usuários (Firestore)
  const users = [
    // Real Users
    { uid: "admin_real", nome: "Admin", email: "contato@juliocalado.com.br", role: "admin", escolaId: ESCOLA_ID },
    { uid: "prof_real", nome: "Professor", email: "julio.calado@hotmail.com", role: "professor", escolaId: ESCOLA_ID, turma: "Berçário II" },
    { uid: "pai_real", nome: "Julio Calado", email: "calado.juliocesar@gmail.com", role: "pai", escolaId: ESCOLA_ID, filhos: ["aluno_otto"] },
    
    // Demo Users
    { uid: "demo_diretora", nome: "Helena (Diretora)", email: "diretora@demo.com", role: "admin", escolaId: ESCOLA_ID },
    { uid: "demo_professora", nome: "Ana Cláudia (Profe)", email: "profe@demo.com", role: "professor", escolaId: ESCOLA_ID, turma: "Berçário II" },
    { uid: "demo_pai", nome: "Ricardo (Pai do Otto)", email: "pai@demo.com", role: "pai", escolaId: ESCOLA_ID, filhos: ["aluno_otto"] }
  ];

  for (const u of users) {
    await db.collection("usuarios").doc(u.uid).set({ ...u, criadoEm: new Date().toISOString() });
    
    // Tenta criar no Auth (se falhar é porque já existe, tudo bem)
    try {
        await auth.createUser({ uid: u.uid, email: u.email, password: "demo123", displayName: u.nome });
    } catch (e) { }
  }

  // 3. Alunos
  const alunos = [
    { id: "aluno_otto", nome: "Otto", turma: "Berçário II", paiIds: ["demo_pai", "pai_real"] },
    { id: "aluno_alice", nome: "Alice", turma: "Berçário II", paiIds: [] },
    { id: "aluno_gael", nome: "Gael", turma: "Berçário II", paiIds: [] }
  ];

  for (const a of alunos) {
    await db.collection("alunos").doc(a.id).set({ ...a, escolaId: ESCOLA_ID, fotoUrl: null, criadoEm: new Date().toISOString() });
  }

  // 4. Logs Pedagógicos do Otto (Para testes da Inteligência Artificial)
  const pilares = ["socioemocional", "autonomia", "linguagem", "motora", "logico"];
  for (let i = 0; i < 20; i++) {
    const p = pilares[Math.floor(Math.random() * pilares.length)];
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    await db.collection("logs_pedagogicos").add({
      alunoId: "aluno_otto",
      escolaId: ESCOLA_ID,
      turma: "Berçário II",
      professorId: "demo_professora",
      data: date.toISOString().split("T")[0],
      pilar: p,
      pilarLabel: p.charAt(0).toUpperCase() + p.slice(1),
      nota: "Demonstrou excelente evolução hoje. " + p,
      sentimento: Math.random() > 0.2 ? "positivo" : "atencao",
      criadoEm: new Date().toISOString()
    });
  }

  console.log("✅ Banco populado com sucesso em 'planeta-colorido'!");
  process.exit(0);
}

seed().catch(console.error);
