# ESTRUTURA OFICIAL DO BANCO DE DADOS (FIREBASE)

Preencha os dados abaixo com as informações **oficiais e definitivas** que você deseja ter no aplicativo. Quando você me devolver este documento preenchido, eu criarei e rodarei um único script definitivo para construir tudo no Firebase de uma vez por todas.

---

## 1. ESCOLA
*Defina os dados da escola principal do aplicativo.*

- **Nome da Escola:** 
- **ID da Escola (ex: planeta-colorido):** 

---

## 2. USUÁRIOS (STAFF E PAIS)
*Defina quem terá acesso ao aplicativo, com seus respectivos e-mails reais ou e-mails de demonstração. Coloque a função (Admin, Professor ou Pai).*

### 2.1. Equipe Administrativa (Diretoria / Coordenação)
| Nome | E-mail de Login | Função |
| :--- | :--- | :--- |
| Ex: Julio Calado | diretoria@ottomatic.com.br | Admin |
| Ex: Helena Demo | diretora@demo.com | Admin |
| | | |

### 2.2. Corpo Docente (Professores)
| Nome | E-mail de Login | Turma Vinculada |
| :--- | :--- | :--- |
| Ex: Ana Cláudia | profe@demo.com | Berçário II |
| Ex: Professor Júlio | julio.calado@hotmail.com | Infantil II |
| | | |

### 2.3. Pais / Responsáveis
| Nome do Responsável | E-mail de Login | Nome do Filho (Alvo) |
| :--- | :--- | :--- |
| Ex: Ricardo | pai@demo.com | Otto |
| Ex: Gracielly | gracielly.lourenco@gmail.com | Helena |
| | | |

---

## 3. ALUNOS E TURMAS
*Liste todas as turmas e os alunos que devem estar nelas. Se quiser vincular o aluno a um Pai/Responsável da tabela acima, basta indicar o nome.*

### Turma 1: [Nome da Turma, ex: Berçário II]
- **Aluno 1:** [Nome do aluno] - *Filho de: [Nome do Pai/Responsável, se houver]*
- **Aluno 2:** [Nome do aluno]
- **Aluno 3:** [Nome do aluno]

### Turma 2: [Nome da Turma, ex: Infantil II]
- **Aluno 1:** [Nome do aluno]
- **Aluno 2:** [Nome do aluno]

*(Adicione mais turmas se necessário)*

---

## 4. DADOS DE TESTE INICIAIS (OPCIONAL)
Você quer que eu injete dados falsos de meses anteriores para fins de gráficos e testes de Inteligência Artificial? (Marque com um X)

- [ ] Sim, injete 3 meses de histórico falso para um aluno específico. (Nome do aluno: _____________)
- [ ] Não, deixe os relatórios e diários completamente zerados.

---

**Instruções para o Julio:**
Basta preencher os campos acima (pode apagar meus exemplos) e me devolver ou apenas me dizer para prosseguir com esses exatos nomes, e eu construo o script gerador definitivo.
