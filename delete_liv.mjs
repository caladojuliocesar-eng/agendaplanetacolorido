import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, deleteDoc, doc, updateDoc, arrayRemove } from "firebase/firestore";
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

async function findAndDeleteLiv() {
  try {
    const alunosRef = collection(db, "alunos");
    const snap = await getDocs(alunosRef);
    
    let livToDelete = null;

    snap.forEach((d) => {
      const data = d.data();
      if (data.nome && data.nome.toLowerCase().includes("liv")) {
        console.log(`Encontrado: ${data.nome} | Turma: ${data.turma} | ID: ${d.id}`);
        if (data.turma === "Infantil I") {
          livToDelete = { id: d.id, ...data };
        }
      }
    });

    if (livToDelete) {
      console.log(`\nDeletando Liv do Infantil I (ID: ${livToDelete.id})...`);
      
      // 1. Delete student doc
      await deleteDoc(doc(db, "alunos", livToDelete.id));
      console.log("Documento do aluno deletado.");

      // 2. Remove from parents' filhos array
      const usuariosRef = collection(db, "usuarios");
      const parentsSnap = await getDocs(query(usuariosRef, where("filhos", "array-contains", livToDelete.id)));
      
      for (const p of parentsSnap.docs) {
        console.log(`Removendo vínculo do pai/mãe: ${p.data().nome} (${p.data().email})`);
        await updateDoc(doc(db, "usuarios", p.id), {
          filhos: arrayRemove(livToDelete.id)
        });
      }

      console.log("Sucesso!");
    } else {
      console.log("\nNenhuma 'Liv' encontrada na turma 'Infantil I'.");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findAndDeleteLiv();
