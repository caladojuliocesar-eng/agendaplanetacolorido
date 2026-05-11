import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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

async function testLogin() {
  try {
    console.log("Logging in...");
    const cred = await signInWithEmailAndPassword(auth, "diretora@demo.com", "demo123");
    console.log("Login successful! UID:", cred.user.uid);

    console.log("Fetching user profile...");
    const userDoc = await getDoc(doc(db, "usuarios", cred.user.uid));
    if (userDoc.exists()) {
      console.log("Profile data:", userDoc.data());
    } else {
      console.log("Profile not found in Firestore!");
    }
  } catch (err) {
    console.error("Test failed:", err);
  }
  process.exit(0);
}

testLogin();
