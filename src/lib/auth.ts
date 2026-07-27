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

// CPF Clean & Virtual Email helper functions
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

export function getVirtualEmailForCPF(cpf: string): string {
  const cleaned = cleanCPF(cpf);
  return `${cleaned}@planeta.com`;
}

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

// Sign in with CPF/Password
export async function signInWithCPF(
  cpf: string,
  password: string
): Promise<UserProfile | null> {
  const virtualEmail = getVirtualEmailForCPF(cpf);
  return await signInWithEmail(virtualEmail, password);
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
      const isCpf = (email: string | null | undefined, targetCpf: string) => {
        if (!email) return false;
        return email === `${targetCpf}@planeta.com`;
      };
      
      // Fallback - Usuários Demo (Agora no DB Oficial Limpo)
      if (cleanEmail === 'diretora@planeta.com' || isCpf(cleanEmail, '00000000001')) {
        return { uid: 'demo_diretora', email: 'diretora@planeta.com', cpf: '00000000001', role: 'admin', escolaId: 'planeta-colorido', nome: 'Helena (Diretora)' } as UserProfile;
      }
      if (cleanEmail === 'profe@planeta.com' || isCpf(cleanEmail, '00000000002')) {
        return { uid: 'demo_professora', email: 'profe@planeta.com', cpf: '00000000002', role: 'professor', escolaId: 'planeta-colorido', nome: 'Ana Cláudia (Profe)', turma: 'Berçário II' } as UserProfile;
      }
      if (cleanEmail === 'paiotto@planeta.com' || isCpf(cleanEmail, '00000000003')) {
        return { uid: 'demo_pai', email: 'paiotto@planeta.com', cpf: '00000000003', role: 'pai', escolaId: 'planeta-colorido', nome: 'Ricardo (Pai do Otto)', filhos: ['aluno_otto'] } as UserProfile;
      }
      if (cleanEmail === 'pailuna@planeta.com' || isCpf(cleanEmail, '00000000004')) {
        return { uid: 'demo_pai_luna', email: 'pailuna@planeta.com', cpf: '00000000004', role: 'pai', escolaId: 'planeta-colorido', nome: 'Responsável da Luna', filhos: ['aluno_luna'] } as UserProfile;
      }

      throw new Error(`Permissão negada pelo Firebase. Regras bloqueando ID: ${user.uid}`);
    }
    throw e;
  }

  if (docSnap.exists()) {
    return { uid: user.uid, ...docSnap.data() } as UserProfile;
  }

  // 2. First-time login: search by email/cpf and link UID
  let searchSnap;
  try {
    const isVirtualEmail = user.email && user.email.endsWith("@planeta.com") && /^\d+$/.test(user.email.split("@")[0]);
    let searchField = "email";
    let searchValue = user.email;

    if (isVirtualEmail && user.email) {
      searchField = "cpf";
      searchValue = user.email.split("@")[0];
    }

    const emailQuery = query(
      collection(db(), "usuarios"),
      where(searchField, "==", searchValue)
    );
    searchSnap = await getDocs(emailQuery);
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      throw new Error(`Permissão negada pelo Firebase. Regras de Segurança estão bloqueando a busca pelo identificador. UID: ${user.uid}`);
    }
    throw err;
  }

  if (!searchSnap.empty) {
    const existingDoc = searchSnap.docs[0];
    const profileData = existingDoc.data();

    // Create profile ensuring no "undefined" fields reach Firestore
    const newProfile: any = {
      uid: user.uid,
      nome: profileData.nome || user.displayName || "Usuário",
      email: profileData.email || (user.email?.endsWith("@planeta.com") ? "" : user.email || ""),
      cpf: profileData.cpf || (user.email?.endsWith("@planeta.com") ? user.email.split("@")[0] : ""),
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
