"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ShowroomLanding() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] selection:bg-[#F97316] selection:text-white overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#FFF7ED] rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-[#FFF7ED] rounded-full blur-3xl opacity-60"></div>
      </div>

      {/* Navbar */}
      <nav className="max-w-6xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🤖</span>
          <span className="text-2xl font-black tracking-tighter text-[#F97316]">OTTOMATIC</span>
        </div>
        <Link 
          href="/login" 
          target="_blank"
          className="px-6 py-2.5 rounded-full border-2 border-[#F97316] text-[#F97316] font-bold hover:bg-[#F97316] hover:text-white transition-all duration-300"
        >
          Entrar no Sistema
        </Link>
      </nav>

      {/* Hero Section */}
      <header className="max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-[#FFF7ED] text-[#F97316] text-sm font-bold mb-6 animate-bounce">
          ✨ Apresentação Exclusiva: Escola Modelo
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
          A comunicação escolar <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] to-[#EA580C]">
            agora é Automática.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Unimos Inteligência Artificial e simplicidade para conectar pais e escola. 
          Economize tempo das professoras e encante as famílias.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/login" 
            target="_blank"
            className="w-full sm:w-auto px-10 py-5 bg-[#F97316] text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-200 hover:scale-105 active:scale-95 transition-all"
          >
            Começar Agora
          </Link>
          <Link 
            href="#acesso" 
            className="w-full sm:w-auto px-10 py-5 bg-white text-gray-700 border-2 border-gray-100 rounded-2xl font-bold text-lg hover:border-[#F97316] transition-all"
          >
            Ver Demonstração
          </Link>
        </div>
      </header>

      {/* Features Grid */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-6">🏫</div>
              <h3 className="text-xl font-bold mb-4">Para Diretores</h3>
              <p className="text-gray-500 leading-relaxed">
                Gestão financeira integrada, mural de avisos e monitoramento de salas em tempo real.
              </p>
            </div>
            <div className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-6">👩‍🏫</div>
              <h3 className="text-xl font-bold mb-4">Para Professores</h3>
              <p className="text-gray-500 leading-relaxed">
                Registro de rotina simplificado e comunicação eficiente. Menos papel e mais tempo com os alunos.
              </p>
            </div>
            <div className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-6">❤️</div>
              <h3 className="text-xl font-bold mb-4">Para os Pais</h3>
              <p className="text-gray-500 leading-relaxed">
                Acompanhamento diário da rotina, avisos de falta e mensagens diretas com a coordenação.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Showroom Access Section */}
      <section id="acesso" className="max-w-5xl mx-auto px-6 py-32 text-center">
        <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-8">Escola Modelo</h2>
            <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
              Explore o sistema com dados reais de demonstração. Escolha um dos perfis abaixo para testar:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
                <span className="block text-3xl mb-4">👩‍💼</span>
                <span className="block text-xs uppercase tracking-widest text-orange-400 font-bold mb-2">Diretora</span>
                <code className="block text-sm bg-black/30 p-2 rounded mb-2">diretora@demo.com</code>
                <p className="text-xs text-slate-500">Visão administrativa e financeira</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
                <span className="block text-3xl mb-4">👩‍🏫</span>
                <span className="block text-xs uppercase tracking-widest text-orange-400 font-bold mb-2">Professora</span>
                <code className="block text-sm bg-black/30 p-2 rounded mb-2">profe@demo.com</code>
                <p className="text-xs text-slate-500">Registro de rotina diária</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
                <span className="block text-3xl mb-4">🧔</span>
                <span className="block text-xs uppercase tracking-widest text-orange-400 font-bold mb-2">Pai</span>
                <code className="block text-sm bg-black/30 p-2 rounded mb-2">pai@demo.com</code>
                <p className="text-xs text-slate-500">Agenda e recados do aluno Otto</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Link 
                href="/login" 
                target="_blank"
                className="inline-flex items-center gap-2 px-12 py-5 bg-[#F97316] text-white rounded-full font-black text-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-900/20"
              >
                Acessar Sistema (Nova Aba) 🚀
              </Link>
              <p className="text-slate-400 text-sm">Use a senha <b className="text-white">demo123</b> para todos os perfis.</p>
            </div>
          </div>
          
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} Ottomatic AI. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
