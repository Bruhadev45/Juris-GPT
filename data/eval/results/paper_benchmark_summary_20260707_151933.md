# JurisGPT Paper Benchmark Summary

Generated: 2026-07-07T15:24:27.323973+00:00

## Aggregate Comparison

| Configuration | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Hallucination Proxy | Latency (s) |
|---|---|---|---|---|---|---|---|
| hybrid_bm25_rerank | 83.75% | 77.33% | 0.8639 | 0.5974 | 100.00% | 0.00% | 1.316 |
| dense_minilm | 44.17% | 92.50% | 0.9250 | 0.5661 | 100.00% | 0.00% | 0.025 |
| dense_minilm_rerank | 44.17% | 61.67% | 0.7583 | 0.4032 | 100.00% | 0.00% | 0.919 |

## hybrid_bm25_rerank
- Description: Hybrid BM25 with ms-marco-MiniLM-L-6-v2 cross-encoder re-rank
- Total queries: 120
- Total wall time: 157.9s
- Corpus: 47867 documents from local

### Confidence distribution
- high: 12
- low: 12
- medium: 96

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 80.00% | 67.00% | 0.7500 | 0.4462 | 100.00% | 3.438 |
| founder_agreements | 97.50% | 90.00% | 0.9750 | 0.8379 | 100.00% | 0.712 |
| compliance | 85.00% | 63.00% | 0.7500 | 0.4339 | 100.00% | 1.017 |
| contracts | 95.00% | 84.00% | 0.9750 | 0.7264 | 100.00% | 0.891 |
| tax_law | 72.50% | 61.00% | 0.7583 | 0.3358 | 100.00% | 0.859 |
| employment_law | 72.50% | 99.00% | 0.9750 | 0.8044 | 100.00% | 0.978 |

## dense_minilm
- Description: Dense neural retrieval over the 28k-vector Chroma store (all-MiniLM-L6-v2, 384d)
- Total queries: 120
- Total wall time: 3.1s
- Corpus: 0 documents from uninitialized

### Confidence distribution
- medium: 120

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 65.00% | 95.00% | 0.9500 | 0.5536 | 100.00% | 0.043 |
| founder_agreements | 5.00% | 90.00% | 0.9000 | 0.4092 | 100.00% | 0.029 |
| compliance | 57.50% | 100.00% | 1.0000 | 0.5902 | 100.00% | 0.022 |
| contracts | 32.50% | 90.00% | 0.9000 | 0.5299 | 100.00% | 0.021 |
| tax_law | 50.00% | 80.00% | 0.8000 | 0.4444 | 100.00% | 0.019 |
| employment_law | 55.00% | 100.00% | 1.0000 | 0.8693 | 100.00% | 0.018 |

## dense_minilm_rerank
- Description: Dense MiniLM retrieval + ms-marco-MiniLM-L-6-v2 cross-encoder re-rank
- Total queries: 120
- Total wall time: 110.3s
- Corpus: 0 documents from uninitialized

### Confidence distribution
- high: 2
- low: 3
- medium: 115

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 65.00% | 76.00% | 0.8500 | 0.4373 | 100.00% | 1.292 |
| founder_agreements | 5.00% | 14.00% | 0.4000 | 0.1830 | 100.00% | 0.853 |
| compliance | 57.50% | 59.00% | 0.7000 | 0.3569 | 100.00% | 0.856 |
| contracts | 32.50% | 62.00% | 0.8000 | 0.3758 | 100.00% | 0.833 |
| tax_law | 50.00% | 61.00% | 0.8000 | 0.3247 | 100.00% | 0.814 |
| employment_law | 55.00% | 98.00% | 1.0000 | 0.7417 | 100.00% | 0.868 |