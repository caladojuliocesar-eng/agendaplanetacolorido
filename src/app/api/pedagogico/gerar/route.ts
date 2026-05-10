import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Admin SDK lazily to avoid build errors on Vercel
function getDb() {
  if (admin.apps.length > 0) {
    return admin.app().firestore();
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    console.error("ERRO: Faltam variáveis de ambiente para o Firebase Admin.", { 
      hasKey: !!privateKey, 
      hasEmail: !!clientEmail, 
      hasProject: !!projectId 
    });
    return null;
  }

  const formattedKey = privateKey
    .replace(/^['"]|['"]$/g, '')
    .trim()
    .split('\\n').join('\n');

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedKey,
      }),
    });
    return app.firestore();
  } catch (initError) {
    console.error("Falha ao inicializar Firebase Admin no gerador:", initError);
    return null;
  }
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Configuração do Firebase ausente." }, { status: 500 });
    const { alunoId = "aluno_otto" } = await request.json();

    const snap = await db
      .collection("logs_pedagogicos")
      .where("alunoId", "==", alunoId)
      .get();

    const logs = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      // Sort chronologically for better context
      .sort((a: any, b: any) => (a.data as string).localeCompare(b.data as string));

    if (logs.length === 0) {
      return NextResponse.json({ error: "Nenhum log encontrado para o aluno." }, { status: 404 });
    }

    const logsText = logs.map((l: any) => `[${l.data}] ${l.pilarLabel} (${l.sentimento}): ${l.nota}`).join("\n");

    const prompt = `Você é um coordenador pedagógico de uma escola de educação infantil, especialista em neurodesenvolvimento.
Abaixo estão as observações diárias feitas pela professora ao longo do trimestre sobre o aluno (foco no desenvolvimento e rotina).
A partir desses logs diários, escreva um relatório pedagógico trimestral narrativo e humanizado destinado aos pais.

**Diretrizes:**
- O relatório deve contemplar o desenvolvimento do aluno com base nos seguintes pilares avaliados: Desenvolvimento Socioemocional, Autonomia e Rotina, Linguagem e Comunicação, Coordenação Motora, Raciocínio Lógico, Interesse e Curiosidade, Leitura e Escrita, Comportamento, Alimentação e Sono.
- Agrupe as ideias em um texto fluido em prosa. Não faça apenas uma lista de tópicos soltos. Formate com subtítulos discretos se necessário para organizar o texto, utilizando Markdown.
- O tom de voz deve ser acolhedor, profissional, encorajador e claro. Fale diretamente com a família.
- Destaque as conquistas e trate os pontos de atenção com delicadeza, propondo parceria com a família.
- Finalize com Destaques e Recomendações/Próximos Passos.

**Logs Diários do Trimestre:**
${logsText}

Escreva o relatório trimestral completo em formato Markdown abaixo:`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ report: text });
  } catch (error: any) {
    console.error("Erro ao gerar relatório:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
