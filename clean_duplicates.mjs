import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
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

async function cleanDuplicates() {
  try {
    const snap = await getDocs(collection(db, "usuarios"));
    
    // Group by email
    const emails = new Map();
    snap.forEach((d) => {
      const data = d.data();
      if (!data.email) return;
      
      if (!emails.has(data.email)) {
        emails.set(data.email, []);
      }
      emails.get(data.email).push({ id: d.id, ...data });
    });

    // Find duplicates
    for (const [email, docsList] of emails.entries()) {
      if (docsList.length > 1) {
        console.log(`E-mail duplicado encontrado: ${email} (${docsList.length} docs)`);
        
        // Mantém o doc que tiver o uid = id (se houver) ou o primeiro com uid
        let keepDoc = docsList.find((d) => d.uid === d.id);
        if (!keepDoc) {
           keepDoc = docsList.find((d) => d.uid) || docsList[0];
        }

        console.log(`Mantendo documento: ${keepDoc.id}`);

        for (const d of docsList) {
          if (d.id !== keepDoc.id) {
            console.log(`Deletando documento duplicado: ${d.id}`);
            await deleteDoc(doc(db, "usuarios", d.id));
          }
        }
      }
    }
    console.log("Limpeza concluída.");
  } catch (err) {
    console.error(err);
  }
}

cleanDuplicates();
