# JurisGPT — Paper Metrics Snapshot

Auto-generated from the latest 120-query benchmark run.

## Aggregate Comparison (all configurations)

| configuration       |   recall_at_5 |   precision_at_5 |    mrr |   ndcg_at_5 |   groundedness_rate |   hallucination_proxy_rate |   avg_response_time_s |
|:--------------------|--------------:|-----------------:|-------:|------------:|--------------------:|---------------------------:|----------------------:|
| baseline_lexical    |        0.6625 |           0.8667 | 0.8861 |      0.7785 |              1.0000 |                     0.0000 |                0.0528 |
| hybrid_bm25         |        0.6833 |           0.6667 | 0.9378 |      0.6063 |              1.0000 |                     0.0000 |                0.0698 |
| hybrid_bm25_rerank  |        0.6750 |           0.6667 | 0.8250 |      0.4690 |              1.0000 |                     0.0000 |                0.4010 |
| dense_minilm        |        0.4417 |           0.9250 | 0.9250 |      0.5661 |              1.0000 |                     0.0000 |                0.0227 |
| dense_minilm_rerank |        0.4417 |           0.6167 | 0.7583 |      0.4032 |              1.0000 |                     0.0000 |                0.3568 |

## Per-Category Recall@5 (selected metrics)

| configuration       | category           |   count |   recall_at_5 |   precision_at_5 |    mrr |   ndcg_at_5 |   groundedness_rate |   hallucination_proxy_rate |   avg_response_time |
|:--------------------|:-------------------|--------:|--------------:|-----------------:|-------:|------------:|--------------------:|---------------------------:|--------------------:|
| baseline_lexical    | company_formation  |      20 |        0.8250 |           0.8200 | 0.8208 |      0.7313 |              1.0000 |                     0.0000 |              0.0597 |
| baseline_lexical    | founder_agreements |      20 |        0.4500 |           0.9000 | 0.9125 |      0.8028 |              1.0000 |                     0.0000 |              0.0464 |
| baseline_lexical    | compliance         |      20 |        0.8000 |           0.8200 | 0.7917 |      0.6920 |              1.0000 |                     0.0000 |              0.0506 |
| baseline_lexical    | contracts          |      20 |        0.4750 |           0.8900 | 0.9167 |      0.7953 |              1.0000 |                     0.0000 |              0.0471 |
| baseline_lexical    | tax_law            |      20 |        0.7000 |           0.7800 | 0.8750 |      0.6986 |              1.0000 |                     0.0000 |              0.0628 |
| baseline_lexical    | employment_law     |      20 |        0.7250 |           0.9900 | 1.0000 |      0.9512 |              1.0000 |                     0.0000 |              0.0504 |
| hybrid_bm25         | company_formation  |      20 |        0.8500 |           0.7175 | 0.9600 |      0.6262 |              1.0000 |                     0.0000 |              0.0827 |
| hybrid_bm25         | founder_agreements |      20 |        0.4250 |           0.8200 | 0.9250 |      0.6863 |              1.0000 |                     0.0000 |              0.0618 |
| hybrid_bm25         | compliance         |      20 |        0.8250 |           0.7000 | 0.9750 |      0.6417 |              1.0000 |                     0.0000 |              0.0597 |
| hybrid_bm25         | contracts          |      20 |        0.5250 |           0.5575 | 0.9000 |      0.5180 |              1.0000 |                     0.0000 |              0.0688 |
| hybrid_bm25         | tax_law            |      20 |        0.6750 |           0.4133 | 0.8667 |      0.4356 |              1.0000 |                     0.0000 |              0.0741 |
| hybrid_bm25         | employment_law     |      20 |        0.8000 |           0.7917 | 1.0000 |      0.7301 |              1.0000 |                     0.0000 |              0.0716 |
| hybrid_bm25_rerank  | company_formation  |      20 |        0.8250 |           0.6400 | 0.7750 |      0.4460 |              1.0000 |                     0.0000 |              0.8653 |
| hybrid_bm25_rerank  | founder_agreements |      20 |        0.4750 |           0.4600 | 0.7667 |      0.3743 |              1.0000 |                     0.0000 |              0.3200 |
| hybrid_bm25_rerank  | compliance         |      20 |        0.8500 |           0.6300 | 0.7750 |      0.4438 |              1.0000 |                     0.0000 |              0.3406 |
| hybrid_bm25_rerank  | contracts          |      20 |        0.4750 |           0.6600 | 0.8750 |      0.4055 |              1.0000 |                     0.0000 |              0.3109 |
| hybrid_bm25_rerank  | tax_law            |      20 |        0.7000 |           0.6200 | 0.7583 |      0.3352 |              1.0000 |                     0.0000 |              0.2523 |
| hybrid_bm25_rerank  | employment_law     |      20 |        0.7250 |           0.9900 | 1.0000 |      0.8095 |              1.0000 |                     0.0000 |              0.3171 |
| dense_minilm        | company_formation  |      20 |        0.6500 |           0.9500 | 0.9500 |      0.5536 |              1.0000 |                     0.0000 |              0.0449 |
| dense_minilm        | founder_agreements |      20 |        0.0500 |           0.9000 | 0.9000 |      0.4092 |              1.0000 |                     0.0000 |              0.0355 |
| dense_minilm        | compliance         |      20 |        0.5750 |           1.0000 | 1.0000 |      0.5902 |              1.0000 |                     0.0000 |              0.0147 |
| dense_minilm        | contracts          |      20 |        0.3250 |           0.9000 | 0.9000 |      0.5299 |              1.0000 |                     0.0000 |              0.0144 |
| dense_minilm        | tax_law            |      20 |        0.5000 |           0.8000 | 0.8000 |      0.4444 |              1.0000 |                     0.0000 |              0.0126 |
| dense_minilm        | employment_law     |      20 |        0.5500 |           1.0000 | 1.0000 |      0.8693 |              1.0000 |                     0.0000 |              0.0139 |
| dense_minilm_rerank | company_formation  |      20 |        0.6500 |           0.7600 | 0.8500 |      0.4373 |              1.0000 |                     0.0000 |              0.5268 |
| dense_minilm_rerank | founder_agreements |      20 |        0.0500 |           0.1400 | 0.4000 |      0.1830 |              1.0000 |                     0.0000 |              0.3076 |
| dense_minilm_rerank | compliance         |      20 |        0.5750 |           0.5900 | 0.7000 |      0.3569 |              1.0000 |                     0.0000 |              0.3120 |
| dense_minilm_rerank | contracts          |      20 |        0.3250 |           0.6200 | 0.8000 |      0.3758 |              1.0000 |                     0.0000 |              0.3186 |
| dense_minilm_rerank | tax_law            |      20 |        0.5000 |           0.6100 | 0.8000 |      0.3247 |              1.0000 |                     0.0000 |              0.3352 |
| dense_minilm_rerank | employment_law     |      20 |        0.5500 |           0.9800 | 1.0000 |      0.7417 |              1.0000 |                     0.0000 |              0.3407 |

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