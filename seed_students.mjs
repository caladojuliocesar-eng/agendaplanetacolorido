import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
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

const studentNames = ["Benja", "Leo", "Dedé", "Hugo", "Thiago", "Joao", "Raul", "Juliana", "Liv"];

async function addStudents() {
  try {
    for (const nome of studentNames) {
      await addDoc(collection(db, "alunos"), {
        nome: nome,
        turma: "Infantil I",
        escolaId: "planeta-colorido",
        fotoUrl: null,
        paiIds: [],
        criadoEm: new Date().toISOString()
      });
      console.log(`Aluno ${nome} adicionado.`);
    }
    console.log("Todos os alunos foram cadastrados com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar alunos:", error);
  }
}

addStudents();
