import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
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

async function fixAdmin() {
  const email = "contato@juliocalado.com.br";
  const usersRef = collection(db, "usuarios");
  const q = query(usersRef, where("email", "==", email));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.log(`Email ${email} não encontrado.`);
    return;
  }

  for (const d of snapshot.docs) {
    await updateDoc(doc(db, "usuarios", d.id), {
      escolaId: "planeta-colorido" // Corrigindo a escola
    });
  }

  console.log(`Sucesso! Usuário ${email} corrigido para a escola planeta-colorido.`);
  process.exit(0);
}

fixAdmin().catch(console.error);
