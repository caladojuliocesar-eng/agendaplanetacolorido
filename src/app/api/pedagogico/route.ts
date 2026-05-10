import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Initialize Admin SDK lazily to avoid build errors on Vercel
function formatPrivateKey(rawKey: string): string {
  let key = rawKey.replace(/^['"]|['"]$/g, '').trim();

  // Se não começa com o header PEM, assume Base64
  if (!key.startsWith('-----BEGIN')) {
    key = Buffer.from(key, 'base64').toString('utf8');
  }

  // Normaliza TODAS as variações possíveis de newline:
  // 1. \\n literal (4 chars: backslash backslash n) -> real newline
  // 2. \n literal (2 chars: backslash n) -> real newline  
  // 3. \r\n Windows style -> real newline
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

    // Validação: a chave deve começar e terminar com os marcadores PEM
    if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----') || !formattedKey.includes('-----END PRIVATE KEY-----')) {
      return { 
        db: null, 
        error: "Chave não contém marcadores PEM válidos após processamento. Primeiros 40 chars: " + formattedKey.substring(0, 40)
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
    console.error("Falha ao inicializar Firebase Admin:", initError);
    return { db: null, error: initError.message };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const alunoId = searchParams.get("alunoId") || "aluno_otto";

  try {
    const dbResult = getDb();
    const db = dbResult.db;
    const initError = dbResult.error;

    if (!db) {
      return NextResponse.json({ 
        error: "Falha na inicialização do Firebase Admin.",
        initError: initError,
        envCheck: {
          keyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
          emailLength: process.env.FIREBASE_CLIENT_EMAIL?.length || 0,
          projectLength: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.length || 0,
        }
      }, { status: 500 });
    }

    console.log("Buscando logs para aluno:", alunoId);
    const snapshot = await db.collection("logs_pedagogicos")
      .where("alunoId", "==", alunoId)
      .orderBy("data", "desc")
      .get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("Erro detalhado na API Pedagogico:", error);
    return NextResponse.json({
      error: "Erro ao buscar logs no Firestore.",
      details: error.message,
      stack: error.stack?.split('\n')[0] // Apenas a primeira linha do stack para segurança
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const dbResult = getDb();
    const db = dbResult.db;
    
    if (!db) return NextResponse.json({ error: "Configuração do Firebase ausente." }, { status: 500 });

    const body = await request.json();
    const newLog = {
      alunoId: body.alunoId || "aluno_otto",
      escolaId: body.escolaId || "escola_default",
      turma: body.turma || "Berçário II",
      professorId: body.professorId || "prof_ana",
      data: body.data || new Date().toISOString().split("T")[0],
      pilar: body.pilar,
      pilarLabel: body.pilarLabel,
      nota: body.nota,
      sentimento: body.sentimento,
      criadoEm: new Date().toISOString(),
    };

    const docRef = await db.collection("logs_pedagogicos").add(newLog);
    return NextResponse.json({ id: docRef.id, ...newLog });
  } catch (error: any) {
    console.error("Erro ao salvar log pedagógico:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
