/**
 * =====================================================
 * OTTOMATIC — Seed de Logs Pedagógicos (Admin SDK)
 * =====================================================
 * 
 * Popula a coleção "logs_pedagogicos" com 60 dias letivos
 * de anotações simuladas para o aluno Otto (Showroom).
 * 
 * USO:  node scripts/seed-pedagogico.mjs
 * 
 * REQUER: ./service-account.json na raiz do projeto
 * 
 * SEGURANÇA:
 *   - Coleção NOVA (logs_pedagogicos) — não toca em nada existente.
 *   - IDs determinísticos — pode rodar múltiplas vezes.
 * =====================================================
 */

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
  console.error("❌ Erro ao ler service-account.json. Coloque o arquivo na raiz do projeto.");
  process.exit(1);
}

const db = admin.firestore();

// ── Configuração do Aluno ────────────────────────────
const ALUNO_ID = "aluno_otto";
const ESCOLA_ID = "escola_showroom";
const TURMA = "Maternal II";
const PROFESSOR_ID = "demo_professora";

// =====================================================
// OS 10 PILARES — Banco de Anotações Realistas
// =====================================================

const PILARES = {
  socioemocional: {
    label: "Desenvolvimento Socioemocional",
    positivo: [
      "Brincou cooperativamente no cantinho do faz-de-conta com 3 colegas",
      "Consolou um colega que estava chorando no parque",
      "Dividiu espontaneamente o brinquedo com a Maria",
      "Entrou na sala sorrindo, se despediu da mãe sem chorar",
      "Ajudou a professora a recolher os brinquedos sem ser pedido",
      "Fez amizade com o aluno novo e o incluiu nas brincadeiras",
      "Expressou verbalmente quando estava triste em vez de chorar",
      "Participou ativamente da roda pedindo a vez para falar",
    ],
    neutro: [
      "Preferiu brincar sozinho no cantinho da leitura hoje",
      "Ficou mais quieto que o normal, mas participou quando chamado",
      "Interagiu normalmente com os colegas durante o lanche",
      "Adaptação normal após o final de semana",
    ],
    atencao: [
      "Ficou irritado quando o colega pegou o brinquedo — precisou de mediação",
      "Chorou na entrada, demorou ~15min para se acalmar",
      "Teve dificuldade em dividir materiais durante a atividade de artes",
      "Empurrou um colega na fila — conversamos sobre respeito ao espaço",
    ],
  },

  autonomia: {
    label: "Autonomia e Rotina",
    positivo: [
      "Guardou a mochila no gancho e tirou a agenda sozinho",
      "Foi ao banheiro sozinho e lavou as mãos sem precisar de lembrete",
      "Vestiu o casaco sozinho quando sentiu frio no parque",
      "Comeu o lanche todo sem ajuda, usando garfo e faca",
      "Organizou os brinquedos por conta própria antes de sair",
      "Conseguiu abrir a garrafa d'água sozinho pela primeira vez",
    ],
    neutro: [
      "Precisou de ajuda para abotoar a camisa após o banheiro",
      "Pediu ajuda para guardar o material — normal para a idade",
      "Usou o banheiro com lembrete da professora",
    ],
    atencao: [
      "Resistiu em guardar os brinquedos, disse que 'não queria'",
      "Pediu colo várias vezes durante o dia — possível regressão",
      "Não quis ir ao banheiro sozinho hoje, pediu acompanhamento",
    ],
  },

  linguagem: {
    label: "Linguagem e Comunicação",
    positivo: [
      "Contou para a turma o que fez no final de semana com frases completas",
      "Usou a palavra 'porque' corretamente para explicar sua escolha",
      "Reconheceu a letra O e disse 'é a letra do meu nome!'",
      "Cantou a música da rotina inteira sem esquecer as palavras",
      "Pediu 'por favor' e 'obrigado' espontaneamente no lanche",
      "Formou uma frase de 5 palavras para descrever o desenho",
      "Inventou uma história curta durante o faz-de-conta",
    ],
    neutro: [
      "Participou da roda mas falou pouco — ouviu atentamente",
      "Trocou algumas letras na fala — desenvolvimento normal para 3 anos",
      "Repetiu as palavras da professora na atividade de vocabulário",
    ],
    atencao: [
      "Gaguejou um pouco hoje — pode ser fase, vamos acompanhar",
      "Não quis participar da roda de conversa — ficou calado",
      "Dificuldade em expressar o que queria, ficou frustrado",
    ],
  },

  motora: {
    label: "Coordenação Motora e Expressão Corporal",
    positivo: [
      "Segurou o lápis corretamente durante toda a atividade de pintura",
      "Subiu e desceu o escorregador com segurança e equilíbrio",
      "Recortou a linha pontilhada com tesoura sem sair do contorno",
      "Dançou seguindo o ritmo da música na aula de dança",
      "Encaixou todas as peças do quebra-cabeça de 12 peças",
      "Equilibrou-se em uma perna só por 5 segundos no ed. física",
      "Pintou dentro dos contornos com precisão — grande evolução!",
    ],
    neutro: [
      "Segurou o lápis com força excessiva — corrigimos a posição",
      "Participou da aula de ed. física mas cansou rápido",
      "Fez a atividade de colagem com ajuda para aplicar a cola",
    ],
    atencao: [
      "Tropeçou duas vezes durante a recreação — observar coordenação",
      "Recusou-se a participar da atividade de recorte — disse que não conseguia",
      "Dificuldade em pular com os dois pés juntos",
    ],
  },

  logico: {
    label: "Raciocínio Lógico e Matemático",
    positivo: [
      "Contou até 10 corretamente na brincadeira de esconde-esconde",
      "Separou os blocos por cor e tamanho sem instrução",
      "Entendeu o conceito de 'mais' e 'menos' na atividade com bolinhas",
      "Montou a sequência de tamanhos (grande-médio-pequeno) corretamente",
      "Reconheceu os números 1 a 5 nos cartões",
      "Resolveu o desafio de encaixe lógico na primeira tentativa",
    ],
    neutro: [
      "Contou até 5 mas pulou o número 4 — normal para a faixa etária",
      "Fez a atividade de classificação com ajuda verbal",
      "Reconheceu os números 1 e 2 mas confundiu 3 e 5",
    ],
    atencao: [
      "Perdeu o interesse na atividade de contagem rapidamente",
      "Não quis participar da atividade com números hoje",
    ],
  },

  curiosidade: {
    label: "Interesse pelo Conhecimento e Curiosidade",
    positivo: [
      "Perguntou 'por que o céu é azul?' durante a roda de conversa",
      "Ficou fascinado observando as formigas no jardim por 10 minutos",
      "Pediu para repetir o experimento com água e tinta — queria ver de novo",
      "Trouxe uma folha do jardim e perguntou o nome da árvore",
      "Quis saber como funciona o relógio da sala",
      "Explorou todos os materiais novos da caixa sensorial com entusiasmo",
      "Fez perguntas sobre o livro mesmo depois de a história terminar",
    ],
    neutro: [
      "Participou do experimento mas sem grande entusiasmo",
      "Observou a atividade sensorial mas preferiu não tocar os materiais",
    ],
    atencao: [
      "Mostrou pouco interesse nas atividades lúdicas hoje — sonolento",
      "Não quis explorar os materiais novos — pode estar indisposto",
    ],
  },

  leitura: {
    label: "Interesse pela Leitura e Escrita",
    positivo: [
      "Pediu para 'ler' o livro para os colegas — inventou a história pelas imagens",
      "Folheou os livros do cantinho de leitura por conta própria",
      "Reconheceu a capa do livro 'Os Três Porquinhos' e pediu para contar",
      "Apontou e nomeou animais nas ilustrações corretamente",
      "Disse que a mãe leu uma história em casa e recontou para a turma",
      "Fez a associação imagem-palavra no jogo de memória das letras",
    ],
    neutro: [
      "Ouviu a história mas não fez perguntas — atento porém passivo",
      "Folheou o livro rapidamente sem se deter nas imagens",
    ],
    atencao: [
      "Não quis participar da roda de história — disperso",
      "Pouco interesse nos livros hoje — preferiu os brinquedos",
    ],
  },

  comportamento: {
    label: "Comportamento durante as Atividades",
    positivo: [
      "Manteve o foco na atividade dirigida por 15 minutos — excelente!",
      "Seguiu todas as instruções da atividade sem precisar repetir",
      "Esperou sua vez na fila do escorregador com paciência",
      "Levantou a mão para falar na roda — respeitou a vez dos colegas",
      "Ficou sentado durante toda a hora da história sem se dispersar",
    ],
    neutro: [
      "Ficou inquieto após 10 minutos da atividade — redirecionamos",
      "Precisou de 2 lembretes para prestar atenção na roda",
      "Comportamento dentro do esperado para a idade e energia do dia",
    ],
    atencao: [
      "Muito agitado hoje — não conseguiu focar em nenhuma atividade dirigida",
      "Interrompeu a roda de história 3 vezes — conversamos em particular",
      "Correu pela sala durante a atividade — possível excesso de energia",
      "Dificuldade em seguir a rotina de transição entre atividades",
    ],
  },

  alimentacao_sono: {
    label: "Alimentação e Rotina do Sono",
    positivo: [
      "Comeu toda a fruta e repetiu o almoço — apetite ótimo",
      "Dormiu o soninho inteiro sem acordar — 1h30min",
      "Experimentou o legume novo (abobrinha) e gostou",
      "Tomou bastante água ao longo do dia sem precisar de lembrete",
      "Comeu bem todas as refeições e dormiu tranquilo",
    ],
    neutro: [
      "Comeu pouco no almoço mas compensou no lanche da tarde",
      "Demorou para pegar no sono mas dormiu 40min",
      "Comeu normalmente — sem novidades",
    ],
    atencao: [
      "Recusou o almoço hoje — disse que não estava com fome",
      "Não quis dormir o soninho — ficou agitado na hora do descanso",
      "Recusou a fruta e o suco — aceitou apenas o pão",
    ],
  },

  destaques: {
    label: "Destaques e Recomendações",
    positivo: [
      "DESTAQUE: Otto ajudou um colega a se acalmar dizendo 'respira fundo, vai ficar tudo bem' — empatia incrível para a idade",
      "Grande evolução na coordenação motora fina este mês",
      "Está mais sociável — interage com todos os colegas da turma",
      "Progresso notável na autonomia: faz quase toda a rotina de chegada sozinho",
      "Vocabulário expandiu consideravelmente — usa frases mais elaboradas",
    ],
    neutro: [
      "Mês estável — sem grandes marcos mas evolução contínua",
      "Desenvolvimento dentro do esperado para a faixa etária",
    ],
    atencao: [
      "Atenção: Otto tem mostrado mais irritabilidade esta semana — acompanhar com a família",
      "Sugestão para casa: incentivar atividades de recorte para fortalecer a motora fina",
    ],
  },
};

// =====================================================
// UTILS
// =====================================================

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Gera dias letivos (seg-sex) retroativos */
function gerarDiasLetivos(qtdDias) {
  const dias = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - (qtdDias + 30)); // ~4 meses atrás

  while (dias.length < qtdDias) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const d = String(cursor.getDate()).padStart(2, "0");
      dias.push(`${y}-${m}-${d}`);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

/** Gera as anotações de um dia — simula 1 a 3 pilares */
function gerarLogsDoDia(data, diaIndex) {
  const logs = [];
  const pilarKeys = Object.keys(PILARES);

  // Quantidade de anotações do dia: realista = 1 a 3
  const qtd = Math.random() < 0.3 ? 1 : Math.random() < 0.7 ? 2 : 3;
  const pilaresHoje = new Set();

  // Alimentação/sono quase sempre aparece (70%)
  if (Math.random() < 0.7) pilaresHoje.add("alimentacao_sono");

  // Destaques são raros — 1x a cada ~15 dias
  if (diaIndex % 15 === 0) pilaresHoje.add("destaques");

  // Preencher o resto com pilares aleatórios
  while (pilaresHoje.size < qtd) {
    pilaresHoje.add(pickRandom(pilarKeys.filter((p) => p !== "destaques")));
  }

  for (const pilar of pilaresHoje) {
    const banco = PILARES[pilar];
    // Distribuição: 60% positivo, 25% neutro, 15% atenção
    const roll = Math.random();
    let sentimento, nota;

    if (roll < 0.6) {
      sentimento = "positivo";
      nota = pickRandom(banco.positivo);
    } else if (roll < 0.85) {
      sentimento = "neutro";
      nota = pickRandom(banco.neutro);
    } else {
      sentimento = "atencao";
      nota = pickRandom(banco.atencao);
    }

    logs.push({ pilar, pilarLabel: banco.label, nota, sentimento });
  }

  return logs;
}

// =====================================================
// EXECUÇÃO
// =====================================================

async function main() {
  console.log("📚 Seed Pedagógico — Aluno Otto (Showroom)");
  console.log("================================================\n");

  const diasLetivos = gerarDiasLetivos(60); // ~3 meses
  let totalLogs = 0;
  const batch = db.batch();
  const MAX_BATCH = 450; // Firestore limit = 500, com margem

  for (let i = 0; i < diasLetivos.length; i++) {
    const data = diasLetivos[i];
    const logs = gerarLogsDoDia(data, i);

    for (let j = 0; j < logs.length; j++) {
      const log = logs[j];
      const docId = `${ALUNO_ID}_${data}_${log.pilar}`;
      const ref = db.collection("logs_pedagogicos").doc(docId);

      batch.set(ref, {
        alunoId: ALUNO_ID,
        escolaId: ESCOLA_ID,
        turma: TURMA,
        professorId: PROFESSOR_ID,
        data,
        pilar: log.pilar,
        pilarLabel: log.pilarLabel,
        nota: log.nota,
        sentimento: log.sentimento,
        criadoEm: new Date(`${data}T${10 + j}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:00`).toISOString(),
      });

      totalLogs++;

      // Commit parcial se chegar perto do limite
      if (totalLogs % MAX_BATCH === 0) {
        await batch.commit();
        console.log(`  💾 Batch parcial: ${totalLogs} logs escritos...`);
      }
    }

    const icons = logs.map((l) =>
      l.sentimento === "positivo" ? "✅" : l.sentimento === "neutro" ? "➖" : "⚠️"
    );
    console.log(`📅 ${data} — ${logs.length} nota(s): ${icons.join(" ")}`);
  }

  // Commit final
  await batch.commit();

  console.log("\n================================================");
  console.log(`✅ Seed concluído!`);
  console.log(`📊 Total de logs pedagógicos: ${totalLogs}`);
  console.log(`📅 Período: ${diasLetivos[0]} → ${diasLetivos[diasLetivos.length - 1]}`);
  console.log(`👦 Aluno: Otto (${ALUNO_ID})`);
  console.log(`🏫 Escola: Showroom (${ESCOLA_ID})`);
  console.log(`\n🔒 Coleção: "logs_pedagogicos" (isolada do app em produção)`);
  console.log(`💡 Próximo passo: criar o Dashboard Pedagógico no Showroom`);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
