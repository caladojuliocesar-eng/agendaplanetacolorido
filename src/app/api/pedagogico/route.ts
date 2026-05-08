import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Initialize Admin SDK lazily to avoid build errors on Vercel
function getDb() {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      console.warn("FIREBASE_PRIVATE_KEY is missing. Admin SDK initialization skipped.");
      return null;
    }
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
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
