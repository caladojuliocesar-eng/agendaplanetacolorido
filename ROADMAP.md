# 📋 Agenda Ottomatic — Roadmap & Backlog de Melhorias

Documento de registro de funcionalidades a testar, melhorias operacionais e novas features prioritárias para o desenvolvimento e evolução do sistema.

---

## 🧪 1. Funcionalidades a Testar

### 🎙️ Input por Voz da Professora [CONCLUÍDO ✅]
- **Status:** Testado e Aprovado no Celular/Desktop.
- **Objetivo:** Permitir que as professoras ditem observações pedagógicas e registros de rotina por voz durante a rotina na sala de aula.
- **Detalhamento:**
  - Testar uso da Web Speech API nativa e/ou transcrição por voz.
  - Converter áudio em texto formatado para alimentar os campos de observação rápida no tablet.
  - Fricção zero para o corpo docente durante os momentos com os alunos.

---

## 🛠️ 2. Melhorias Operacionais & Regras de Negócio

### 🔒 1. Trava de Edição em Cobranças Finalizadas [CONCLUÍDO ✅]
- **Status:** Implementado. Cobranças com status `PAGO` possuem campos protegidos e aviso de segurança com opção de desbloqueio manual.
- **Ação:** Implementar regra de bloqueio (*read-only*) para cobranças com status `PAGA` ou `FINALIZADA`.

### 📅 2. Registro de Data de Pagamento & Recebimento de Comprovante [CONCLUÍDO ✅]
- **Status:** Implementado. Exibição de timestamps `dataPagamento` e `dataEnvioComprovante` nas telas Admin e Pais.
- **Ação:**
  - Adicionar campo `dataPagamento` (registrado na quitação).
  - Adicionar campo `dataEnvioComprovante` (registrado no upload do anexo pelos pais).

### 💬 3. Gestão de Mensagens entre Coordenação e Pais [CONCLUÍDO ✅]
- **Status:** Implementado. Abas "Ativas" e "Arquivadas" no painel da coordenação, botão "📦 Arquivar Atendimento" e reativação automática quando o pai envia uma nova mensagem.
- **Objetivo:** Manter o canal de atendimento limpo e organizado sem perder o histórico de auditoria.

### 🩺 4. Sistema de Alertas de Ficha Médica [CONCLUÍDO ✅]
- **Status:** Implementado. Filtro inteligente de alertas críticos (isenta permissões de febre SOS tipo Dipirona), alertas destacados para o corpo docente e suporte a **Medicamentos Temporários** com validade automática (início/fim) e receita anexa.
- **Ação:**
  - Badges e banners destacados para **Alergias Reais**, **Restrições Alimentares** e **Medicações Ativas no Dia** nas telas da professora, turmas e dashboard admin.

### 🔍 5. Validação Inteligente de Cadastro de Novos Alunos
- **Objetivo:** Evitar duplicidades e erros de digitação na ficha cadastral.
- **Ação:**
  - Checagem automática de dados de novos alunos contra cadastros pré-existentes (cruzamento por CPF do responsável, Data de Nascimento e Nome Completo).
  - Alertas para a secretaria caso detectada correspondência.

### 🏫 6. Definição de Permissões de Preenchimento do Cadastro de Alunos [CONCLUÍDO ✅]
- **Status:** Implementado. Aba "👤 Perfil" no app dos pais para alteração de foto, endereço e **Pessoas Autorizadas a Retirar o Aluno** com auditoria e **notificação automática para a coordenação** a cada alteração.
- **Matriz de Permissões:**
  - *Apenas a Escola (Administrativo):* Turma, Matrícula, Status Financeiro, Ficha Médica Crítica.
  - *Editável pelas Famílias:* Foto do Aluno, Pessoas Autorizadas para Retirada, Endereço de Correspondência.

---

## 🚀 3. Novas Funcionalidades (Novos Módulos)

### 🔴 Prioridade Alta (Desenvolvimento Imediato)

#### 🔑 1. Alterador de Primeira Senha (PRIORIDADE)
- **Objetivo:** Segurança e conformidade de acesso no primeiro login das famílias e professoras.
- **Detalhamento:**
  - Flag `primeiro_acesso = true` na tabela de usuários.
  - Redirecionamento forçado para a tela de criação de nova senha forte no primeiro acesso.

#### 🔄 2. Módulo de Renovação de Matrícula Digital (PRIORIDADE)
- **Objetivo:** Automatizar a rematrícula para o final do ano (Novembro/Dezembro).
- **Detalhamento:**
  - Fluxo de aceite do contrato de rematrícula no app dos pais.
  - Cobrança automática da taxa anual de material/agenda (R$ 120,00).
  - Atualização automática do status da matrícula para o ano letivo seguinte (2027).

#### 🔐 3. Controlador & Reset de Senha (PRIORIDADE)
- **Objetivo:** Dar autonomia e suporte rápido para recuperação de conta.
- **Detalhamento:**
  - Fluxo "Esqueci minha senha" via e-mail / WhatsApp.
  - Painel da Secretaria para reset manual instantâneo de senha de pais ou professoras em caso de bloqueio.

---

### 📦 Módulos Futuros (Próxima Fase)

#### 📊 4. Relatórios Financeiros Avançados [CONCLUÍDO ✅]
- **Status:** Implementado. Painel executivo ([/admin/financeiro/relatorio](file:///c:/OTTOMATIC%20HUB/03_LAB%20%28Testes%20&%20IA%20Studio%20Free%29/agenda-ottomatic/src/app/admin/financeiro/relatorio/page.tsx)) com KPIs de Receita Realizada vs Pendente vs Atrasada, agrupamento inteligente de receita por categorias (Mensalidades, Uniformes, Lanches, Horas Extra/Banho/Diárias) e cálculo automático de taxa de inadimplência por turma com botão de impressão/PDF.

#### 📸 5. Módulo de Publicação de Fotos & Momentos [CONCLUÍDO ✅]
- **Status:** Implementado. Painel da professora ([/professor/momentos](file:///c:/OTTOMATIC%20HUB/03_LAB%20%28Testes%20&%20IA%20Studio%20Free%29/agenda-ottomatic/src/app/professor/momentos/page.tsx)) para publicação de atividades/fotos com upload direto, feed interativo para as famílias ([/pais/momentos](file:///c:/OTTOMATIC%20HUB/03_LAB%20%28Testes%20&%20IA%20Studio%20Free%29/agenda-ottomatic/src/app/pais/momentos/page.tsx)) com reações ("❤️ Amei!") e download de imagens HD.
