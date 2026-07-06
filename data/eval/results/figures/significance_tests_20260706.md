# Pairwise Statistical Significance

- Configurations: baseline_lexical, hybrid_bm25, hybrid_bm25_rerank, dense_minilm, dense_minilm_rerank
- Queries: 120
- Bootstrap resamples: 1000 (seed=20260503)

## Paired tests on continuous metrics

| Metric | A vs B | mean(A) | mean(B) | ΔA-B | 95% CI | bootstrap p | Wilcoxon p |
|---|---|---|---|---|---|---|---|
| recall_at_5 | baseline_lexical vs hybrid_bm25 | 0.6583 | 0.6833 | -0.0250 | [-0.0583, +0.0042] | 0.1560 | 0.1446 |
| precision_at_5 | baseline_lexical vs hybrid_bm25 | 0.8633 | 0.6675 | +0.1958 | [+0.1372, +0.2540] | <1e-4 | <1e-4 |
| mrr | baseline_lexical vs hybrid_bm25 | 0.8857 | 0.9378 | -0.0521 | [-0.0963, -0.0068] | 0.0280 | 0.0786 |
| ndcg_at_5 | baseline_lexical vs hybrid_bm25 | 0.7786 | 0.6121 | +0.1664 | [+0.1211, +0.2116] | <1e-4 | <1e-4 |
| recall_at_5 | baseline_lexical vs hybrid_bm25_rerank | 0.6583 | 0.6708 | -0.0125 | [-0.0583, +0.0333] | 0.6760 | 0.6662 |
| precision_at_5 | baseline_lexical vs hybrid_bm25_rerank | 0.8633 | 0.6700 | +0.1933 | [+0.1383, +0.2533] | <1e-4 | <1e-4 |
| mrr | baseline_lexical vs hybrid_bm25_rerank | 0.8857 | 0.8208 | +0.0649 | [+0.0215, +0.1135] | <1e-4 | 0.0082 |
| ndcg_at_5 | baseline_lexical vs hybrid_bm25_rerank | 0.7786 | 0.4689 | +0.3096 | [+0.2665, +0.3549] | <1e-4 | <1e-4 |
| recall_at_5 | baseline_lexical vs dense_minilm | 0.6583 | 0.4417 | +0.2167 | [+0.1542, +0.2875] | <1e-4 | <1e-4 |
| precision_at_5 | baseline_lexical vs dense_minilm | 0.8633 | 0.9250 | -0.0617 | [-0.1083, -0.0133] | 0.0160 | 0.0068 |
| mrr | baseline_lexical vs dense_minilm | 0.8857 | 0.9250 | -0.0393 | [-0.0918, +0.0153] | 0.1760 | 0.4504 |
| ndcg_at_5 | baseline_lexical vs dense_minilm | 0.7786 | 0.5661 | +0.2124 | [+0.1681, +0.2559] | <1e-4 | <1e-4 |
| recall_at_5 | baseline_lexical vs dense_minilm_rerank | 0.6583 | 0.4417 | +0.2167 | [+0.1542, +0.2875] | <1e-4 | <1e-4 |
| precision_at_5 | baseline_lexical vs dense_minilm_rerank | 0.8633 | 0.6167 | +0.2467 | [+0.1667, +0.3283] | <1e-4 | <1e-4 |
| mrr | baseline_lexical vs dense_minilm_rerank | 0.8857 | 0.7583 | +0.1274 | [+0.0461, +0.2090] | 0.0020 | 0.0006 |
| ndcg_at_5 | baseline_lexical vs dense_minilm_rerank | 0.7786 | 0.4032 | +0.3753 | [+0.3246, +0.4258] | <1e-4 | <1e-4 |
| recall_at_5 | hybrid_bm25 vs hybrid_bm25_rerank | 0.6833 | 0.6708 | +0.0125 | [-0.0251, +0.0542] | 0.6380 | 0.5312 |
| precision_at_5 | hybrid_bm25 vs hybrid_bm25_rerank | 0.6675 | 0.6700 | -0.0025 | [-0.0779, +0.0765] | 0.9240 | 0.8544 |
| mrr | hybrid_bm25 vs hybrid_bm25_rerank | 0.9378 | 0.8208 | +0.1169 | [+0.0572, +0.1767] | <1e-4 | 0.0013 |
| ndcg_at_5 | hybrid_bm25 vs hybrid_bm25_rerank | 0.6121 | 0.4689 | +0.1432 | [+0.0993, +0.1963] | <1e-4 | <1e-4 |
| recall_at_5 | hybrid_bm25 vs dense_minilm | 0.6833 | 0.4417 | +0.2417 | [+0.1874, +0.3042] | <1e-4 | <1e-4 |
| precision_at_5 | hybrid_bm25 vs dense_minilm | 0.6675 | 0.9250 | -0.2575 | [-0.3194, -0.1953] | <1e-4 | <1e-4 |
| mrr | hybrid_bm25 vs dense_minilm | 0.9378 | 0.9250 | +0.0128 | [-0.0056, +0.0353] | 0.2140 | 0.2785 |
| ndcg_at_5 | hybrid_bm25 vs dense_minilm | 0.6121 | 0.5661 | +0.0460 | [+0.0021, +0.0890] | 0.0420 | 0.0578 |
| recall_at_5 | hybrid_bm25 vs dense_minilm_rerank | 0.6833 | 0.4417 | +0.2417 | [+0.1874, +0.3042] | <1e-4 | <1e-4 |
| precision_at_5 | hybrid_bm25 vs dense_minilm_rerank | 0.6675 | 0.6167 | +0.0508 | [-0.0500, +0.1465] | 0.3440 | 0.2426 |
| mrr | hybrid_bm25 vs dense_minilm_rerank | 0.9378 | 0.7583 | +0.1794 | [+0.1155, +0.2503] | <1e-4 | <1e-4 |
| ndcg_at_5 | hybrid_bm25 vs dense_minilm_rerank | 0.6121 | 0.4032 | +0.2089 | [+0.1545, +0.2659] | <1e-4 | <1e-4 |
| recall_at_5 | hybrid_bm25_rerank vs dense_minilm | 0.6708 | 0.4417 | +0.2292 | [+0.1583, +0.3000] | <1e-4 | <1e-4 |
| precision_at_5 | hybrid_bm25_rerank vs dense_minilm | 0.6700 | 0.9250 | -0.2550 | [-0.3267, -0.1850] | <1e-4 | <1e-4 |
| mrr | hybrid_bm25_rerank vs dense_minilm | 0.8208 | 0.9250 | -0.1042 | [-0.1708, -0.0347] | <1e-4 | 0.0187 |
| ndcg_at_5 | hybrid_bm25_rerank vs dense_minilm | 0.4689 | 0.5661 | -0.0972 | [-0.1391, -0.0579] | <1e-4 | <1e-4 |
| recall_at_5 | hybrid_bm25_rerank vs dense_minilm_rerank | 0.6708 | 0.4417 | +0.2292 | [+0.1583, +0.3000] | <1e-4 | <1e-4 |
| precision_at_5 | hybrid_bm25_rerank vs dense_minilm_rerank | 0.6700 | 0.6167 | +0.0533 | [-0.0117, +0.1167] | 0.1120 | 0.0614 |
| mrr | hybrid_bm25_rerank vs dense_minilm_rerank | 0.8208 | 0.7583 | +0.0625 | [-0.0194, +0.1417] | 0.1520 | 0.0305 |
| ndcg_at_5 | hybrid_bm25_rerank vs dense_minilm_rerank | 0.4689 | 0.4032 | +0.0657 | [+0.0206, +0.1048] | <1e-4 | 0.0018 |
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