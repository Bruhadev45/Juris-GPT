# JurisGPT — Paper Metrics Snapshot

Auto-generated from the latest 120-query benchmark run.

## Aggregate Comparison (all configurations)

| configuration       |   recall_at_5 |   precision_at_5 |    mrr |   ndcg_at_5 |   groundedness_rate |   hallucination_proxy_rate |   avg_response_time_s |
|:--------------------|--------------:|-----------------:|-------:|------------:|--------------------:|---------------------------:|----------------------:|
| baseline_lexical    |        0.8250 |           0.8633 | 0.8878 |      0.7849 |              1.0000 |                     0.0000 |                0.0577 |
| hybrid_bm25         |        0.8417 |           0.7233 | 0.9531 |      0.6846 |              1.0000 |                     0.0000 |                0.0746 |
| hybrid_bm25_rerank  |        0.8375 |           0.7733 | 0.8639 |      0.5974 |              1.0000 |                     0.0000 |                1.3158 |
| dense_minilm        |        0.4417 |           0.9250 | 0.9250 |      0.5661 |              1.0000 |                     0.0000 |                0.0254 |
| dense_minilm_rerank |        0.4417 |           0.6167 | 0.7583 |      0.4032 |              1.0000 |                     0.0000 |                0.9192 |

## Per-Category Recall@5 (selected metrics)

| configuration       | category           |   count |   recall_at_5 |   precision_at_5 |    mrr |   ndcg_at_5 |   groundedness_rate |   hallucination_proxy_rate |   avg_response_time |
|:--------------------|:-------------------|--------:|--------------:|-----------------:|-------:|------------:|--------------------:|---------------------------:|--------------------:|
| baseline_lexical    | company_formation  |      20 |        0.8000 |           0.8000 | 0.8100 |      0.7257 |              1.0000 |                     0.0000 |              0.0696 |
| baseline_lexical    | founder_agreements |      20 |        0.9750 |           0.9400 | 0.9500 |      0.8777 |              1.0000 |                     0.0000 |              0.0517 |
| baseline_lexical    | compliance         |      20 |        0.8000 |           0.8000 | 0.7917 |      0.6863 |              1.0000 |                     0.0000 |              0.0526 |
| baseline_lexical    | contracts          |      20 |        0.9250 |           0.8900 | 0.9500 |      0.8125 |              1.0000 |                     0.0000 |              0.0549 |
| baseline_lexical    | tax_law            |      20 |        0.7250 |           0.7700 | 0.8500 |      0.6726 |              1.0000 |                     0.0000 |              0.0662 |
| baseline_lexical    | employment_law     |      20 |        0.7250 |           0.9800 | 0.9750 |      0.9345 |              1.0000 |                     0.0000 |              0.0514 |
| hybrid_bm25         | company_formation  |      20 |        0.8500 |           0.7225 | 0.9600 |      0.6445 |              1.0000 |                     0.0000 |              0.0833 |
| hybrid_bm25         | founder_agreements |      20 |        0.9500 |           0.9500 | 0.9750 |      0.9230 |              1.0000 |                     0.0000 |              0.0675 |
| hybrid_bm25         | compliance         |      20 |        0.8250 |           0.6800 | 0.9750 |      0.6377 |              1.0000 |                     0.0000 |              0.0784 |
| hybrid_bm25         | contracts          |      20 |        0.9250 |           0.7925 | 0.9667 |      0.7213 |              1.0000 |                     0.0000 |              0.0707 |
| hybrid_bm25         | tax_law            |      20 |        0.7000 |           0.4133 | 0.8667 |      0.4454 |              1.0000 |                     0.0000 |              0.0750 |
| hybrid_bm25         | employment_law     |      20 |        0.8000 |           0.7817 | 0.9750 |      0.7356 |              1.0000 |                     0.0000 |              0.0730 |
| hybrid_bm25_rerank  | company_formation  |      20 |        0.8000 |           0.6700 | 0.7500 |      0.4462 |              1.0000 |                     0.0000 |              3.4381 |
| hybrid_bm25_rerank  | founder_agreements |      20 |        0.9750 |           0.9000 | 0.9750 |      0.8379 |              1.0000 |                     0.0000 |              0.7123 |
| hybrid_bm25_rerank  | compliance         |      20 |        0.8500 |           0.6300 | 0.7500 |      0.4339 |              1.0000 |                     0.0000 |              1.0168 |
| hybrid_bm25_rerank  | contracts          |      20 |        0.9500 |           0.8400 | 0.9750 |      0.7264 |              1.0000 |                     0.0000 |              0.8907 |
| hybrid_bm25_rerank  | tax_law            |      20 |        0.7250 |           0.6100 | 0.7583 |      0.3358 |              1.0000 |                     0.0000 |              0.8586 |
| hybrid_bm25_rerank  | employment_law     |      20 |        0.7250 |           0.9900 | 0.9750 |      0.8044 |              1.0000 |                     0.0000 |              0.9781 |
| dense_minilm        | company_formation  |      20 |        0.6500 |           0.9500 | 0.9500 |      0.5536 |              1.0000 |                     0.0000 |              0.0427 |
| dense_minilm        | founder_agreements |      20 |        0.0500 |           0.9000 | 0.9000 |      0.4092 |              1.0000 |                     0.0000 |              0.0285 |
| dense_minilm        | compliance         |      20 |        0.5750 |           1.0000 | 1.0000 |      0.5902 |              1.0000 |                     0.0000 |              0.0221 |
| dense_minilm        | contracts          |      20 |        0.3250 |           0.9000 | 0.9000 |      0.5299 |              1.0000 |                     0.0000 |              0.0212 |
| dense_minilm        | tax_law            |      20 |        0.5000 |           0.8000 | 0.8000 |      0.4444 |              1.0000 |                     0.0000 |              0.0194 |
| dense_minilm        | employment_law     |      20 |        0.5500 |           1.0000 | 1.0000 |      0.8693 |              1.0000 |                     0.0000 |              0.0183 |
| dense_minilm_rerank | company_formation  |      20 |        0.6500 |           0.7600 | 0.8500 |      0.4373 |              1.0000 |                     0.0000 |              1.2917 |
| dense_minilm_rerank | founder_agreements |      20 |        0.0500 |           0.1400 | 0.4000 |      0.1830 |              1.0000 |                     0.0000 |              0.8529 |
| dense_minilm_rerank | compliance         |      20 |        0.5750 |           0.5900 | 0.7000 |      0.3569 |              1.0000 |                     0.0000 |              0.8560 |
| dense_minilm_rerank | contracts          |      20 |        0.3250 |           0.6200 | 0.8000 |      0.3758 |              1.0000 |                     0.0000 |              0.8329 |
| dense_minilm_rerank | tax_law            |      20 |        0.5000 |           0.6100 | 0.8000 |      0.3247 |              1.0000 |                     0.0000 |              0.8138 |
| dense_minilm_rerank | employment_law     |      20 |        0.5500 |           0.9800 | 1.0000 |      0.7417 |              1.0000 |                     0.0000 |              0.8678 |

## Figures

- `fig01_retrieval_performance.png`
- `fig02_groundedness.png`
- `fig03_hallucination.png`
- `fig04_confidence_distribution.png`
- `fig05_category_performance.png`
- `fig06_latency.png`
- `fig07_quality_radar.png`
- `fig08_source_type_contribution.png`
- `fig09_corpus_composition.png`
- `fig10_success_rate.png`
- `fig11_recall_with_ci.png`