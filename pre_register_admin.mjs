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

async function preRegisterAdmin() {
  const email = "diretoria@ottomatic.com.br";
  try {
    await addDoc(collection(db, "usuarios"), {
      nome: "Diretoria Ottomatic",
      email: email,
      role: "admin",
      escolaId: "planeta-colorido", // Default school ID
      criadoEm: new Date().toISOString()
    });

    console.log(`Sucesso! O e-mail ${email} foi pré-registrado como ADMIN.`);
    console.log("Peça ao usuário para fazer Login (não precisa criar conta de novo, só logar).");
  } catch (error) {
    console.error("Erro ao pré-registrar:", error);
  }
}

preRegisterAdmin();
