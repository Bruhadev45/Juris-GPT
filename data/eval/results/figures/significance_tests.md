# Pairwise Statistical Significance

- Configurations: baseline_lexical, hybrid_bm25, hybrid_bm25_rerank, dense_minilm, dense_minilm_rerank
- Queries: 120
- Bootstrap resamples: 1000 (seed=20260503)

## Paired tests on continuous metrics

| Metric | A vs B | mean(A) | mean(B) | ΔA-B | 95% CI | bootstrap p | Wilcoxon p |
|---|---|---|---|---|---|---|---|
| recall_at_5 | baseline_lexical vs hybrid_bm25 | 0.8250 | 0.8417 | -0.0167 | [-0.0458, +0.0125] | 0.3620 | 0.3046 |
| precision_at_5 | baseline_lexical vs hybrid_bm25 | 0.8633 | 0.7233 | +0.1400 | [+0.0901, +0.1911] | <1e-4 | <1e-4 |
| mrr | baseline_lexical vs hybrid_bm25 | 0.8878 | 0.9531 | -0.0653 | [-0.1100, -0.0228] | <1e-4 | 0.0119 |
| ndcg_at_5 | baseline_lexical vs hybrid_bm25 | 0.7849 | 0.6846 | +0.1003 | [+0.0542, +0.1439] | <1e-4 | <1e-4 |
| recall_at_5 | baseline_lexical vs hybrid_bm25_rerank | 0.8250 | 0.8375 | -0.0125 | [-0.0583, +0.0333] | 0.6180 | 0.6724 |
| precision_at_5 | baseline_lexical vs hybrid_bm25_rerank | 0.8633 | 0.7733 | +0.0900 | [+0.0517, +0.1333] | <1e-4 | <1e-4 |
| mrr | baseline_lexical vs hybrid_bm25_rerank | 0.8878 | 0.8639 | +0.0239 | [-0.0111, +0.0628] | 0.2060 | 0.1921 |
| ndcg_at_5 | baseline_lexical vs hybrid_bm25_rerank | 0.7849 | 0.5974 | +0.1874 | [+0.1497, +0.2301] | <1e-4 | <1e-4 |
| recall_at_5 | baseline_lexical vs dense_minilm | 0.8250 | 0.4417 | +0.3833 | [+0.3042, +0.4668] | <1e-4 | <1e-4 |
| precision_at_5 | baseline_lexical vs dense_minilm | 0.8633 | 0.9250 | -0.0617 | [-0.1100, -0.0133] | 0.0160 | 0.0103 |
| mrr | baseline_lexical vs dense_minilm | 0.8878 | 0.9250 | -0.0372 | [-0.0956, +0.0208] | 0.2160 | 0.4597 |
| ndcg_at_5 | baseline_lexical vs dense_minilm | 0.7849 | 0.5661 | +0.2188 | [+0.1693, +0.2657] | <1e-4 | <1e-4 |
| recall_at_5 | baseline_lexical vs dense_minilm_rerank | 0.8250 | 0.4417 | +0.3833 | [+0.3042, +0.4668] | <1e-4 | <1e-4 |
| precision_at_5 | baseline_lexical vs dense_minilm_rerank | 0.8633 | 0.6167 | +0.2467 | [+0.1633, +0.3300] | <1e-4 | <1e-4 |
| mrr | baseline_lexical vs dense_minilm_rerank | 0.8878 | 0.7583 | +0.1294 | [+0.0458, +0.2125] | 0.0060 | 0.0007 |
| ndcg_at_5 | baseline_lexical vs dense_minilm_rerank | 0.7849 | 0.4032 | +0.3817 | [+0.3296, +0.4340] | <1e-4 | <1e-4 |
| recall_at_5 | hybrid_bm25 vs hybrid_bm25_rerank | 0.8417 | 0.8375 | +0.0042 | [-0.0333, +0.0417] | 0.9500 | 0.7708 |
| precision_at_5 | hybrid_bm25 vs hybrid_bm25_rerank | 0.7233 | 0.7733 | -0.0500 | [-0.1110, +0.0176] | 0.1280 | 0.0891 |
| mrr | hybrid_bm25 vs hybrid_bm25_rerank | 0.9531 | 0.8639 | +0.0892 | [+0.0378, +0.1445] | <1e-4 | 0.0027 |
| ndcg_at_5 | hybrid_bm25 vs hybrid_bm25_rerank | 0.6846 | 0.5974 | +0.0871 | [+0.0487, +0.1334] | <1e-4 | <1e-4 |
| recall_at_5 | hybrid_bm25 vs dense_minilm | 0.8417 | 0.4417 | +0.4000 | [+0.3291, +0.4750] | <1e-4 | <1e-4 |
| precision_at_5 | hybrid_bm25 vs dense_minilm | 0.7233 | 0.9250 | -0.2017 | [-0.2636, -0.1433] | <1e-4 | <1e-4 |
| mrr | hybrid_bm25 vs dense_minilm | 0.9531 | 0.9250 | +0.0281 | [-0.0053, +0.0639] | 0.1140 | 0.1982 |
| ndcg_at_5 | hybrid_bm25 vs dense_minilm | 0.6846 | 0.5661 | +0.1185 | [+0.0607, +0.1745] | <1e-4 | 0.0008 |
| recall_at_5 | hybrid_bm25 vs dense_minilm_rerank | 0.8417 | 0.4417 | +0.4000 | [+0.3291, +0.4750] | <1e-4 | <1e-4 |
| precision_at_5 | hybrid_bm25 vs dense_minilm_rerank | 0.7233 | 0.6167 | +0.1067 | [+0.0088, +0.2056] | 0.0460 | 0.0196 |
| mrr | hybrid_bm25 vs dense_minilm_rerank | 0.9531 | 0.7583 | +0.1947 | [+0.1219, +0.2689] | <1e-4 | <1e-4 |
| ndcg_at_5 | hybrid_bm25 vs dense_minilm_rerank | 0.6846 | 0.4032 | +0.2814 | [+0.2166, +0.3470] | <1e-4 | <1e-4 |
| recall_at_5 | hybrid_bm25_rerank vs dense_minilm | 0.8375 | 0.4417 | +0.3958 | [+0.3125, +0.4792] | <1e-4 | <1e-4 |
| precision_at_5 | hybrid_bm25_rerank vs dense_minilm | 0.7733 | 0.9250 | -0.1517 | [-0.2167, -0.0916] | <1e-4 | <1e-4 |
| mrr | hybrid_bm25_rerank vs dense_minilm | 0.8639 | 0.9250 | -0.0611 | [-0.1264, +0.0014] | 0.0580 | 0.1644 |
| ndcg_at_5 | hybrid_bm25_rerank vs dense_minilm | 0.5974 | 0.5661 | +0.0313 | [-0.0266, +0.0878] | 0.2780 | 0.4399 |
| recall_at_5 | hybrid_bm25_rerank vs dense_minilm_rerank | 0.8375 | 0.4417 | +0.3958 | [+0.3125, +0.4792] | <1e-4 | <1e-4 |
| precision_at_5 | hybrid_bm25_rerank vs dense_minilm_rerank | 0.7733 | 0.6167 | +0.1567 | [+0.0767, +0.2400] | <1e-4 | 0.0003 |
| mrr | hybrid_bm25_rerank vs dense_minilm_rerank | 0.8639 | 0.7583 | +0.1056 | [+0.0125, +0.1917] | 0.0180 | 0.0030 |
| ndcg_at_5 | hybrid_bm25_rerank vs dense_minilm_rerank | 0.5974 | 0.4032 | +0.1942 | [+0.1305, +0.2547] | <1e-4 | <1e-4 |
| recall_at_5 | dense_minilm vs dense_minilm_rerank | 0.4417 | 0.4417 | +0.0000 | [+0.0000, +0.0000] | 1.0000 | 1.0000 |
| precision_at_5 | dense_minilm vs dense_minilm_rerank | 0.9250 | 0.6167 | +0.3083 | [+0.2383, +0.3867] | <1e-4 | <1e-4 |
| mrr | dense_minilm vs dense_minilm_rerank | 0.9250 | 0.7583 | +0.1667 | [+0.1000, +0.2333] | <1e-4 | <1e-4 |
| ndcg_at_5 | dense_minilm vs dense_minilm_rerank | 0.5661 | 0.4032 | +0.1629 | [+0.1402, +0.1874] | <1e-4 | <1e-4 |

## McNemar test on the binary 'any-relevant-in-top-5' outcome

| A vs B | A-only wins | B-only wins | McNemar p |
|---|---|---|---|
| baseline_lexical vs hybrid_bm25 | 1 | 3 | 0.6250 |
| baseline_lexical vs hybrid_bm25_rerank | 3 | 3 | 1.0000 |
| baseline_lexical vs dense_minilm | 35 | 2 | <1e-4 |
| baseline_lexical vs dense_minilm_rerank | 35 | 2 | <1e-4 |
| hybrid_bm25 vs hybrid_bm25_rerank | 3 | 1 | 0.6250 |
| hybrid_bm25 vs dense_minilm | 35 | 0 | <1e-4 |
| hybrid_bm25 vs dense_minilm_rerank | 35 | 0 | <1e-4 |
| hybrid_bm25_rerank vs dense_minilm | 36 | 3 | <1e-4 |
| hybrid_bm25_rerank vs dense_minilm_rerank | 36 | 3 | <1e-4 |
| dense_minilm vs dense_minilm_rerank | 0 | 0 | 1.0000 |