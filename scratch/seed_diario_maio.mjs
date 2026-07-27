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
const ESCOLA_ID = "planeta-colorido";
const TURMA = "Berçário II";
const ALUNOS = ["aluno_otto", "aluno_alice", "aluno_gael", "aluno_luna"];
const PROFESSOR_ID = "demo_professora";

const ATIVIDADES_MODELO = [
  "Brincadeiras cooperativas com blocos de montar, roda de contação de histórias no tatame e banho de sol no solário.",
  "Atividade sensorial com texturas (areia e farinha), recreação dirigida com túnel de espuma e roda de cantigas infantis.",
  "Pintura guache com as mãos em folhas de cartolina grandes, contação de fábulas com fantoches e atividades motoras livres no parquinho.",
  "Roda de conversa pedagógica com cartões de frutas, dança com bambolês e musicalização infantil utilizando chocalhos caseiros.",
  "Aula sensorial no jardim para exploração de folhas e grama, circuito motor com obstáculos de almofadas e brincadeiras com bolhas de sabão."
];

async function generateMonthlyData() {
  console.log("🚀 Iniciando geração de dados diários de classe para Maio de 2026...");
  
  const year = 2026;
  const month = 5; // Maio
  const daysInMonth = new Date(year, month, 0).getDate(); // 31
  
  let recordsAdded = 0;
  
  const batch = db.batch();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    
    // Pular finais de semana (Sábado = 6, Domingo = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    const activityText = ATIVIDADES_MODELO[(day - 1) % ATIVIDADES_MODELO.length];
    
    // Atividades marcadas no dia
    const isSpecialDay = day % 2 === 0;
    const atividades = {
      rodaHistoria: true,
      rodaConversa: day % 3 === 0,
      recreacaoDirigida: true,
      recreacaoLivre: day % 2 === 0,
      parque: true,
      musica: isSpecialDay,
      artes: !isSpecialDay,
      edFisica: day % 5 === 0,
      danca: false,
      ingles: false,
      natacao: false
    };

    for (const alunoId of ALUNOS) {
      const recordId = `${alunoId}_${dateStr}`;
      const recordRef = db.collection("registros_diarios").doc(recordId);
      
      // 5% de chance de falta para demonstrar a grade de frequência com faltas
      const ausente = Math.random() < 0.08;
      const motivo = ausente ? (Math.random() > 0.5 ? "Resfriado" : "Consulta de rotina") : "";
      
      batch.set(recordRef, {
        alunoId,
        escolaId: ESCOLA_ID,
        turma: TURMA,
        data: dateStr,
        professorId: PROFESSOR_ID,
        alimentacao: {
          frutas: ausente ? 0 : 1,
          almoco: ausente ? 0 : 1,
          lancheTarde: ausente ? 0 : 1,
          jantar: ausente ? 0 : 1,
          outros: 0
        },
        atividades,
        atividadeTexto: ausente ? "" : activityText,
        observacoes: "",
        recadoLidoProfessor: true,
        resumoIA: null,
        lido: true,
        dataLeitura: date.toISOString(),
        soninho: ausente ? false : Math.random() > 0.2,
        xixi: !ausente,
        coco: ausente ? false : Math.random() > 0.5,
        ausente,
        motivoAusencia: motivo,
        criadoEm: date.toISOString(),
        atualizadoEm: date.toISOString(),
      });
      
      recordsAdded++;
    }
  }
  
  await batch.commit();
  console.log(`✅ Sucesso! Foram gerados ${recordsAdded} registros diários para Maio/2026 (alunos: ${ALUNOS.join(", ")}).`);
  process.exit(0);
}

generateMonthlyData().catch(err => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
