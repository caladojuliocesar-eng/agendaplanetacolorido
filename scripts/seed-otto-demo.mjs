import admin from "firebase-admin";
import { readFileSync } from "fs";

// ── Inicialização Admin SDK ──────────────────────────
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync("./service-account.json", "utf8"));
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
} catch (e) {
  console.error("❌ Erro ao ler service-account.json. Certifique-se de que o arquivo está na raiz do projeto.");
  process.exit(1);
}

const db = admin.firestore();

// ── Configuração do Aluno e Contexto ──────────────────
const ALUNO_ID = "aluno_otto";
const ESCOLA_ID = "planeta-colorido";
const TURMA = "Berçário II";
const PROFESSOR_ID = "960K9sECkKX8ai6ksS2FtTkKYVs2"; // UID da Profe Ana Cláudia

// Exemplos realistas de atividades para Berçário II
const atividadesExemplos = [
  {
    texto: "Exploramos o parque de areia pela manhã, trabalhando a socialização e compartilhamento de brinquedos. À tarde, realizamos uma atividade sensorial com gelatina colorida, onde os pequenos puderam explorar diferentes texturas e temperaturas.",
    atividades: { rodaHistoria: true, rodaConversa: false, recreacaoDirigida: true, recreacaoLivre: true, edFisica: false, artes: true, danca: false, ingles: false, parque: true, musica: false, natacao: false }
  },
  {
    texto: "Hoje tivemos aula especial de musicalização! O Otto ficou fascinado com o som dos chocalhos e tambores, acompanhando o ritmo com palmas. Também fizemos nossa roda de história clássica com o livro de texturas dos animais.",
    atividades: { rodaHistoria: true, rodaConversa: true, recreacaoDirigida: false, recreacaoLivre: true, edFisica: false, artes: false, danca: false, ingles: false, parque: false, musica: true, natacao: false }
  },
  {
    texto: "Na aula de artes, trabalhamos com pintura a dedo em cartolina grande. Otto usou cores primárias e se concentrou bastante na mistura de tintas com os dedinhos. Depois da sesta, fizemos um circuito motor leve com almofadas no tatame.",
    atividades: { rodaHistoria: false, rodaConversa: true, recreacaoDirigida: true, recreacaoLivre: true, edFisica: false, artes: true, danca: false, ingles: false, parque: false, musica: false, natacao: false }
  },
  {
    texto: "Hoje estimulamos a coordenação motora fina com jogos de encaixe e empilhamento de blocos macios. O Otto conseguiu montar uma torre alta e comemorou muito com os colegas! No fim da tarde, brincamos no gramado com bolhas de sabão.",
    atividades: { rodaHistoria: true, rodaConversa: false, recreacaoDirigida: true, recreacaoLivre: true, edFisica: false, artes: false, danca: false, ingles: false, parque: true, musica: false, natacao: false }
  },
  {
    texto: "Fizemos uma divertida dinâmica com espelho hoje para trabalhar a expressão corporal e autoidentificação. Otto fez caretas engraçadas e reconheceu sua imagem com muita alegria. Também tivemos nossa contação de histórias com fantoches.",
    atividades: { rodaHistoria: true, rodaConversa: true, recreacaoDirigida: false, recreacaoLivre: true, edFisica: false, artes: false, danca: true, ingles: false, parque: false, musica: false, natacao: false }
  },
  {
    texto: "Dia de muita exploração no pátio externo! Coletamos folhas secas e gravetos para criar nossa caixa da natureza. Otto se mostrou muito curioso com as diferentes texturas das folhas. À tarde, relaxamos ouvindo música instrumental.",
    atividades: { rodaHistoria: true, rodaConversa: false, recreacaoDirigida: true, recreacaoLivre: true, edFisica: false, artes: true, danca: false, ingles: false, parque: true, musica: false, natacao: false }
  },
  {
    texto: "Trabalhamos o equilíbrio e coordenação motora ampla passando por um túnel de tecido e rampas de espuma. Otto adorou o desafio e passou várias vezes rindo muito! Finalizamos o dia com uma contação de histórias sobre animais da floresta.",
    atividades: { rodaHistoria: true, rodaConversa: true, recreacaoDirigida: true, recreacaoLivre: true, edFisica: true, artes: false, danca: false, ingles: false, parque: false, musica: false, natacao: false }
  }
];

// Exemplos de recados e diálogos de demonstração
const recadosExemplos = [
  {
    mensagensPais: [],
    mensagensProfessor: [],
    recadoLidoProfessor: true,
    observacoes: "Otto esteve super alegre hoje e participou de todas as brincadeiras com muita energia!"
  },
  {
    mensagensPais: [
      {
        id: "msg_p_1",
        texto: "Bom dia, pró! O Otto teve um sono um pouco agitado essa noite. Se ele parecer muito cansado na hora da sesta, pode deixar ele dormir um pouquinho mais.",
        horario: "07:35",
        lida: true
      }
    ],
    mensagensProfessor: [
      {
        id: "msg_prof_1",
        texto: "Olá! Combinado. Vamos acompanhar o soninho dele de perto hoje e deixá-lo descansar bem.",
        horario: "08:15",
        lida: true
      }
    ],
    recadoLidoProfessor: true,
    observacoes: "Otto dormiu super bem à tarde (cerca de 1h45) e acordou bem disposto!"
  },
  {
    mensagensPais: [],
    mensagensProfessor: [],
    recadoLidoProfessor: true,
    observacoes: "Pedimos enviar mais uma troca de roupa na mochila amanhã, por favor, pois as de hoje foram usadas após a atividade com tinta."
  },
  {
    mensagensPais: [
      {
        id: "msg_p_2",
        texto: "Mandei a troca de roupa extra na mochila. Obrigado pelo aviso!",
        horario: "07:42",
        lida: true
      }
    ],
    mensagensProfessor: [],
    recadoLidoProfessor: true,
    observacoes: "Otto comeu muito bem todas as refeições hoje e adorou a melancia do lanche!"
  },
  {
    mensagensPais: [],
    mensagensProfessor: [],
    recadoLidoProfessor: true,
    observacoes: "Otto dividiu o brinquedo espontaneamente com a Alice hoje no parque, foi muito fofo de ver!"
  },
  {
    mensagensPais: [
      {
        id: "msg_p_3",
        texto: "Boa tarde! Hoje quem vai buscar o Otto será a avó dele, Dona Maria. Ela tem a autorização na ficha.",
        horario: "12:10",
        lida: true
      }
    ],
    mensagensProfessor: [
      {
        id: "msg_prof_2",
        texto: "Perfeito! Já anotamos aqui e faremos a liberação para a Dona Maria na saída.",
        horario: "13:00",
        lida: true
      }
    ],
    recadoLidoProfessor: true,
    observacoes: "Tudo certo na saída com a vovó Maria!"
  },
  {
    mensagensPais: [],
    mensagensProfessor: [],
    recadoLidoProfessor: true,
    observacoes: "Otto participou ativamente da aula de música hoje e curtiu muito o som da flauta."
  }
];

// Exemplos de registros pedagógicos para o relatório da IA
const logsPedagogicosExemplos = [
  {
    pilar: "socioemocional",
    pilarLabel: "Socioemocional",
    nota: "Otto demonstrou excelente comportamento ao dividir o chocalho de forma espontânea com o Gael durante a musicalização.",
    sentimento: "positivo"
  },
  {
    pilar: "autonomia",
    pilarLabel: "Autonomia",
    nota: "Otto tentou calçar o próprio tênis após o soninho, demonstrando persistência e autonomia crescente na rotina.",
    sentimento: "positivo"
  },
  {
    pilar: "linguagem",
    pilarLabel: "Linguagem",
    nota: "Otto expressou-se muito bem usando frases simples para pedir mais fruta ('quero mais mamá!').",
    sentimento: "positivo"
  },
  {
    pilar: "motora",
    pilarLabel: "Motora",
    nota: "Otto apresentou ótimo equilíbrio e segurança ao passar pelo circuito de almofadas no tatame sem precisar de apoio.",
    sentimento: "positivo"
  },
  {
    pilar: "socioemocional",
    pilarLabel: "Socioemocional",
    nota: "Otto ficou um pouco chateado quando um colega pegou seu brinquedo, mas acalmou-se rapidamente com a mediação da professora.",
    sentimento: "neutro"
  },
  {
    pilar: "logico",
    pilarLabel: "Lógico",
    nota: "Otto conseguiu agrupar peças de encaixe por cores semelhantes (vermelho e azul) após breve orientação pedagógica.",
    sentimento: "positivo"
  },
  {
    pilar: "motora",
    pilarLabel: "Motora",
    nota: "Otto demonstrou melhora na preensão palmar ao segurar o giz de cera grosso para fazer traçados na cartolina.",
    sentimento: "positivo"
  }
];

// Função para calcular os últimos N dias letivos (segunda a sexta)
function obterDiasLetivosRetroativos(qtdDias) {
  const dias = [];
  const cursor = new Date();
  
  while (dias.length < qtdDias) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) { // Ignora Domingo (0) e Sábado (6)
      dias.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return dias.reverse(); // Ordena do mais antigo para o mais recente (hoje)
}

async function simular() {
  console.log("👦 Iniciando Simulação de Agenda para Otto...");
  console.log("=================================================");

  const dias = obterDiasLetivosRetroativos(7);
  console.log(`📅 Dias letivos selecionados: ${dias.map(d => d.toISOString().split("T")[0]).join(", ")}`);

  const batch = db.batch();

  for (let i = 0; i < dias.length; i++) {
    const date = dias[i];
    const dateStr = date.toISOString().split("T")[0];
    const recordId = `${ALUNO_ID}_${dateStr}`;

    console.log(`\n⚙️  Gerando dados para o dia: ${dateStr}...`);

    // 1. Limpar registros pré-existentes na data para o Otto (evita duplicidade)
    const registroRef = db.collection("registros_diarios").doc(recordId);
    batch.delete(registroRef);

    // 2. Criar novo registro diário
    const atividadeHoje = atividadesExemplos[i % atividadesExemplos.length];
    const recadoHoje = recadosExemplos[i % recadosExemplos.length];

    const recordData = {
      alunoId: ALUNO_ID,
      escolaId: ESCOLA_ID,
      turma: TURMA,
      data: dateStr,
      professorId: PROFESSOR_ID,
      alimentacao: {
        frutas: Math.random() > 0.15 ? 1 : 2, // 1=Bom, 2=Pouco
        almoco: Math.random() > 0.1 ? 1 : 2,
        lancheTarde: 1,
        jantar: 0,
        outros: 0
      },
      atividades: atividadeHoje.atividades,
      atividadeTexto: atividadeHoje.texto,
      observacoes: recadoHoje.observacoes,
      mensagensPais: recadoHoje.mensagensPais,
      mensagensProfessor: recadoHoje.mensagensProfessor,
      recadoLidoProfessor: recadoHoje.recadoLidoProfessor,
      resumoIA: null,
      lido: true,
      dataLeitura: new Date(date.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4h depois
      soninho: Math.random() > 0.1, // maioria dormiu
      xixi: true,
      coco: Math.random() > 0.4,
      ausente: false,
      motivoAusencia: "",
      criadoEm: new Date(date.getTime() + 17 * 60 * 60 * 1000).toISOString(), // 17:00
      atualizadoEm: new Date(date.getTime() + 17 * 60 * 60 * 1000).toISOString()
    };

    batch.set(registroRef, recordData);
    console.log(`   📝 Registro diário agendado para gravação (${recordId})`);

    // 3. Criar registro pedagógico correspondente a esse dia
    const logHoje = logsPedagogicosExemplos[i % logsPedagogicosExemplos.length];
    const logId = `${ALUNO_ID}_${dateStr}_${logHoje.pilar}`;
    const logRef = db.collection("logs_pedagogicos").doc(logId);
    batch.delete(logRef); // Limpa antigo se houver

    const logData = {
      alunoId: ALUNO_ID,
      escolaId: ESCOLA_ID,
      turma: TURMA,
      professorId: PROFESSOR_ID,
      data: dateStr,
      pilar: logHoje.pilar,
      pilarLabel: logHoje.pilarLabel,
      nota: logHoje.nota,
      sentimento: logHoje.sentimento,
      criadoEm: new Date(date.getTime() + 16 * 60 * 60 * 1000).toISOString() // 16:00
    };

    batch.set(logRef, logData);
    console.log(`   📊 Log pedagógico agendado para gravação (${logId})`);
  }

  // Comitar alterações
  console.log("\n💾 Enviando transações para o Firestore...");
  await batch.commit();

  console.log("=================================================");
  console.log("🎉 Simulação concluída com sucesso!");
  console.log(`✅ Registros de rotina e relatórios pedagógicos inseridos para os últimos 7 dias letivos.`);
  process.exit(0);
}

simular().catch(err => {
  console.error("❌ Erro fatal ao rodar simulação:", err);
  process.exit(1);
});
