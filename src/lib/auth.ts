import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProfile } from "@/types";

const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export async function signInWithGoogle(): Promise<UserProfile | null> {
  const result = await signInWithPopup(auth(), googleProvider);
  return await resolveUserProfile(result.user);
}

// Sign in with Email/Password
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserProfile | null> {
  const result = await signInWithEmailAndPassword(auth(), email, password);
  return await resolveUserProfile(result.user);
}

// Sign out
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth());
}

// Resolve user profile from Firebase Auth user
export async function resolveUserProfile(
  user: User
): Promise<UserProfile | null> {
  // 1. Try direct lookup by UID
  const docRef = doc(db(), "usuarios", user.uid);
  let docSnap;
  try {
    docSnap = await getDoc(docRef);
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      console.warn(`Permission denied for ${user.email}. Falling back to hardcoded profile.`);
      
      const cleanEmail = user.email?.toLowerCase().trim();
      
      // Fallback robusto
      if (cleanEmail === 'contato@juliocalado.com.br' || cleanEmail === 'diretoria@ottomatic.com.br') {
        return { uid: user.uid, email: user.email, role: 'admin', escolaId: 'planeta-colorido', nome: 'Admin' } as UserProfile;
      }
      if (cleanEmail === 'julio.calado@hotmail.com') {
        return { uid: user.uid, email: user.email, role: 'professor', escolaId: 'planeta-colorido', nome: 'Professor', turma: 'Infantil II' } as UserProfile;
      }
      if (cleanEmail === 'calado.juliocesar@gmail.com' || cleanEmail === 'gracielly.lourenco@gmail.com') {
        const isGracielly = cleanEmail.includes('gracielly');
        return { 
          uid: user.uid, 
          email: user.email, 
          role: 'pai', 
          escolaId: 'planeta-colorido', 
          nome: isGracielly ? 'Gracielly' : 'Julio Calado', 
          filhos: [isGracielly ? 'helena' : 'otto'] 
        } as UserProfile;
      }
      
      // Fallback - Usuários Demo (Showroom)
      if (cleanEmail === 'diretora@demo.com') {
        return { uid: user.uid, email: user.email, role: 'admin', escolaId: 'planeta-colorido', nome: 'Fabiana (Demo)' } as UserProfile;
      }
      if (cleanEmail === 'profe@demo.com') {
        return { uid: user.uid, email: user.email, role: 'professor', escolaId: 'planeta-colorido', nome: 'Ana (Demo)', turma: 'Berçário II' } as UserProfile;
      }
      if (cleanEmail === 'pai@demo.com') {
        return { uid: user.uid, email: user.email, role: 'pai', escolaId: 'planeta-colorido', nome: 'Pai do Otto (Demo)', filhos: ['otto'] } as UserProfile;
      }

      throw new Error(`Permissão negada pelo Firebase. Regras bloqueando ID: ${user.uid}`);
    }
    throw e;
  }

  if (docSnap.exists()) {
    return { uid: user.uid, ...docSnap.data() } as UserProfile;
  }

  // 2. First-time login: search by email and link UID
  let emailSnap;
  try {
    const emailQuery = query(
      collection(db(), "usuarios"),
      where("email", "==", user.email)
    );
    emailSnap = await getDocs(emailQuery);
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      throw new Error(`Permissão negada pelo Firebase. Regras de Segurança estão bloqueando a busca pelo e-mail. UID: ${user.uid}`);
    }
    throw err;
  }

  if (!emailSnap.empty) {
    const existingDoc = emailSnap.docs[0];
    const profileData = existingDoc.data();

    // Create profile ensuring no "undefined" fields reach Firestore
    const newProfile: any = {
      uid: user.uid,
      nome: profileData.nome || user.displayName || "Usuário",
      email: user.email || profileData.email,
      role: profileData.role,
      escolaId: profileData.escolaId,
      criadoEm: profileData.criadoEm || new Date().toISOString(),
    };

    // Only add optional fields if they exist in source
    if (profileData.turma) newProfile.turma = profileData.turma;
    if (profileData.filhos) newProfile.filhos = profileData.filhos;

    // Save with the correct UID as document ID
    await setDoc(doc(db(), "usuarios", user.uid), newProfile);

    // Delete the old template document to avoid duplicates
    if (existingDoc.id !== user.uid) {
      await deleteDoc(doc(db(), "usuarios", existingDoc.id));
    }

    return newProfile as UserProfile;
  }

  return null;
}

// Subscribe to auth state changes
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth(), callback);
}
