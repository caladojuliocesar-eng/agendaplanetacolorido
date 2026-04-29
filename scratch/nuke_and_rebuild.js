const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } = require("firebase/firestore");
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

async function nukeAndRebuild() {
  console.log("--- 1. LIMPANDO O BANCO DE DADOS ---");
  const collections = ["usuarios", "alunos", "escolas", "registros_diarios"];
  
  for (const colName of collections) {
    const snap = await getDocs(collection(db, colName));
    console.log(`Apagando ${snap.size} documentos de "${colName}"...`);
    const deletePromises = snap.docs.map(d => deleteDoc(doc(db, colName, d.id)));
    await Promise.all(deletePromises);
  }

  console.log("\n--- 2. RECONSTRUINDO TUDO DO ZERO ---");
  const ESCOLA_ID = "planeta-colorido";
  const TURMA = "Infantil II";

  // Escola
  await setDoc(doc(db, "escolas", ESCOLA_ID), {
    nome: "Escola Planeta Colorido",
    turmas: [TURMA],
    criadoEm: new Date().toISOString()
  });

  // Alunos
  const alunos = [
    { id: "otto", nome: "Otto" },
    { id: "alice", nome: "Alice" },
    { id: "helena", nome: "Helena" }
  ];

  for (const a of alunos) {
    console.log(`Criando aluno: ${a.nome}`);
    await setDoc(doc(db, "alunos", a.id), {
      nome: a.nome,
      turma: TURMA,
      escolaId: ESCOLA_ID,
      paiIds: [],
      criadoEm: new Date().toISOString()
    });
  }

  // Usuários
  console.log("Criando usuários (Gabi e Gracielly)...");
  
  // PROFESSORA GABI
  await setDoc(doc(db, "usuarios", "template_gabi"), {
    nome: "Professora Gabi",
    email: "julio.calado@hotmail.com",
    role: "professor",
    escolaId: ESCOLA_ID,
    turma: TURMA,
    criadoEm: new Date().toISOString()
  });

  // MÃE GRACIELLY
  await setDoc(doc(db, "usuarios", "template_gracielly"), {
    nome: "Gracielly Lourenço",
    email: "gracielly.lourenco@gmail.com",
    role: "pai",
    escolaId: ESCOLA_ID,
    filhos: ["helena"],
    criadoEm: new Date().toISOString()
  });

  // SEU USUÁRIO (JULIO) - caso queira testar com seu email principal também
  await setDoc(doc(db, "usuarios", "template_julio"), {
    nome: "Julio Calado",
    email: "calado.juliocesar@gmail.com",
    role: "pai",
    escolaId: ESCOLA_ID,
    filhos: ["otto"],
    criadoEm: new Date().toISOString()
  });

  console.log("\n✅ BANCO REESTRUTURADO COM SUCESSO!");
  console.log("Tudo limpo, padronizado e pronto para uso.");
  process.exit(0);
}

nukeAndRebuild().catch(e => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
