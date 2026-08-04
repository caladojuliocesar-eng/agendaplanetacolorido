# 📋 Agenda Ottomatic — Roadmap, Conclusões & Registro de Intenções

Documento oficial de registro de funcionalidades concluídas, melhorias operacionais e intenções estratégicas da **OttoMatic Tech Labs**.

---

## 🎯 1. Entregas Recentes & Concluídas [AGOSTO 2026]

### 🚀 1. Isolamento da Página de Apresentação Executiva [CONCLUÍDO ✅]
- **Status:** Implementado e publicado na rota `/apresentacao-edtech` (e `/apresentacao`).
- **Detalhamento:** 
  - Página pública isolada de alta performance, sem dependência de autenticação ou login do Firebase.
  - Preservação integral do conteúdo executivo, comparativo financeiro e cronograma de implantação.
  - Posicionamento institucional sob a marca **OttoMatic Tech Labs** (*Smart Tech Solutions*).

### 📱 2. Otimização de Metadados para WhatsApp & Social Sharing [CONCLUÍDO ✅]
- **Status:** Implementado.
- **Detalhamento:** 
  - Adicionadas Meta Tags e OpenGraph (OG) customizados na rota `/apresentacao-edtech`.
  - Exibição de card rico no WhatsApp com título profissional, descrição da plataforma e assinatura da marca **OttoMatic Tech Labs**.

### 🩺 3. Alertas de Ficha Médica & Medicamentos Temporários [CONCLUÍDO ✅]
- **Status:** Implementado.
- **Detalhamento:** Badges visuais destacados para alergias, restrições alimentares e medicamentos temporários ativos com data de início/fim nas telas dos professores e coordenação.

### 📸 4. Módulo de Momentos & Fotos HD [CONCLUÍDO ✅]
- **Status:** Implementado. Feed interativo de publicação de fotos das atividades pedagógicas com download HD para as famílias e reações em tempo real.

---

## 🔮 2. Registro de Intenções Estratégicas (Próximos Passos)

### 🌐 Intenção A: Publicação da Landing Page Genérica no Site Principal
- **Objetivo:** Transformar a apresentação do app em um produto de prateleira genérico (SaaS Showcase) integrado ao site oficial da empresa.
- **Ações Registradas:**
  - Desvincular nomes de escolas específicas e criar uma versão genérica para demonstração no site `ottomatic.com.br/edtech`.
  - Incluir botões de chamada de ação passiva (*"Solicitar Demonstração"*, *"Calcular Economia"* e *"Falar via WhatsApp"*).

### 🔌 Intenção B: Apontamento de Subdomínio na Hostinger (CNAME Vercel)
- **Objetivo:** Conectar o subdomínio comercial `edtech.ottomatic.com.br` mantendo o site principal da Hostinger 100% intacto.
- **Ações Registradas:**
  - Configurar entrada CNAME `edtech` na Hostinger apontando para `cname.vercel-dns.com`.
  - Vincular o subdomínio nas configurações da Vercel para gerar o certificado SSL HTTPS automático.

### 🏢 Intenção C: Expansão Multi-tenant & Reutilização de Arquitetura
- **Objetivo:** Manter a base de código modularizada para licenciamento direto ou reaproveitamento de componentes em novos projetos da **OttoMatic Tech Labs**.
- **Ações Registradas:**
  - Reaproveitar o motor de Inteligência Pedagógica (Estrelinha ⭐) para outros segmentos de relatórios automatizados (ex: clínicas, diagnósticos, consultoria).

---

## 🛠️ 3. Backlog Técnico & Regras de Negócio Reservadas

### 🔑 1. Alterador de Primeira Senha
- Flag `primeiro_acesso = true` com redirecionamento forçado no primeiro login das famílias e professoras.

### 🔄 2. Módulo de Rematrícula Digital Automatizada
- Fluxo de aceite contratual de rematrícula no app dos pais com cobrança da taxa anual integrada.

### 🔐 3. Central de Reset de Senha via WhatsApp/E-mail
- Painel de autonomia para a secretaria realizar o reset manual instantâneo de contas bloqueadas.
