"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  signInWithGoogle,
  signInWithCPF,
  getVirtualEmailForCPF,
  resolveUserProfile,
} from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

function LoginContent() {
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCpfForm, setShowCpfForm] = useState(false);

  const router = useRouter();
  const { user } = useAuth();

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get("error") === "no_profile") {
      setError("Seu CPF não foi pré-cadastrado ou o Firebase bloqueou a busca. O login falhou.");
    }
  }, [searchParams]);

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
        setError("Email do Google não pré-cadastrado na escola. Entre em contato com a administração.");
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

  const formatCPF = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
  };

  const handleCpfAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const clean = cpf.replace(/\D/g, "");
    if (clean.length !== 11) {
      setError("Por favor, digite um CPF válido com 11 dígitos.");
      setLoading(false);
      return;
    }

    const virtualEmail = getVirtualEmailForCPF(clean);

    try {
      if (isRegistering) {
        // 1. Create account (Firebase will error if exists)
        const userCredential = await createUserWithEmailAndPassword(auth(), virtualEmail, password);
        // 2. Resolve profile (this links UID if CPF matches a pre-registered one)
        const profile = await resolveUserProfile(userCredential.user);
        
        if (!profile) {
          setError("Sua conta foi criada, mas seu CPF não foi encontrado no pré-cadastro da escola.");
        } else {
          router.push("/");
        }
      } else {
        // Login
        const profile = await signInWithCPF(clean, password);
        if (!profile) {
          setError("CPF não cadastrado ou senha incorreta.");
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        // Se a pessoa tentar criar conta mas já existir, tentamos fazer o login automaticamente
        try {
          const profile = await signInWithCPF(clean, password);
          if (!profile) {
            setError("Este CPF já possui cadastro, mas a senha digitada está incorreta.");
          } else {
            router.push("/");
          }
        } catch (loginErr: any) {
          setError("Este CPF já possui cadastro, mas a senha está incorreta. Verifique sua senha.");
        }
      } else if (err.code === "auth/weak-password") {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Senha incorreta. Verifique se digitou certinho.");
      } else if (err.code === "auth/user-not-found") {
        setError("CPF não cadastrado. Solicite o cadastro à diretoria da escola.");
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
                e.currentTarget.style.display = 'none';
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

        {!showCpfForm ? (
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
              onClick={() => setShowCpfForm(true)}
              className="w-full bg-[#FFF7ED] text-[#F97316] font-semibold py-4 px-6 rounded-2xl hover:bg-[#FED7AA] transition-all border border-[#FED7AA]"
            >
              Entrar com CPF e Senha
            </button>
          </div>
        ) : (
          <form onSubmit={handleCpfAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#431407] mb-1">CPF</label>
              <input
                type="text"
                required
                maxLength={14}
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                className="w-full p-4 rounded-2xl border-2 border-[#FED7AA] focus:border-[#F97316] focus:outline-none bg-[#FFF7ED]/30"
                placeholder="000.000.000-00"
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
                onClick={() => setShowCpfForm(false)}
                className="text-sm text-[#9A3412] hover:underline"
              >
                Voltar
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-center text-xs text-[#D97706]">
            Acesso restrito a professores e responsáveis cadastrados.
          </p>
          <a 
            href="/showroom" 
            className="text-[10px] text-gray-300 hover:text-[#F97316] transition-colors"
          >
            Apresentação Institucional
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FFF7ED]">
        <div className="spinner"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
