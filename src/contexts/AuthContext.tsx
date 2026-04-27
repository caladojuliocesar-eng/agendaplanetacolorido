"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "firebase/auth";
import { UserProfile } from "@/types";
import { onAuthChange, resolveUserProfile, signOut } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  unauthorized: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  unauthorized: false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setUnauthorized(false);

      if (firebaseUser) {
        try {
          const userProfile = await resolveUserProfile(firebaseUser);
          if (userProfile) {
            setProfile(userProfile);
            setUnauthorized(false);
          } else {
            setProfile(null);
            setUnauthorized(true);
          }
        } catch (error) {
          console.error("Error resolving user profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut();
    setProfile(null);
    setUnauthorized(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, unauthorized, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
