import admin from "firebase-admin";
import { readFileSync } from "fs";

// Inicialização com Admin SDK
let serviceAccount;
try {
    serviceAccount = JSON.parse(readFileSync("./service-account.json", "utf8"));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (e) {
    console.error("❌ Erro ao ler service-account.json. O script precisa desse arquivo para rodar.");
    process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

const ESCOLA_ID = "escola_showroom";

async function seed() {
  console.log("🚀 Iniciando Seed do Showroom (Modo Preservação - Blindado)...");

  // 1. Usuários (Só cria se não existir)
  const users = [
    { uid: "demo_diretora", nome: "Dra. Helena (Diretora)", email: "diretora@demo.com", role: "admin" },
    { uid: "demo_professora", nome: "Prof. Ana Cláudia", email: "profe@demo.com", role: "professor", turma: "Maternal II" },
    { uid: "demo_pai", nome: "Ricardo (Pai do Otto)", email: "pai@demo.com", role: "pai", filhos: ["aluno_otto"] }
  ];

  for (const u of users) {
    const userRef = db.collection("usuarios").doc(u.uid);
    const doc = await userRef.get();
    if (!doc.exists) {
        try {
            await auth.createUser({ uid: u.uid, email: u.email, password: "demo123", displayName: u.nome });
            console.log(`✅ Usuário Auth criado: ${u.email}`);
        } catch (e) {}
        await userRef.set({ ...u, escolaId: ESCOLA_ID, criadoEm: new Date().toISOString() });
        console.log(`✅ Usuário Firestore criado: ${u.email}`);
    }
  }

  // 2. Alunos (Só cria se não existir)
  const alunos = [
    { id: "aluno_otto", nome: "Otto", turma: "Maternal II", paiIds: ["demo_pai"] },
    { id: "aluno_maya", nome: "Maya", turma: "Maternal II", paiIds: [] },
    { id: "aluno_gael", nome: "Gael", turma: "Maternal II", paiIds: [] },
    { id: "aluno_luna", nome: "Luna", turma: "Maternal II", paiIds: [] }
  ];

  for (const a of alunos) {
    const alunoRef = db.collection("alunos").doc(a.id);
    const doc = await alunoRef.get();
    if (!doc.exists) {
        await alunoRef.set({ ...a, escolaId: ESCOLA_ID, fotoUrl: null, criadoEm: new Date().toISOString() });
        console.log(`✅ Aluno criado: ${a.nome}`);
    }
  }

  // 3. Histórico (Preenche apenas os buracos vazios dos últimos 10 dias)
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
        const recordRef = db.collection("registros_diarios").doc(recordId);
        const doc = await recordRef.get();
        
        if (!doc.exists) {
            await recordRef.set({
                id: recordId,
                alunoId: a.id,
                escolaId: ESCOLA_ID,
                turma: a.turma,
                data: dateStr,
                alimentacao: { frutas: 1, almoco: 1, lancheTarde: 1, jantar: 0, outros: 0 },
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
            console.log(`✅ Registro automático gerado para ${a.nome} em ${dateStr}`);
        }
    }
  }

  // 4. Cobranças Financeiras (Só cria se não existir)
  const cobrancas = [
    { id: "cob_1", titulo: "Mensalidade - Maio", valor: 1200, status: "pendente", vencimento: "2026-05-10" },
    { id: "cob_2", titulo: "Mensalidade - Abril", valor: 1200, status: "pago", vencimento: "2026-04-10" }
  ];

  for (const c of cobrancas) {
    const cobRef = db.collection("cobrancas").doc(c.id);
    const doc = await cobRef.get();
    if (!doc.exists) {
        await cobRef.set({
          ...c,
          alunoId: "aluno_otto",
          alunoNome: "Otto",
          escolaId: ESCOLA_ID,
          dataVencimento: c.vencimento,
          visualizado: true,
          criadoEm: new Date().toISOString()
        });
        console.log(`✅ Cobrança criada: ${c.titulo}`);
    }
  }

  console.log("\n✨ SHOWROOM SINCRONIZADO!");
  console.log("Nota: Seus dados manuais foram preservados.");
  console.log("-----------------------------------------");
  process.exit(0);
}

seed().catch(console.error);
