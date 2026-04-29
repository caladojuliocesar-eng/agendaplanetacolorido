import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, updateDoc, setDoc } from "firebase/firestore";
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

async function smartMerge() {
  try {
    const snap = await getDocs(collection(db, "usuarios"));
    const groups = new Map();

    snap.forEach((d) => {
      const data = d.data();
      if (!data.email) return;
      const emailLower = data.email.toLowerCase().trim();
      
      if (!groups.has(emailLower)) {
        groups.set(emailLower, []);
      }
      groups.get(emailLower).push({ id: d.id, ...data });
    });

    for (const [email, docs] of groups.entries()) {
      if (docs.length > 1) {
        console.log(`\nMesclando duplicados para: ${email}`);
        
        // Find the best document to keep (VINCULADO if possible)
        let keepDoc = docs.find(d => d.uid === d.id) || docs[0];
        
        // Prepare merged data
        const mergedFilhos = new Set();
        let finalRole = keepDoc.role;
        let finalNome = keepDoc.nome;
        let finalEscola = keepDoc.escolaId;
        let finalTurma = keepDoc.turma;

        docs.forEach(d => {
          if (d.filhos) d.filhos.forEach(f => mergedFilhos.add(f));
          // If a duplicate has more info, use it
          if (!finalTurma && d.turma) finalTurma = d.turma;
          if (d.role === 'admin') finalRole = 'admin'; // Prioritize admin
        });

        const updateData = {
          email: email, // ensure lowercase
          nome: finalNome,
          role: finalRole,
          escolaId: finalEscola,
          filhos: Array.from(mergedFilhos),
        };
        if (finalTurma) updateData.turma = finalTurma;

        console.log(`  Mantendo DocID: ${keepDoc.id}`);
        console.log(`  Filhos mesclados: ${updateData.filhos.join(", ")}`);

        // Update the main doc
        await updateDoc(doc(db, "usuarios", keepDoc.id), updateData);

        // Delete others
        for (const d of docs) {
          if (d.id !== keepDoc.id) {
            console.log(`  Deletando DocID: ${d.id}`);
            await deleteDoc(doc(db, "usuarios", d.id));
          }
        }
      } else {
        // Just ensure lowercase even if no duplicate
        const d = docs[0];
        if (d.email !== email) {
          console.log(`Corrigindo caixa do email: ${d.email} -> ${email}`);
          await updateDoc(doc(db, "usuarios", d.id), { email: email });
        }
      }
    }

    console.log("\nProcesso concluído com sucesso.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

smartMerge();
