import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Admin SDK lazily to avoid build errors on Vercel
function formatPrivateKey(rawKey: string): string {
  let key = rawKey.replace(/^['"]|['"]$/g, '').trim();

  if (!key.startsWith('-----BEGIN')) {
    key = Buffer.from(key, 'base64').toString('utf8');
  }

  key = key
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n');

  return key;
}

function getDb() {
  try {
    if (admin.apps.length > 0) {
      return { db: admin.app().firestore(), error: null };
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.replace(/^['"]|['"]$/g, '').trim();
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.replace(/^['"]|['"]$/g, '').trim();

    if (!privateKey || !clientEmail || !projectId) {
      return { db: null, error: "Variáveis de ambiente ausentes." };
    }

    let formattedKey: string;
    try {
      formattedKey = formatPrivateKey(privateKey);
    } catch (e: any) {
      return { db: null, error: "Erro ao formatar chave: " + e.message };
    }

    if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----') || !formattedKey.includes('-----END PRIVATE KEY-----')) {
      return { 
        db: null, 
        error: "Chave não contém marcadores PEM válidos após processamento."
      };
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedKey,
      }),
    });
    
    return { db: app.firestore(), error: null };
  } catch (initError: any) {
    console.error("Falha ao inicializar Firebase Admin no gerador:", initError);
    return { db: null, error: initError.message };
  }
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const dbResult = getDb();
    const db = dbResult.db;
    
    if (!db) {
      return NextResponse.json({ 
        error: "Falha na inicialização do Firebase Admin no gerador.",
        details: dbResult.error 
      }, { status: 500 });
    }

    const { alunoId = "aluno_otto", adjustPrompt } = await request.json();

    // Fetch student info for personalization
    const studentSnap = await db.collection("alunos").doc(alunoId).get();
    const studentData = studentSnap.exists ? studentSnap.data() : null;
    const studentName = studentData?.nome || "o aluno";

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

    const basePrompt = `Você é um coordenador pedagógico de uma escola de educação infantil, especialista em neurodesenvolvimento.
Abaixo estão as observações diárias feitas pela professora ao longo do trimestre sobre o(a) aluno(a) ${studentName} (foco no desenvolvimento e rotina).
A partir desses logs diários, escreva um relatório pedagógico trimestral narrativo e humanizado destinado aos pais.

**Diretrizes:**
- O relatório deve contemplar o desenvolvimento de ${studentName} com base nos seguintes pilares avaliados: Desenvolvimento Socioemocional, Autonomia e Rotina, Linguagem e Comunicação, Coordenação Motora, Raciocínio Lógico, Interesse e Curiosidade, Leitura e Escrita, Comportamento, Alimentação e Sono.
- Refira-se ao aluno pelo nome (${studentName}) ao longo do texto para torná-lo pessoal.
- Agrupe as ideias em um texto fluido em prosa. Não faça apenas uma lista de tópicos soltos. Formate com subtítulos discretos se necessário para organizar o texto, utilizando Markdown.
- O tom de voz deve ser acolhedor, profissional, encorajador e claro. Fale diretamente com a família.
- Destaque as conquistas e trate os pontos de atenção com delicadeza, propondo parceria com a família.
- Finalize com Destaques e Recomendações/Próximos Pasos.

**Logs Diários do Trimestre (${studentName}):**
${logsText}

Escreva o relatório trimestral completo em formato Markdown abaixo:`;

    const prompt = adjustPrompt ? adjustPrompt : basePrompt;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ report: text });
  } catch (error: any) {
    console.error("Erro ao gerar relatório:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
