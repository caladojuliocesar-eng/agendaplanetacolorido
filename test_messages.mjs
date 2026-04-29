import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
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

async function testMessages() {
  const recordId = "1Q1ua1rkJfTAuHDKIkeR_2026-04-27";
  const ref = doc(db, "registros_diarios", recordId);

  console.log("Enviando Mensagem 1...");
  await updateDoc(ref, {
    mensagensPais: arrayUnion({
      id: "test_" + Date.now(),
      texto: "Mensagem de Teste 1",
      horario: "10:00",
      lida: false
    })
  });

  console.log("Enviando Mensagem 2...");
  await updateDoc(ref, {
    mensagensPais: arrayUnion({
      id: "test_" + (Date.now() + 1),
      texto: "Mensagem de Teste 2",
      horario: "10:05",
      lida: false
    })
  });

  const snap = await getDoc(ref);
  const data = snap.data();
  console.log("Mensagens no banco:", data.mensagensPais);
  process.exit(0);
}

testMessages();
