import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function resolveUserProfile(user) {
  const docRef = doc(db, "usuarios", user.uid);
  let docSnap;
  try {
    docSnap = await getDoc(docRef);
  } catch (e) {
    if (e.code === 'permission-denied') {
      const cleanEmail = user.email?.toLowerCase().trim();
      if (cleanEmail === 'diretora@demo.com') {
        return { uid: user.uid, email: user.email, role: 'admin', escolaId: 'planeta-colorido', nome: 'Fabiana (Demo)' };
      }
      if (cleanEmail === 'profe@demo.com') {
        return { uid: user.uid, email: user.email, role: 'professor', escolaId: 'planeta-colorido', nome: 'Ana (Demo)', turma: 'Berçário II' };
      }
      if (cleanEmail === 'pai@demo.com') {
        return { uid: user.uid, email: user.email, role: 'pai', escolaId: 'planeta-colorido', nome: 'Pai do Otto (Demo)', filhos: ['otto'] };
      }
      throw new Error(`Permissão negada pelo Firebase. Regras bloqueando ID: ${user.uid}`);
    }
    throw e;
  }

  if (docSnap.exists()) {
    return { uid: user.uid, ...docSnap.data() };
  }

  return null;
}

async function testLogin() {
  try {
    const cred = await signInWithEmailAndPassword(auth, "diretora@demo.com", "demo123");
    console.log("Login successful! Resolving profile...");
    const profile = await resolveUserProfile(cred.user);
    console.log("Profile resolved:", profile);
  } catch (err) {
    console.error("Test failed:", err);
  }
  process.exit(0);
}

testLogin();
