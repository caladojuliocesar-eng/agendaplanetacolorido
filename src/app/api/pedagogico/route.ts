import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Initialize Admin SDK if not already
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const alunoId = searchParams.get("alunoId") || "aluno_otto";

  try {
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
