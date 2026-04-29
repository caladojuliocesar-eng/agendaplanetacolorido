import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function diagnostic() {
  console.log("--- INICIANDO DIAGNÓSTICO DE DADOS ---");
  
  // 1. Check Schools
  const escolaSnap = await getDocs(collection(db, "escolas"));
  console.log(`\n[ESCOLAS] Encontradas: ${escolaSnap.size}`);
  escolaSnap.forEach(d => console.log(` - ID: ${d.id} | Dados:`, d.data()));

  // 2. Check Students
  const alunoSnap = await getDocs(collection(db, "alunos"));
  console.log(`\n[ALUNOS] Encontrados: ${alunoSnap.size}`);
  alunoSnap.forEach(d => console.log(` - ID: ${d.id} | Nome: ${d.data().nome} | Turma: "${d.data().turma}" | EscolaId: "${d.data().escolaId}"`));

  // 3. Check Users
  const userSnap = await getDocs(collection(db, "usuarios"));
  console.log(`\n[USUÁRIOS] Encontrados: ${userSnap.size}`);
  userSnap.forEach(d => {
    const data = d.data();
    console.log(` - ID: ${d.id} | Nome: ${data.nome} | Role: ${data.role} | Email: ${data.email}`);
    if (data.role === 'professor') {
      console.log(`   -> TURMA PROF: "${data.turma}" | ESCOLA PROF: "${data.escolaId}"`);
    }
    if (data.role === 'pai') {
      console.log(`   -> FILHOS:`, data.filhos);
    }
  });

  console.log("\n--- FIM DO DIAGNÓSTICO ---");
}

diagnostic().catch(console.error);
