import { NextResponse } from "next/server";
import admin from "firebase-admin";

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

  // Limpeza robusta da chave para Vercel
  const formattedKey = privateKey
    .replace(/^['"]|['"]$/g, '')
    .trim()
    .split('\\n').join('\n'); // Garante conversão de \n literais

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedKey,
      }),
    });
    console.log("Firebase Admin inicializado com sucesso para o projeto:", projectId);
    return app.firestore();
  } catch (initError) {
    console.error("Falha ao inicializar Firebase Admin:", initError);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const alunoId = searchParams.get("alunoId") || "aluno_otto";

  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ 
        error: "Configuração do Firebase ausente ou inválida no servidor.",
        envCheck: {
          hasKey: !!process.env.FIREBASE_PRIVATE_KEY,
          hasEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
          hasProject: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
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
    const db = getDb();
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
