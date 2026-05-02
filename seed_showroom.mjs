import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";

// Inicialização com Admin SDK
const serviceAccount = JSON.parse(readFileSync("./service-account.json", "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

const ESCOLA_ID = "escola_showroom";
const ESCOLA_NOME = "Escola Modelo Ottomatic";

async function clearOldData(collectionName, field = "escolaId") {
  const snap = await db.collection(collectionName).where(field, "==", ESCOLA_ID).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`[Limpeza] ${snap.size} registros removidos de ${collectionName}`);
}

async function seed() {
  console.log("🚀 Iniciando Seed do Showroom (Correção Alimentação)...");

  // 1. Limpeza
  await clearOldData("usuarios");
  await clearOldData("alunos");
  await clearOldData("registros_diarios");
  await clearOldData("cobrancas");
  await clearOldData("avisos");

  // 2. Usuários
  const users = [
    { uid: "demo_diretora", nome: "Dra. Helena (Diretora)", email: "diretora@demo.com", role: "admin" },
    { uid: "demo_professora", nome: "Prof. Ana Cláudia", email: "profe@demo.com", role: "professor", turma: "Maternal II" },
    { uid: "demo_pai", nome: "Ricardo (Pai do Otto)", email: "pai@demo.com", role: "pai", filhos: ["aluno_otto"] }
  ];

  for (const u of users) {
    try {
      await auth.createUser({ uid: u.uid, email: u.email, password: "demo123", displayName: u.nome });
    } catch (e) {}
    await db.collection("usuarios").doc(u.uid).set({ ...u, escolaId: ESCOLA_ID, criadoEm: new Date().toISOString() });
  }

  // 3. Alunos
  const alunos = [
    { id: "aluno_otto", nome: "Otto", turma: "Maternal II", paiIds: ["demo_pai"] },
    { id: "aluno_maya", nome: "Maya", turma: "Maternal II", paiIds: [] },
    { id: "aluno_gael", nome: "Gael", turma: "Maternal II", paiIds: [] },
    { id: "aluno_luna", nome: "Luna", turma: "Maternal II", paiIds: [] }
  ];

  for (const a of alunos) {
    await db.collection("alunos").doc(a.id).set({ ...a, escolaId: ESCOLA_ID, criadoEm: new Date().toISOString() });
  }

  // 4. Histórico (Correção: Alimentação agora é NÚMERO 0-2)
  const daysCount = 10;
  const resumos = [
    "O Otto teve um dia excelente! Participou ativamente da roda de música e comeu todo o almoço.",
    "Hoje exploramos as cores primárias. Otto adorou a atividade com tinta guache azul.",
    "Dia de parque! Otto brincou muito no escorregador e compartilhou os brinquedos com os colegas.",
    "Otto estava um pouco sonolento hoje, mas após a soneca da tarde recuperou a energia.",
    "Atividade de artes: Otto criou um desenho lindo para a família. Mostrou muita criatividade!",
    "Hoje o foco foi coordenação motora. Otto conseguiu completar o circuito com facilidade.",
    "Otto comeu frutas variadas no lanche e repetiu o suco. Dia muito produtivo!",
    "Trabalhamos histórias infantis hoje. Otto ficou encantado com o livro dos dinossauros.",
    "Dia de educação física. Otto correu bastante e se divertiu com a bola.",
    "Encerramos a semana com culinária! Otto ajudou a preparar os cookies e adorou o resultado."
  ];

  for (let i = 0; i < daysCount; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    for (const a of alunos) {
        const recordId = `${a.id}_${dateStr}`;
        await db.collection("registros_diarios").doc(recordId).set({
            id: recordId,
            alunoId: a.id,
            escolaId: ESCOLA_ID,
            turma: a.turma,
            data: dateStr,
            // 1: Bom, 2: Pouco, 3: Recusou
            alimentacao: { 
                frutas: 1, 
                almoco: 1, 
                lancheTarde: 1, 
                jantar: 0, 
                outros: 0 
            },
            atividades: { rodaHistoria: true, parque: true, rodaConversa: true },
            atividadeTexto: "Atividades lúdicas e integração social.",
            observacoes: "Dia tranquilo e de muito aprendizado.",
            resumoIA: a.id === "aluno_otto" ? resumos[i] : "O aluno teve um ótimo desempenho nas atividades propostas hoje.",
            recadoLidoProfessor: true,
            lido: true,
            professorId: "demo_professora",
            soninho: "Dormiu tranquilo",
            xixi: "Normal",
            coco: "Normal",
            criadoEm: date.toISOString(),
            atualizadoEm: date.toISOString()
        });
    }
  }

  // 5. Cobranças
  const cobrancas = [
    { id: "cob_1", titulo: "Mensalidade - Maio", valor: 1200, status: "pendente", vencimento: "2026-05-10" },
    { id: "cob_2", titulo: "Mensalidade - Abril", valor: 1200, status: "pago", vencimento: "2026-04-10" }
  ];
  for (const c of cobrancas) {
    await db.collection("cobrancas").doc(c.id).set({ ...c, alunoId: "aluno_otto", alunoNome: "Otto", escolaId: ESCOLA_ID, dataVencimento: c.vencimento, visualizado: true, criadoEm: new Date().toISOString() });
  }

  // 6. Avisos
  const avisos = [
    { id: "av_1", titulo: "Festa da Família", mensagem: "Convidamos todos para nossa festa!", tipo: "info", escolaId: ESCOLA_ID, ativo: true, criadoEm: new Date().toISOString() }
  ];
  for (const av of avisos) {
    await db.collection("avisos").doc(av.id).set(av);
  }

  console.log("\n✨ SHOWROOM ATUALIZADO (Alimentação Corrigida)!");
  process.exit(0);
}

seed().catch(console.error);
