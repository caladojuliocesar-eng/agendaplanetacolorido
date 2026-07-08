# Estratégia de Negócio - Agenda Planeta Colorido

## 🎯 Visão do Produto
- **Conceito**: "Boutique Digital" - Uma ferramenta premium, simples e humana para escolas pequenas/médias.
- **Diferencial**: "Menos é Mais". Foco na redução de fricção administrativa (Financeiro) e excelência na comunicação (Agenda/Mural), sem perder o toque pessoal.

## 💰 Modelo de Receita Sugerido
- **Taxa de Agenda Digital**: R$ 80,00 por aluno / ano (Substituindo a agenda de papel de R$ 120,00).
- **Divisão**: 50% Escola / 50% Desenvolvedor (R$ 40,00 para cada por aluno/ano).
- **Valor para a Escola**: Software de gestão gratuito + lucro direto sobre a taxa.

## 📅 Cronograma de Implantação 2026/2027 (Nova Estratégia de Adoção)

### Fase 1: Conexão e Encantamento (Agosto 2026 - Pós Férias)
- **Foco**: Professoras e Pais (Adoção inicial).
- **Uso**: Agenda Digital (Rotina diária) + Mural de Avisos.
- **Objetivo**: Eliminar a agenda física de papel, engajar 100% dos pais no uso diário do aplicativo e consolidar a confiança na ferramenta sem barreiras transacionais.

### Fase 2: Inteligência Pedagógica (Outubro/Novembro 2026 - Fim de Período)
- **Foco**: Professoras e Coordenação.
- **Uso**: Relatório Trimestral Inteligente com IA (Gemini).
- **Objetivo**: Economizar semanas de trabalho da equipe gerando relatórios de desenvolvimento individuais a partir dos registros diários da agenda. Demonstração explícita de valor e tempo poupado.

### Fase 3: Conveniência e Gestão Administrativa (Matrículas / Início de 2027)
- **Foco**: Diretoria/Administração (Dona da Escola) e Pais.
- **Uso**: Módulo Financeiro Lite (Cobranças/Mensalidades, envio de PIX/Boleto, controle de comprovantes).
- **Objetivo**: Centralizar cobranças e conciliação de comprovantes no canal de comunicação oficial da escola, quando a base de dados já está madura e o app já faz parte do dia a dia da comunidade.

## 💡 Próximas Deliberações Técnicas
- **Share Target**: Permitir que o pai compartilhe o comprovante direto do app do banco para a Agenda.
- **Gestão de Comprovantes**: Melhorar o fluxo de "Check" do Admin para conciliação rápida.
- **Notificações**: Alertas inteligentes para boletos vencendo.

---

## 🤖 Inteligência Pedagógica (Estratégia de IA)

O grande diferencial competitivo e principal argumento de venda do Ottomatic é o módulo pedagógico suportado por inteligência artificial (Gemini). Definimos as seguintes diretrizes para o comportamento e evolução desta funcionalidade:

### 1. Integridade do Relatório Enviado (Comportamento de "Foto")
- **Isolamento de Alterações:** Uma vez que a professora finaliza o rascunho de IA e clica em **"Enviar para Coordenação"**, o relatório é gravado no banco como um documento de texto estático (uma "foto"). 
- **Estabilidade:** Qualquer nova observação ou diário lançado pela professora após esse envio **não altera** o documento que está sob revisão da coordenação/diretora, garantindo segurança na aprovação.
- **Geração Forçada:** O texto do relatório só mudará se a professora ou coordenadora escolher explicitamente clicar no botão **"Gerar Novamente (Do Zero)"**.

### 2. Continuidade Pedagógica (Roadmap Futuro)
- **Histórico Comparativo:** A geração do relatório de um período (ex: T2) passará a receber como contexto no prompt da IA o **relatório aprovado do período anterior (T1)**.
- **Narrativa de Evolução:** Com isso, a IA não gerará textos isolados, mas sim uma análise comparativa do desenvolvimento do aluno (ex: destacando que o aluno superou um ponto de atenção em autonomia registrado no T1, ou mostrando a evolução contínua da linguagem).
- **Redução do Retrabalho:** A professora não precisa pesquisar ou redigitar os marcos anteriores do trimestre passado para fazer o contraponto; o motor de IA faz o cruzamento de marcos automaticamente.

### 3. Isolamento Temporal de Diários (Produção)
- **Filtros de Data de Corte:** Para a versão de produção, os logs diários serão segmentados com base nas datas oficiais do calendário letivo (ex: logs de Junho a Agosto entram no T2; logs criados a partir de Setembro caem automaticamente na área de contexto do T3).

---

## 🔑 Acessos Oficiais de Demonstração (Showroom)

Para fins de pitch comercial e homologação rápida em reuniões, o banco está populado com as seguintes credenciais padrão (Senha: `planeta123`):

- **Administrador (Diretoria):** `diretora@planeta.com`
- **Professor (Corpo Docente):** `profe@planeta.com` (Vinculada à turma Berçário II)
- **Pai do Otto:** `paiotto@planeta.com` (Alvo de testes com histórico de relatórios já aprovados)
- **Pai da Luna:** `pailuna@planeta.com` (Alvo de testes para demonstrar a geração de relatórios de IA do absoluto início)
