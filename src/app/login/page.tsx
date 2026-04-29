"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithGoogle,
  signInWithEmail,
  resolveUserProfile,
} from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "no_profile") {
      setError("Seu email não foi encontrado no sistema da escola. Verifique se o cadastro está correto.");
    }
  }, []);

  // If already logged in, go to home
  if (user) {
    router.push("/");
    return null;
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await signInWithGoogle();
      if (!profile) {
        setError("Email não pré-cadastrado. Entre em contato com a escola.");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(`Erro do Google: ${err.message || "Falha ao conectar"}`);
      console.error("Google Login Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        // 1. Create account (Firebase will error if exists)
        const userCredential = await createUserWithEmailAndPassword(auth(), email, password);
        // 2. Resolve profile (this links UID if email matches a pre-registered one)
        const profile = await resolveUserProfile(userCredential.user);
        
        if (!profile) {
          setError("Sua conta foi criada, mas seu email não está na lista de alunos/professores da escola.");
        } else {
          router.push("/");
        }
      } else {
        // Login
        const profile = await signInWithEmail(email, password);
        if (!profile) {
          setError("Usuário não encontrado ou senha incorreta.");
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        // Se a pessoa tentar criar conta mas já existir, tentamos fazer o login automaticamente
        try {
          const profile = await signInWithEmail(email, password);
          if (!profile) {
            setError("O usuário existe, mas a senha que você digitou está incorreta.");
          } else {
            router.push("/");
          }
        } catch (loginErr: any) {
          setError("O e-mail já existe, mas a senha está incorreta. Verifique sua senha.");
        }
      } else if (err.code === "auth/weak-password") {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Senha incorreta. Verifique se digitou certinho.");
      } else {
        setError(`Erro do Firebase: ${err.message || "Erro desconhecido"}`);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF7ED] p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-[#FED7AA]">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="https://agenda-ottomatic.vercel.app/images/logo.png" 
              className="h-20 w-auto object-contain" 
              alt="Logo Planeta Colorido" 
              onError={(e) => {
                // Fallback if image not yet deployed
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="text-4xl">📓</span>';
                e.currentTarget.parentElement!.className = 'w-20 h-20 bg-[#F97316] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg';
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-[#431407]">Agenda Planeta Colorido</h1>
          <p className="text-[#9A3412]">Tudo o que acontece no dia do seu filho</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100 animate-shake">
            {error}
          </div>
        )}

        {!showEmailForm ? (
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#FED7AA] text-[#431407] font-semibold py-4 px-6 rounded-2xl hover:bg-[#FFF7ED] transition-all disabled:opacity-50 shadow-sm"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              {loading ? "Entrando..." : "Entrar com Google"}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#FED7AA]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-[#D97706]">ou</span>
              </div>
            </div>

            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full bg-[#FFF7ED] text-[#F97316] font-semibold py-4 px-6 rounded-2xl hover:bg-[#FED7AA] transition-all border border-[#FED7AA]"
            >
              Entrar com Email (Hotmail, etc)
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#431407] mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-[#FED7AA] focus:border-[#F97316] focus:outline-none bg-[#FFF7ED]/30"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#431407] mb-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-[#FED7AA] focus:border-[#F97316] focus:outline-none bg-[#FFF7ED]/30"
                placeholder="••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F97316] text-white font-bold py-4 px-6 rounded-2xl hover:bg-[#EA580C] transition-all shadow-lg shadow-orange-200 disabled:opacity-50"
            >
              {loading ? "Aguarde..." : isRegistering ? "Cadastrar Senha" : "Entrar"}
            </button>

            <div className="flex flex-col gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm text-[#F97316] hover:underline"
              >
                {isRegistering ? "Já tenho senha, quero entrar" : "Primeiro acesso? Cadastre sua senha"}
              </button>
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="text-sm text-[#9A3412] hover:underline"
              >
                Voltar
              </button>
            </div>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-[#D97706]">
          Acesso restrito a professores e responsáveis cadastrados.
        </p>
      </div>
    </div>
  );
}
