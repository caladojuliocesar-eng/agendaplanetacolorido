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

// Utilitário para limpar o banco
async function deleteQueryBatch(query, resolve, reject) {
  try {
    const snapshot = await query.get();
    if (snapshot.size === 0) {
      resolve();
      return;
    }
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    process.nextTick(() => deleteQueryBatch(query, resolve, reject));
  } catch (error) {
    reject(error);
  }
}

async function wipeDatabase() {
  const collections = await db.listCollections();
  console.log("🧹 Limpando banco de dados...");
  for (const c of collections) {
    await new Promise((resolve, reject) => {
      deleteQueryBatch(c.limit(500), resolve, reject);
    });
  }
  console.log("✅ Banco limpo!");
}

const ESCOLA_ID = "planeta-colorido";

async function seed() {
  await wipeDatabase();

  console.log("🚀 Iniciando Seed Oficial...");

  // 1. ESCOLA
  await db.collection("escolas").doc(ESCOLA_ID).set({
    nome: "Escola Planeta Colorido",
    criadoEm: new Date().toISOString()
  });

  // 2. USUÁRIOS (Apenas Demos para homologação limpa)
  const users = [
    { uid: "demo_diretora", nome: "Helena (Diretora)", email: "diretora@demo.com", role: "admin", escolaId: ESCOLA_ID },
    // A professora pode alternar depois para "Infantil II" nos testes de migração
    { uid: "demo_professora", nome: "Ana Cláudia (Profe)", email: "profe@demo.com", role: "professor", escolaId: ESCOLA_ID, turma: "Berçário II" },
    { uid: "demo_pai", nome: "Ricardo (Pai do Otto)", email: "pai@demo.com", role: "pai", escolaId: ESCOLA_ID, filhos: ["aluno_otto"] }
  ];

  for (const u of users) {
    await db.collection("usuarios").doc(u.uid).set({ ...u, criadoEm: new Date().toISOString() });
  }

  // 3. ALUNOS (4 na mesma turma: Berçário II. A turma "Infantil II" existirá virtualmente quando mudarmos os alunos)
  const alunos = [
    { id: "aluno_otto", nome: "Otto", turma: "Berçário II", paiIds: ["demo_pai"] },
    { id: "aluno_alice", nome: "Alice", turma: "Berçário II", paiIds: [] },
    { id: "aluno_gael", nome: "Gael", turma: "Berçário II", paiIds: [] },
    { id: "aluno_luna", nome: "Luna", turma: "Berçário II", paiIds: [] }
  ];

  for (const a of alunos) {
    await db.collection("alunos").doc(a.id).set({ ...a, escolaId: ESCOLA_ID, fotoUrl: null, criadoEm: new Date().toISOString() });
  }

  // 4. HISTÓRICO FALSO (Agendas e Log Pedagógico para Otto e Alice)
  console.log("📅 Gerando histórico falso para Otto e Alice (3 meses, 2x semana)...");
  
  const targetAlunos = ["aluno_otto", "aluno_alice"];
  const pilares = ["socioemocional", "autonomia", "linguagem", "motora", "logico"];
  
  // Gerar dias válidos no passado (últimos 90 dias, pegando terças e quintas como simulação)
  const pastDates = [];
  const today = new Date();
  for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayOfWeek = d.getDay();
      // Terça (2) ou Quinta (4)
      if (dayOfWeek === 2 || dayOfWeek === 4) {
          pastDates.push(d);
      }
  }

  for (const date of pastDates) {
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
      
      for (const alunoId of targetAlunos) {
          // A. AGENDA (Registro Diário)
          const recordId = `${alunoId}_${dateStr}`;
          
          const soninho = Math.random() > 0.3; // 70% de chance de ter dormido
          const coco = Math.random() > 0.5;
          const xixi = true;
          
          await db.collection("registros_diarios").doc(recordId).set({
            alunoId: alunoId,
            escolaId: ESCOLA_ID,
            turma: "Berçário II",
            data: dateStr,
            professorId: "demo_professora",
            alimentacao: { manha: 3, almoco: 3, tarde: 3 }, // Comeu tudo
            atividades: { parque: true, artes: false, musica: true, roda: true },
            atividadeTexto: "Brincou muito no parque hoje.",
            observacoes: "",
            recadoLidoProfessor: true,
            resumoIA: null,
            lido: true,
            dataLeitura: new Date(date.getTime() + 86400000).toISOString(),
            soninho,
            xixi,
            coco,
            ausente: false,
            motivoAusencia: "",
            criadoEm: date.toISOString(),
            atualizadoEm: date.toISOString(),
          });

          // B. REGISTRO PEDAGÓGICO (IA)
          const p = pilares[Math.floor(Math.random() * pilares.length)];
          const sentimentos = ["positivo", "positivo", "neutro", "atencao"];
          const sent = sentimentos[Math.floor(Math.random() * sentimentos.length)];
          
          await db.collection("logs_pedagogicos").add({
            alunoId: alunoId,
            escolaId: ESCOLA_ID,
            turma: "Berçário II",
            professorId: "demo_professora",
            data: dateStr,
            pilar: p,
            pilarLabel: p.charAt(0).toUpperCase() + p.slice(1),
            nota: `Demonstrou evolução em ${p}. Participou bem das atividades da rotina.`,
            sentimento: sent,
            criadoEm: date.toISOString()
          });
      }
  }

  console.log(`✅ Banco de Dados Definitivo populado com sucesso! (${pastDates.length} dias simulados)`);
  process.exit(0);
}

seed().catch(console.error);
