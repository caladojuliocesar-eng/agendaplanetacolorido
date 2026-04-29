import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

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

async function removePeriods() {
  const alunosRef = collection(db, "alunos");
  const snapshot = await getDocs(alunosRef);

  let updatedCount = 0;
  for (const d of snapshot.docs) {
    const aluno = d.data();
    if (aluno.turma && typeof aluno.turma === "string") {
      let novaTurma = aluno.turma;
      if (novaTurma.includes(" - Tarde")) novaTurma = novaTurma.replace(" - Tarde", "");
      if (novaTurma.includes(" - Manhã")) novaTurma = novaTurma.replace(" - Manhã", "");
      if (novaTurma.includes(" - Integral")) novaTurma = novaTurma.replace(" - Integral", "");
      
      if (novaTurma !== aluno.turma) {
        await updateDoc(doc(db, "alunos", d.id), { turma: novaTurma });
        console.log(`Aluno ${aluno.nome}: ${aluno.turma} -> ${novaTurma}`);
        updatedCount++;
      }
    }
  }

  console.log(`Sucesso! ${updatedCount} turmas atualizadas e limpas no banco de dados.`);
  process.exit(0);
}

removePeriods().catch(console.error);
