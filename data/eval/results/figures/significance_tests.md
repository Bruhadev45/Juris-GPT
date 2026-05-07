# Pairwise Statistical Significance

- Configurations: baseline_lexical, hybrid_bm25, hybrid_bm25_rerank, dense_minilm, dense_minilm_rerank
- Queries: 120
- Bootstrap resamples: 1000 (seed=20260503)

## Paired tests on continuous metrics

| Metric | A vs B | mean(A) | mean(B) | ΔA-B | 95% CI | bootstrap p | Wilcoxon p |
|---|---|---|---|---|---|---|---|
| recall_at_5 | baseline_lexical vs hybrid_bm25 | 0.6625 | 0.6833 | -0.0208 | [-0.0542, +0.0125] | 0.2800 | 0.2362 |
| precision_at_5 | baseline_lexical vs hybrid_bm25 | 0.8667 | 0.6667 | +0.2000 | [+0.1432, +0.2585] | <1e-4 | <1e-4 |
| mrr | baseline_lexical vs hybrid_bm25 | 0.8861 | 0.9378 | -0.0517 | [-0.0957, -0.0065] | 0.0280 | 0.0824 |
| ndcg_at_5 | baseline_lexical vs hybrid_bm25 | 0.7785 | 0.6063 | +0.1722 | [+0.1261, +0.2199] | <1e-4 | <1e-4 |
| recall_at_5 | baseline_lexical vs hybrid_bm25_rerank | 0.6625 | 0.6750 | -0.0125 | [-0.0583, +0.0333] | 0.6760 | 0.6662 |
| precision_at_5 | baseline_lexical vs hybrid_bm25_rerank | 0.8667 | 0.6667 | +0.2000 | [+0.1450, +0.2633] | <1e-4 | <1e-4 |
| mrr | baseline_lexical vs hybrid_bm25_rerank | 0.8861 | 0.8250 | +0.0611 | [+0.0181, +0.1097] | <1e-4 | 0.0125 |
| ndcg_at_5 | baseline_lexical vs hybrid_bm25_rerank | 0.7785 | 0.4690 | +0.3095 | [+0.2663, +0.3539] | <1e-4 | <1e-4 |
| recall_at_5 | baseline_lexical vs dense_minilm | 0.6625 | 0.4417 | +0.2208 | [+0.1583, +0.2876] | <1e-4 | <1e-4 |
| precision_at_5 | baseline_lexical vs dense_minilm | 0.8667 | 0.9250 | -0.0583 | [-0.1033, -0.0117] | 0.0200 | 0.0075 |
| mrr | baseline_lexical vs dense_minilm | 0.8861 | 0.9250 | -0.0389 | [-0.0910, +0.0160] | 0.1760 | 0.4504 |
| ndcg_at_5 | baseline_lexical vs dense_minilm | 0.7785 | 0.5661 | +0.2124 | [+0.1684, +0.2552] | <1e-4 | <1e-4 |
| recall_at_5 | baseline_lexical vs dense_minilm_rerank | 0.6625 | 0.4417 | +0.2208 | [+0.1583, +0.2876] | <1e-4 | <1e-4 |
| precision_at_5 | baseline_lexical vs dense_minilm_rerank | 0.8667 | 0.6167 | +0.2500 | [+0.1716, +0.3300] | <1e-4 | <1e-4 |
| mrr | baseline_lexical vs dense_minilm_rerank | 0.8861 | 0.7583 | +0.1278 | [+0.0465, +0.2090] | 0.0020 | 0.0006 |
| ndcg_at_5 | baseline_lexical vs dense_minilm_rerank | 0.7785 | 0.4032 | +0.3753 | [+0.3246, +0.4257] | <1e-4 | <1e-4 |
| recall_at_5 | hybrid_bm25 vs hybrid_bm25_rerank | 0.6833 | 0.6750 | +0.0083 | [-0.0333, +0.0542] | 0.8120 | 0.6630 |
| precision_at_5 | hybrid_bm25 vs hybrid_bm25_rerank | 0.6667 | 0.6667 | -0.0000 | [-0.0768, +0.0832] | 0.9520 | 0.9602 |
| mrr | hybrid_bm25 vs hybrid_bm25_rerank | 0.9378 | 0.8250 | +0.1128 | [+0.0533, +0.1725] | <1e-4 | 0.0016 |
| ndcg_at_5 | hybrid_bm25 vs hybrid_bm25_rerank | 0.6063 | 0.4690 | +0.1373 | [+0.0927, +0.1935] | <1e-4 | <1e-4 |
| recall_at_5 | hybrid_bm25 vs dense_minilm | 0.6833 | 0.4417 | +0.2417 | [+0.1874, +0.3042] | <1e-4 | <1e-4 |
| precision_at_5 | hybrid_bm25 vs dense_minilm | 0.6667 | 0.9250 | -0.2583 | [-0.3222, -0.1991] | <1e-4 | <1e-4 |
| mrr | hybrid_bm25 vs dense_minilm | 0.9378 | 0.9250 | +0.0128 | [-0.0056, +0.0353] | 0.2140 | 0.2785 |
| ndcg_at_5 | hybrid_bm25 vs dense_minilm | 0.6063 | 0.5661 | +0.0402 | [-0.0038, +0.0819] | 0.0700 | 0.0861 |
| recall_at_5 | hybrid_bm25 vs dense_minilm_rerank | 0.6833 | 0.4417 | +0.2417 | [+0.1874, +0.3042] | <1e-4 | <1e-4 |
| precision_at_5 | hybrid_bm25 vs dense_minilm_rerank | 0.6667 | 0.6167 | +0.0500 | [-0.0504, +0.1471] | 0.3640 | 0.2237 |
| mrr | hybrid_bm25 vs dense_minilm_rerank | 0.9378 | 0.7583 | +0.1794 | [+0.1155, +0.2503] | <1e-4 | <1e-4 |
| ndcg_at_5 | hybrid_bm25 vs dense_minilm_rerank | 0.6063 | 0.4032 | +0.2031 | [+0.1497, +0.2571] | <1e-4 | <1e-4 |
| recall_at_5 | hybrid_bm25_rerank vs dense_minilm | 0.6750 | 0.4417 | +0.2333 | [+0.1625, +0.3001] | <1e-4 | <1e-4 |
| precision_at_5 | hybrid_bm25_rerank vs dense_minilm | 0.6667 | 0.9250 | -0.2583 | [-0.3300, -0.1916] | <1e-4 | <1e-4 |
| mrr | hybrid_bm25_rerank vs dense_minilm | 0.8250 | 0.9250 | -0.1000 | [-0.1653, -0.0305] | 0.0020 | 0.0237 |
| ndcg_at_5 | hybrid_bm25_rerank vs dense_minilm | 0.4690 | 0.5661 | -0.0971 | [-0.1390, -0.0584] | <1e-4 | <1e-4 |
| recall_at_5 | hybrid_bm25_rerank vs dense_minilm_rerank | 0.6750 | 0.4417 | +0.2333 | [+0.1625, +0.3001] | <1e-4 | <1e-4 |
| precision_at_5 | hybrid_bm25_rerank vs dense_minilm_rerank | 0.6667 | 0.6167 | +0.0500 | [-0.0150, +0.1133] | 0.1340 | 0.0864 |
| mrr | hybrid_bm25_rerank vs dense_minilm_rerank | 0.8250 | 0.7583 | +0.0667 | [-0.0153, +0.1486] | 0.1380 | 0.0247 |
| ndcg_at_5 | hybrid_bm25_rerank vs dense_minilm_rerank | 0.4690 | 0.4032 | +0.0658 | [+0.0205, +0.1042] | <1e-4 | 0.0015 |
| recall_at_5 | dense_minilm vs dense_minilm_rerank | 0.4417 | 0.4417 | +0.0000 | [+0.0000, +0.0000] | 1.0000 | 1.0000 |
| precision_at_5 | dense_minilm vs dense_minilm_rerank | 0.9250 | 0.6167 | +0.3083 | [+0.2383, +0.3867] | <1e-4 | <1e-4 |
| mrr | dense_minilm vs dense_minilm_rerank | 0.9250 | 0.7583 | +0.1667 | [+0.1000, +0.2333] | <1e-4 | <1e-4 |
| ndcg_at_5 | dense_minilm vs dense_minilm_rerank | 0.5661 | 0.4032 | +0.1629 | [+0.1402, +0.1874] | <1e-4 | <1e-4 |

## McNemar test on the binary 'any-relevant-in-top-5' outcome

| A vs B | A-only wins | B-only wins | McNemar p |
|---|---|---|---|
| baseline_lexical vs hybrid_bm25 | 1 | 3 | 0.6250 |
| baseline_lexical vs hybrid_bm25_rerank | 3 | 4 | 1.0000 |
| baseline_lexical vs dense_minilm | 22 | 2 | <1e-4 |
| baseline_lexical vs dense_minilm_rerank | 22 | 2 | <1e-4 |
| hybrid_bm25 vs hybrid_bm25_rerank | 3 | 2 | 1.0000 |
| hybrid_bm25 vs dense_minilm | 22 | 0 | <1e-4 |
| hybrid_bm25 vs dense_minilm_rerank | 22 | 0 | <1e-4 |
| hybrid_bm25_rerank vs dense_minilm | 24 | 3 | <1e-4 |
| hybrid_bm25_rerank vs dense_minilm_rerank | 24 | 3 | <1e-4 |
| dense_minilm vs dense_minilm_rerank | 0 | 0 | 1.0000 |