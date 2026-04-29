import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";

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

async function addAdmin() {
  const email = "contato@juliocalado.com.br";
  const usersRef = collection(db, "usuarios");
  const q = query(usersRef, where("email", "==", email));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    console.log(`Email ${email} já existe no banco de dados.`);
    return;
  }

  await addDoc(usersRef, {
    nome: "Julio Contato",
    email: email,
    role: "admin",
    escolaId: "escola-demo", // Using the demo school ID we established
    criadoEm: new Date().toISOString()
  });

  console.log(`Sucesso! Usuário ${email} adicionado como Admin.`);
  process.exit(0);
}

addAdmin().catch(console.error);
