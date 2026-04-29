import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
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

async function auditUsers() {
  try {
    const snap = await getDocs(collection(db, "usuarios"));
    
    const emails = new Map();
    snap.forEach((d) => {
      const data = d.data();
      const email = data.email || "NO_EMAIL";
      
      if (!emails.has(email)) {
        emails.set(email, []);
      }
      emails.get(email).push({ 
        docId: d.id, 
        uid: data.uid,
        nome: data.nome,
        role: data.role,
        escolaId: data.escolaId,
        filhos: data.filhos,
        turma: data.turma
      });
    });

    console.log("--- RELATÓRIO DE AUDITORIA DE USUÁRIOS ---");
    for (const [email, docs] of emails.entries()) {
      console.log(`\nEmail: ${email}`);
      docs.forEach(d => {
        const isLinked = d.docId === d.uid;
        console.log(`  - DocID: ${d.docId} [${isLinked ? "VINCULADO" : "TEMPLATE"}]`);
        console.log(`    Nome: ${d.nome} | Role: ${d.role} | Escola: ${d.escolaId}`);
        if (d.filhos) console.log(`    Filhos: ${d.filhos.join(", ")}`);
        if (d.turma) console.log(`    Turma: ${d.turma}`);
      });
    }
    console.log("\n--- FIM DO RELATÓRIO ---");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

auditUsers();
