# Gestão com GitHub Projects (passo a passo)

Ferramenta gratuita, no mesmo lugar do código. Uma pessoa, um quadro.

## 1. Criar o projeto (uma vez, ~5 min)
1. No GitHub abra o perfil `olucasbernardino`, aba **Projects**, botão **New project**.
2. Escolha o modelo **Board** (Kanban) e chame de `Produto: descoberta e entrega`.
3. Em **Settings** do projeto, use **Link a repository** e conecte `task-manager`.
4. Mantenha o projeto **privado**.

## 2. Colunas do quadro (campo Status)
| Coluna | Significado | Limite |
|---|---|---|
| Backlog | Ideias e tarefas ainda sem prioridade | sem limite |
| Preparado | Definido e pronto para começar (tem critério de pronto) | 5 |
| Fazendo | Em andamento | **2** |
| Em teste/validação | Esperando resultado de um teste ou feedback | 3 |
| Feito | Concluído com critério de pronto cumprido | sem limite |

Regra de ouro: só puxa algo novo para **Fazendo** quando houver menos de 2 itens lá.

## 3. Campos extras (Settings, New field)
- **Tipo** (single select): Ideia, Descoberta, Validação, Construção, Decisão.
- **Ciclo** (iteration): duração de 2 semanas.
- **Esforço (h)** (number).
- **Pontuação** (number): vem do `compare-ideas.mjs`.

## 4. Rótulos (Issues, Labels)
`ideia`, `descoberta`, `validacao`, `construcao`, `decisao`, `bloqueado`.

## 5. Ritmo
- **Início do ciclo (30 min):** escolher no máximo 3 resultados para as 2 semanas.
- **Revisão semanal (20 min):** o que entreguei, o que aprendi, o que muda. Anotar em um comentário no próprio item.
- **Fim do ciclo (30 min):** demonstrar a si mesmo o que ficou pronto; atualizar o backlog; registrar decisões em `docs/produto/decisoes/`.

## 6. Como cada ideia entra
1. Abra uma **Issue** com o formulário "Ideia de produto" (versão rápida).
2. Quando valer a pena, copie `docs/produto/ideias/_TEMPLATE-ideia.md` para `ideia-NN-nome.md` e preencha.
3. Dê as notas no cabeçalho e rode `node scripts/compare-ideas.mjs`.
4. Mova o item no quadro: Backlog → Preparado (validação) → Fazendo → Em teste → Feito.

## 7. Alternativas de código aberto (se quiser mais recursos)
- **Plane** (plano grátis ou hospedagem própria): ciclos e módulos, parecido com Linear.
- **Taiga**: Scrum/Kanban clássico.
Só troque se o GitHub Projects ficar curto em algo concreto.
