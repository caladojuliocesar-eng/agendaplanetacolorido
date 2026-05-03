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
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter text-[#F97316] leading-none">OTTOMATIC</span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Showroom Planeta Colorido</span>
          </div>
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
      <header className="max-w-5xl mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-[#FFF7ED] text-[#F97316] text-sm font-bold mb-6 animate-bounce">
          ✨ Oi, Fabiana! Dá uma olhada no que preparei.
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight max-w-4xl">
          Transformei nossa <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] to-[#EA580C]">
            agenda de papel nisso aqui.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          O plano original era digitalizar a agenda, mas aproveitei para inserir 
          um controle financeiro completo e uma visão administrativa geral para facilitar sua vida.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="#acesso" 
            className="w-full sm:w-auto px-10 py-5 bg-[#F97316] text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-200 hover:scale-105 active:scale-95 transition-all"
          >
            Testar Sistema Agora
          </Link>
          <Link 
            href="#evolucao" 
            className="w-full sm:w-auto px-10 py-5 bg-white text-gray-700 border-2 border-gray-100 rounded-2xl font-bold text-lg hover:border-[#F97316] transition-all"
          >
            Ver a Evolução
          </Link>
        </div>
      </header>

      {/* Evolution Section */}
      <section id="evolucao" className="max-w-6xl mx-auto px-6 py-24 border-t border-gray-50">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-100 to-rose-100 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white">
              <img 
                src="/images/agenda-evolution.png" 
                alt="Do papel ao digital"
                className="w-full h-auto transform group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-black mb-6 leading-tight">
              Adeus papelada, <br />
              <span className="text-orange-500 text-3xl">olá gestão inteligente.</span>
            </h2>
            <div className="space-y-6 text-gray-600 leading-relaxed">
              <p>
                Sabe aquela correria de conferir agenda por agenda? Agora as professoras 
                registram tudo em segundos.
              </p>
              <div className="p-6 bg-orange-50 rounded-2xl border-l-4 border-orange-500">
                <p className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                  <span>📶</span> Segurança de Sinal
                </p>
                <p className="text-orange-800/80 text-sm">
                  O sinal caiu na sala? Sem problemas. As professoras continuam preenchendo 
                  normalmente e o app sincroniza tudo automaticamente assim que a internet voltar. 
                  Resiliência total para o dia a dia.
                </p>
              </div>
              <p>
                E para você, Fabiana, o app já gera o financeiro direto do Mural e da Agenda. 
                Tudo centralizado em um só lugar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6 text-center mb-16">
          <h2 className="text-3xl font-black mb-4">O que eu inseri de novo:</h2>
          <p className="text-gray-500">Recursos que vão além da simples comunicação.</p>
        </div>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">💰</div>
              <h3 className="text-xl font-bold mb-4 text-[#F97316]">Financeiro Agilizado</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                Controle de mensalidades, taxas de materiais e eventos tudo integrado. Menos planilhas, mais precisão.
              </p>
            </div>
            <div className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">📊</div>
              <h3 className="text-xl font-bold mb-4 text-[#F97316]">Visão ADM Geral</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                Monitoramento de salas em tempo real e avisos de faltas. Você no controle de tudo o que acontece.
              </p>
            </div>
            <div className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">📱</div>
              <h3 className="text-xl font-bold mb-4 text-[#F97316]">UX Premium</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                Interface pensada para ser rápida. Menos toques para registrar a rotina e mais tempo para educar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Showroom Access Section */}
      <section id="acesso" className="max-w-5xl mx-auto px-6 py-32 text-center">
        <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-8">Espaço do Teste</h2>
            <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
              Criei três perfis para você ver como cada um interage com o sistema. 
              Pode testar à vontade:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl group hover:bg-white/10 transition-colors">
                <span className="block text-3xl mb-4 group-hover:animate-bounce">👩‍💼</span>
                <span className="block text-xs uppercase tracking-widest text-orange-400 font-bold mb-2">Visão da Fabiana</span>
                <code className="block text-sm bg-black/30 p-2 rounded mb-2">diretora@demo.com</code>
                <p className="text-xs text-slate-500">Veja o financeiro e o mural adm</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl group hover:bg-white/10 transition-colors">
                <span className="block text-3xl mb-4 group-hover:animate-bounce">👩‍🏫</span>
                <span className="block text-xs uppercase tracking-widest text-orange-400 font-bold mb-2">Visão Professora</span>
                <code className="block text-sm bg-black/30 p-2 rounded mb-2">profe@demo.com</code>
                <p className="text-xs text-slate-500">Veja a facilidade do preenchimento</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl group hover:bg-white/10 transition-colors">
                <span className="block text-3xl mb-4 group-hover:animate-bounce">🧔</span>
                <span className="block text-xs uppercase tracking-widest text-orange-400 font-bold mb-2">Visão dos Pais</span>
                <code className="block text-sm bg-black/30 p-2 rounded mb-2">pai@demo.com</code>
                <p className="text-xs text-slate-500">Como os pais recebem a agenda</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Link 
                href="/login" 
                target="_blank"
                className="inline-flex items-center gap-2 px-12 py-5 bg-[#F97316] text-white rounded-full font-black text-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-900/20"
              >
                Acessar Demonstração (Nova Aba) 🚀
              </Link>
              <p className="text-slate-400 text-sm">Use a senha <b className="text-white">demo123</b> para todos.</p>
            </div>
          </div>
          
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} Ottomatic AI • Projeto Planeta Colorido</p>
      </footer>
    </div>
  );
}
