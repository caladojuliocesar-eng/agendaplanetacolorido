# 📋 Agenda Ottomatic — Roadmap & Backlog de Melhorias

Documento de registro de funcionalidades a testar, melhorias operacionais e novas features prioritárias para o desenvolvimento e evolução do sistema.

---

## 🧪 1. Funcionalidades a Testar

### 🎙️ Input por Voz da Professora
- **Objetivo:** Permitir que as professoras ditem observações pedagógicas e registros de rotina por voz durante a rotina na sala de aula.
- **Detalhamento:**
  - Testar uso da Web Speech API nativa e/ou transcrição por voz.
  - Converter áudio em texto formatado para alimentar os campos de observação rápida no tablet.
  - Fricção zero para o corpo docente durante os momentos com os alunos.

---

## 🛠️ 2. Melhorias Operacionais & Regras de Negócio

### 🔒 1. Trava de Edição em Cobranças Finalizadas
- **Problema:** O aplicativo atualmente permite editar cobranças mesmo após serem quitadas/finalizadas.
- **Ação:** Implementar regra de bloqueio (*read-only*) para cobranças com status `PAGA` ou `FINALIZADA`, permitindo edição apenas por perfil Administrador com registro de justificativa.

### 📅 2. Registro de Data de Pagamento & Recebimento de Comprovante
- **Objetivo:** Dar precisão ao fluxo de caixa e conciliação bancária da secretaria.
- **Ação:**
  - Adicionar campo `data_pagamento` (data real da transação no banco).
  - Adicionar campo `data_recebimento_comprovante` (data/hora em que a família enviou o comprovante no app).

### 💬 3. Gestão de Mensagens entre Coordenação e Pais
- **Objetivo:** Manter o canal de atendimento limpo e organizado.
- **Questão/Evolução:** Definir regra para encerramento de atendimentos.
  - *Opção Recomendada:* Botão "Arquivar Conversa Encerada" (mantém histórico seguro para auditoria, mas limpa a caixa de entrada ativa da coordenação).

### 🩺 4. Sistema de Alertas de Ficha Médica
- **Objetivo:** Destacar restrições de saúde críticas logo na abertura do perfil do aluno.
- **Ação:**
  - Badges em vermelho e alertas em topo de tela para **Alergias Graves**, **Medicamentos Contínuos** e **Condições Especiais** nas telas da professora e no Diário de Classe Oficial.

### 🔍 5. Validação Inteligente de Cadastro de Novos Alunos
- **Objetivo:** Evitar duplicidades e erros de digitação na ficha cadastral.
- **Ação:**
  - Checagem automática de dados de novos alunos contra cadastros pré-existentes (cruzamento por CPF do responsável, Data de Nascimento e Nome Completo).
  - Alertas para a secretaria caso detectada correspondência.

### 🏫 6. Definição de Permissões de Preenchimento do Cadastro de Alunos
- **Objetivo:** Estabelecer quais campos são estritamente administrativos vs editáveis pelas famílias.
- **Matriz de Permissões:**
  - *Apenas a Escola (Administrativo):* Turma, Matrícula, Status Financeiro, Histórico Escolar, Restrições Especiais.
  - *Editável pelas Famílias:* Foto do Aluno, Telefone de Contato, Pessoas Autorizadas para Retirada, Endereço de Correspondência.

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

#### 📊 4. Relatórios Financeiros Avançados
- Dashboard com DRE simplificado, taxa de inadimplência por turma, total arrecadado por mês e projeções de receita.

#### 📸 5. Módulo de Publicação de Fotos & Momentos
- Galeria de fotos das turmas com privacidade por perfil, marcação de alunos e download permitido apenas aos responsáveis autorizados.
