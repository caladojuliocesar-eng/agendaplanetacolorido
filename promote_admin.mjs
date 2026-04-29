import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
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

async function promoteToAdmin() {
  const email = "diretoria@ottomatic.com.br";
  try {
    const q = query(collection(db, "usuarios"), where("email", "==", email));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      console.log("Usuário não encontrado!");
      return;
    }

    const userDoc = snap.docs[0];
    await updateDoc(doc(db, "usuarios", userDoc.id), {
      role: "admin"
    });

    console.log(`Sucesso! O usuário ${email} agora é ADMIN.`);
  } catch (error) {
    console.error("Erro ao promover usuário:", error);
  }
}

promoteToAdmin();
