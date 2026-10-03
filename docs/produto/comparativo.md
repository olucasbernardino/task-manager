# Comparativo de ideias

O ranking é gerado a partir das **notas no cabeçalho** de cada arquivo em `docs/produto/ideias/`.

```bash
node scripts/compare-ideas.mjs
```

## Pesos (podem ser alterados em `scripts/compare-ideas.mjs`)
| Critério | Peso | Pergunta |
|---|---|---|
| dor_frequente | 3 | A dor aparece toda semana? |
| ia_diferencial | 3 | Sem IA o produto perde o sentido? |
| eu_sou_usuario | 2 | Eu uso e testo todos os dias? |
| cabe_no_gratis | 2 | Cabe nos limites gratuitos, sem risco de custo? |
| mvp_2_semanas | 2 | Dá para entregar algo útil em 2 semanas? |
| outros_teriam_a_dor | 1 | Mais 3 a 5 pessoas teriam a dor? |

Nota 1 a 5. Pontuação final = soma(peso × nota) ÷ soma(pesos × 5) × 100.

## Regras de decisão
1. Nenhuma ideia com **nota 1 ou 2 em `dor_frequente`** passa, mesmo com pontuação alta.
2. Empate (menos de 5 pontos de diferença): escolhe-se a de **menor risco de privacidade**.
3. A escolhida precisa de um **teste de validação** com critério de sucesso definido antes de qualquer código.
4. Revisar as notas depois do teste, não só antes.

## Resultado mais recente
<Cole aqui a saída do script e a data.>
