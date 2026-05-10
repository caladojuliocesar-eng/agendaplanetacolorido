# 🧭 Roadmap — O Tripé do Ottomatic

> Sessão: 06/05/2026 — Julio & Antigravity

---

## 🏛️ Visão Estratégica

O Ottomatic se sustenta em três pilares (o "Tripé"):

| # | Pilar | Status | Descrição |
|:-:|:------|:------:|:----------|
| 1 | 🟢 **Agenda Digital** | ✅ Em produção | O coração do app. Professoras registram rotina, pais recebem em tempo real. Offline-first. |
| 2 | 🔵 **Inteligência Pedagógica** | 🟡 Protótipo no Showroom | Transformar registros diários em relatórios trimestrais com IA. |
| 3 | 🟠 **Finanças Lite** | 📋 Conceitual | Cobranças Escola→Pais (parcial) + Controle interno de despesas (novo). |

**Filosofia:** Nada de competir com super apps (Diário Escola) ou ERPs (Sponte/Totvs). Foco em simplicidade, segurança e mínima fricção para a professora.

---

## ✅ O que fizemos nesta sessão

### 1. Deliberação Estratégica
- Analisamos as funcionalidades do **Diário Escola** como referência.
- Definimos o Tripé e decidimos **não** ser um ERP.
- Priorizamos o pilar **Pedagógico** antes do Financeiro.

### 2. Seed de Dados Pedagógicos
- Criamos o script `scripts/seed-pedagogico.mjs` (Admin SDK).
- Populamos **108 logs pedagógicos** simulados para o aluno **Otto** no Firestore.
- Coleção: `logs_pedagogicos` — **100% isolada** do app em produção.
- Período coberto: **05/Fev → 29/Abr** (1 trimestre, 60 dias letivos).
- Distribuição: 60% positivo, 25% neutro, 15% pontos de atenção.
- Cobertura dos **10 pilares** da Planeta Colorido.

### 3. Dashboard Pedagógico (Showroom)
- Nova página: `/showroom/pedagogico`
- API route: `/api/pedagogico` (Admin SDK — bypassa regras do Firestore)
- Interface com:
  - 4 Stat Cards (Score Global, Total de Observações, Positivos, Atenções)
  - Barras de progresso por pilar com score percentual
  - Seção de Destaques e Recomendações
  - Linha do Tempo completa com todas as 108 observações
  - CTA "Relatório com IA" (botão desabilitado — futuro)
- Link adicionado na landing do Showroom (card "Inteligência Pedagógica").

### 4. Segurança
- `service-account.json` adicionado ao `.gitignore`.
- Env vars do Admin SDK adicionadas ao `.env.local`.

---

## 📋 O que falta / Próximos passos

### Pilar Pedagógico (Próxima Sessão)
- [x] **Gerar Relatório com Gemini:** Integrar a API do Gemini para ler os 108 logs e produzir um relatório trimestral em prosa, respeitando os 10 pilares. Botão "Gerar Relatório" no dashboard.
- [x] **Workflow de Revisão:** Professora revisa → Coordenação aprova → Libera para os pais em PDF (Documento Oficial A4).
- [x] **Tela da Professora (Notas Rápidas):** Simulador de registro com classificação automática via IA. Fricção zero para a professora.
- [ ] **Validação com Fabiana:** Mostrar o dashboard do Showroom e colher feedback sobre pilares, tom de voz e formato do relatório.

### Pilar Financeiro (Futuro)
- [ ] **Módulo de Despesas:** Tela simples no Admin para lançar despesas fixas/variáveis.
- [ ] **Dashboard de Lucratividade:** Cruzar receita (mensalidades pagas) com despesas.
- [ ] **Categorização por Centro de Custo:** Pedagógico vs. Administrativo vs. Manutenção.

### Infraestrutura
- [ ] **Variáveis de Ambiente (Vercel):** Adicionar `GEMINI_API_KEY`, `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY` no painel da Vercel para que a geração de relatórios via IA funcione em produção.
- [ ] **Revogar chave do service-account.json** no Firebase Console (foi compartilhada em texto aberto).
- [ ] **Regras do Firestore:** Avaliar se `logs_pedagogicos` precisa de regra de leitura para professores autenticados (quando sair do Showroom para produção).
- [ ] **Path do projeto:** O diretório com parênteses e acentos (`03_LAB (Testes & IA Studio Free)`) impede `npx`/`npm run dev` de funcionar normalmente. Funciona com `node "node_modules/next/dist/bin/next" dev`.

---

## 📁 Arquivos criados/modificados

| Arquivo | Ação |
|:--------|:-----|
| `scripts/seed-pedagogico.mjs` | Novo — seed de dados pedagógicos |
| `src/app/showroom/pedagogico/page.tsx` | Novo — dashboard pedagógico |
| `src/app/api/pedagogico/route.ts` | Novo — API server-side (Admin SDK) |
| `src/lib/firestore.ts` | Modificado — +interface `LogPedagogico` e +função `getLogsPedagogicos` |
| `src/app/showroom/page.tsx` | Modificado — card "Inteligência Pedagógica" com link |
| `.gitignore` | Modificado — adicionado `service-account.json` |
| `.env.local` | Modificado — adicionado `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY` |
| `ROADMAP_TRIPE.md` | Novo — este arquivo |

---

*"O segredo não é ter todas as funções, é ter as mais importantes com a melhor experiência."*
