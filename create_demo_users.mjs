import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();
const db = getFirestore();

const demoUsers = [
  { email: "diretora@demo.com", password: "demo123", role: "admin", nome: "Fabiana Demo", escolaId: "escola-demo" },
  { email: "profe@demo.com", password: "demo123", role: "professora", nome: "Profe Demo", escolaId: "escola-demo", turma: "Berçário II" },
  { email: "pai@demo.com", password: "demo123", role: "pai", nome: "Pai Demo", escolaId: "escola-demo", filhos: ["otto"] },
];

async function createDemoUsers() {
  for (const user of demoUsers) {
    let uid;
    try {
      const userRecord = await auth.getUserByEmail(user.email);
      uid = userRecord.uid;
      console.log(`User ${user.email} already exists in Auth. UID: ${uid}. Updating password.`);
      await auth.updateUser(uid, { password: user.password });
    } catch (e) {
      if (e.code === "auth/user-not-found") {
        console.log(`Creating user ${user.email} in Auth...`);
        const userRecord = await auth.createUser({
          email: user.email,
          password: user.password,
          displayName: user.nome,
        });
        uid = userRecord.uid;
      } else {
        throw e;
      }
    }

    // Now, FORCE the document in Firestore to have the exact UID!
    const docRef = db.collection("usuarios").doc(uid);
    await docRef.set({
      nome: user.nome,
      email: user.email,
      role: user.role,
      escolaId: user.escolaId,
      turma: user.turma || null,
      filhos: user.filhos || null,
      criadoEm: new Date().toISOString(),
    }, { merge: true });
    console.log(`Set Firestore document for ${user.email} with ID: ${uid}`);
    
    // Cleanup any duplicates (where document ID is NOT the uid but has the same email)
    const snapshot = await db.collection("usuarios").where("email", "==", user.email).get();
    for (const doc of snapshot.docs) {
      if (doc.id !== uid) {
        console.log(`Deleting duplicate document for ${user.email} with ID: ${doc.id}`);
        await doc.ref.delete();
      }
    }
  }
  console.log("Demo users setup completed!");
  process.exit(0);
}

createDemoUsers().catch(console.error);
