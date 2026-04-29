const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");
require("dotenv").config({ path: ".env.local" });

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

async function repair() {
  console.log("--- INICIANDO REPARO TOTAL ---");
  
  try {
    const escolaId = "planeta-colorido";
    const turma = "Infantil II";

    // 1. Escola
    await setDoc(doc(db, "escolas", escolaId), {
      nome: "Escola Planeta Colorido",
      turmas: [turma],
      criadoEm: new Date().toISOString()
    });

    // 2. Alunos
    const alunos = ["otto", "alice", "helena"];
    for (const id of alunos) {
      console.log(`Configurando aluno: ${id}`);
      await setDoc(doc(db, "alunos", id), {
        nome: id.charAt(0).toUpperCase() + id.slice(1),
        turma: turma,
        escolaId: escolaId,
        paiIds: [],
        criadoEm: new Date().toISOString()
      });
    }

    // 3. Usuário: Professora Gabi
    console.log("Configurando Prof. Gabi...");
    await setDoc(doc(db, "usuarios", "prof_gabi"), {
      nome: "Gabi",
      email: "julio.calado@hotmail.com",
      role: "professor",
      escolaId: escolaId,
      turma: turma,
      criadoEm: new Date().toISOString()
    });

    // 4. Usuário: Mãe Gracielly (Vinculada à Helena)
    console.log("Configurando Mãe Gracielly...");
    await setDoc(doc(db, "usuarios", "mae_gracielly"), {
      nome: "Gracielly",
      email: "gracielly.lourenco@gmail.com",
      role: "pai",
      escolaId: escolaId,
      filhos: ["helena"],
      criadoEm: new Date().toISOString()
    });

    console.log("\n✅ TUDO PRONTO! O banco de dados está perfeito agora.");
  } catch (e) {
    console.error("❌ ERRO:", e.message);
  }
  process.exit(0);
}

repair();
