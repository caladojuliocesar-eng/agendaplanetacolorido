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
const PROFESSOR_ID = "960K9sECkKX8ai6ksS2FtTkKYVs2"; // profe@planeta.com real UID
const ALUNO_ID = "aluno_luna";

// Mensagens aleatórias positivas para os logs pedagógicos da Luna
const pilaresInfo = [
    {
        pilar: "socioemocional",
        label: "Socioemocional",
        notas: [
            "Demonstrou empatia ao dividir os brinquedos da sala com os colegas voluntariamente.",
            "Participou ativamente do momento da roda de conversa, respeitando a vez do colega falar.",
            "Demonstrou segurança ao expressar suas emoções e adaptou-se muito bem à rotina do dia.",
            "Mostrou-se muito acolhedora e carinhosa com um colega que estava triste hoje.",
            "Interagiu com alegria e calma nas atividades em grupo."
        ]
    },
    {
        pilar: "autonomia",
        label: "Autonomia",
        notas: [
            "Realizou a higiene das mãos de forma independente antes das refeições.",
            "Demonstrou iniciativa ao organizar seus próprios pertences e guardar os brinquedos no lugar.",
            "Alimentou-se sozinha usando os talheres com bastante firmeza e sem pressa.",
            "Tentou calçar os sapatos de forma independente, mostrando grande persistência.",
            "Demonstrou iniciativa em ajudar a professora a distribuir os materiais de desenho."
        ]
    },
    {
        pilar: "linguagem",
        label: "Linguagem",
        notas: [
            "Expressou verbalmente suas necessidades e sentimentos com clareza durante o dia.",
            "Acompanhou com atenção a contação de história e soube relatar a parte que mais gostou.",
            "Ampliou seu repertório verbal arriscando novas palavras e construindo frases completas.",
            "Participou cantando e gesticulando com entusiasmo durante as músicas na roda pedagógica.",
            "Fez perguntas curiosas sobre as ilustrações do livro lido em sala de aula."
        ]
    },
    {
        pilar: "motora",
        label: "Motora",
        notas: [
            "Mostrou excelente equilíbrio e agilidade ao passar pelo circuito de obstáculos no pátio.",
            "Demonstrou avanço na coordenação motora fina ao realizar atividades de colagem e encaixe.",
            "Pintou dentro do espaço delimitado da folha usando giz de cera com firmeza.",
            "Correu, pulou e explorou o espaço do parque com segurança e ótima noção de espaço.",
            "Empilhou blocos de montar formando uma estrutura alta sem deixar cair, demonstrando bom controle motor."
        ]
    },
    {
        pilar: "logico",
        label: "Lógico",
        notas: [
            "Identificou e agrupou os blocos lógicos por cores e formas geométricas corretamente.",
            "Demonstrou raciocínio rápido ao encaixar as peças do quebra-cabeça de animais.",
            "Compreendeu a sequência lógica das atividades do dia, antecipando o momento do lanche.",
            "Contou pequenos objetos e fez associações numéricas simples durante a brincadeira.",
            "Notou a falta de uma peça no jogo de tabuleiro e ajudou a encontrá-la raciocinando onde poderia estar."
        ]
    }
];

const atividadesTextoExemplos = [
    "Participou alegremente da roda de música e explorou as tintas guache na aula de artes.",
    "Brincou bastante no escorregador e ajudou a regar as plantinhas da horta.",
    "Adorou a contação de história com fantoches e se divertiu na cama elástica.",
    "Fez desenhos coloridos com giz de cera e montou castelos com blocos gigantes.",
    "Explorou a caixa de texturas na aula sensorial e correu bastante no gramado."
];

async function run() {
    console.log("🚀 Iniciando limpeza e seed de dados...");

    // 1. Limpar cobranças
    console.log("🧹 Removendo todas as cobranças antigas...");
    const cobrancasSnap = await db.collection("cobrancas").get();
    const cobrancasBatch = db.batch();
    cobrancasSnap.docs.forEach(doc => {
        cobrancasBatch.delete(doc.ref);
    });
    await cobrancasBatch.commit();
    console.log(`✅ ${cobrancasSnap.size} cobranças removidas!`);

    // 2. Limpar relatórios anteriores da Luna
    console.log("🧹 Removendo relatórios pedagógicos antigos da Luna...");
    const relatorioLunaRef = db.collection("relatorios_pedagogicos").doc(`${ALUNO_ID}_2026-T1`);
    await relatorioLunaRef.delete();
    console.log("✅ Relatório trimestral da Luna removido para iniciar do zero.");

    // 3. Limpar registros diários e logs pedagógicos anteriores da Luna
    console.log("🧹 Removendo registros e logs antigos da Luna...");
    const registrosSnap = await db.collection("registros_diarios").where("alunoId", "==", ALUNO_ID).get();
    const regBatch = db.batch();
    registrosSnap.docs.forEach(doc => regBatch.delete(doc.ref));
    await regBatch.commit();
    console.log(`✅ ${registrosSnap.size} registros diários da Luna removidos.`);

    const logsSnap = await db.collection("logs_pedagogicos").where("alunoId", "==", ALUNO_ID).get();
    const logsBatch = db.batch();
    logsSnap.docs.forEach(doc => logsBatch.delete(doc.ref));
    await logsBatch.commit();
    console.log(`✅ ${logsSnap.size} logs pedagógicos da Luna removidos.`);

    // 4. Gerar histórico de 3 meses para a Luna (Teras e Quintas nos últimos 90 dias)
    console.log("📅 Gerando 3 meses de histórico diário e pedagógico para Luna...");
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

    const mainBatch = db.batch();
    
    for (const date of pastDates) {
        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const recordId = `${ALUNO_ID}_${dateStr}`;

        // A. REGISTRO DIÁRIO
        const soninho = Math.random() > 0.25; // 75% dormiu
        const coco = Math.random() > 0.6;
        const xixi = true;
        const alimentacaoNivel = Math.random() > 0.2 ? 3 : 2; // 3 = comeu tudo, 2 = comeu bem
        const atividadeTexto = atividadesTextoExemplos[Math.floor(Math.random() * atividadesTextoExemplos.length)];

        const recordRef = db.collection("registros_diarios").doc(recordId);
        mainBatch.set(recordRef, {
            alunoId: ALUNO_ID,
            escolaId: ESCOLA_ID,
            turma: "Berçário II",
            data: dateStr,
            professorId: PROFESSOR_ID,
            alimentacao: { manha: alimentacaoNivel, almoco: alimentacaoNivel, tarde: alimentacaoNivel },
            atividades: { parque: true, artes: Math.random() > 0.4, musica: Math.random() > 0.5, roda: true },
            atividadeTexto,
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

        // B. LOG PEDAGÓGICO
        const pilarObj = pilaresInfo[Math.floor(Math.random() * pilaresInfo.length)];
        const nota = pilarObj.notas[Math.floor(Math.random() * pilarObj.notas.length)];
        const sentimento = Math.random() > 0.15 ? "positivo" : "neutro"; // Perfil positivo/neutro parecido com o do Otto

        const logRef = db.collection("logs_pedagogicos").doc(); // ID automático
        mainBatch.set(logRef, {
            alunoId: ALUNO_ID,
            escolaId: ESCOLA_ID,
            turma: "Berçário II",
            professorId: PROFESSOR_ID,
            data: dateStr,
            pilar: pilarObj.pilar,
            pilarLabel: pilarObj.label,
            nota,
            sentimento,
            criadoEm: date.toISOString()
        });
    }

    await mainBatch.commit();
    console.log(`🎉 Sucesso! Gerado histórico de ${pastDates.length} dias para a Luna.`);
    process.exit(0);
}

run().catch(err => {
    console.error("❌ Erro fatal:", err);
    process.exit(1);
});
