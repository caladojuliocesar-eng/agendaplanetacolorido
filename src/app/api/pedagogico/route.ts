import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Initialize Admin SDK lazily to avoid build errors on Vercel
function getDb() {
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey) {
      console.warn("FIREBASE_PRIVATE_KEY is missing. Admin SDK initialization skipped.");
      return null;
    }

    // Limpeza robusta da chave para evitar erros comuns de cópia/cola na Vercel
    const formattedKey = privateKey
      .replace(/^"|"$/g, '') // Remove aspas no início e fim
      .replace(/\\n/g, "\n"); // Converte \n literais em quebras de linha reais

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: formattedKey,
      }),
    });
  }
  return admin.firestore();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const alunoId = searchParams.get("alunoId") || "aluno_otto";

  try {
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Configuração do Firebase ausente." }, { status: 500 });
    const snap = await db
      .collection("logs_pedagogicos")
      .where("alunoId", "==", alunoId)
      .get();

    const logs = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => (a.data as string).localeCompare(b.data as string));

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("Erro ao buscar logs pedagógicos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
