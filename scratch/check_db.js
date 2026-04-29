const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
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

async function diagnostic() {
  console.log("--- INICIANDO DIAGNÓSTICO DE DADOS ---");
  
  try {
    const collections = ["escolas", "alunos", "usuarios"];
    for (const col of collections) {
      const snap = await getDocs(collection(db, col));
      console.log(`\n[${col.toUpperCase()}] Encontrados: ${snap.size}`);
      snap.forEach(d => {
        console.log(` - ID: ${d.id} | Data:`, JSON.stringify(d.data()));
      });
    }
  } catch (e) {
    console.error("ERRO:", e.message);
  }

  console.log("\n--- FIM DO DIAGNÓSTICO ---");
  process.exit(0);
}

diagnostic();
