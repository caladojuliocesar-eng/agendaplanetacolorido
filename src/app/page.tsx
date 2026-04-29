"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/lib/auth";

export default function RootPage() {
  const { user, loading, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (profile) {
        if (profile.role === "admin") {
          router.push("/admin");
        } else if (profile.role === "professor") {
          router.push("/professor/dashboard");
        } else {
          router.push("/pais/agenda");
        }
      } else {
        // Authenticated but no Firestore profile found
        console.error("User authenticated but no profile found in Firestore.");
        // We sign out to prevent getting stuck in a semi-logged state
        signOut().then(() => {
          router.push("/login?error=no_profile");
        });
      }
    }
  }, [user, loading, profile, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF7ED]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97316]"></div>
        <p className="text-[#9A3412] font-medium animate-pulse">Carregando sua agenda...</p>
      </div>
    </div>
  );
}
