# JurisGPT Paper Benchmark Summary

Generated: 2026-07-07T16:09:52.100136+00:00

## Aggregate Comparison

| Configuration | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Hallucination Proxy | Latency (s) |
|---|---|---|---|---|---|---|---|
| baseline_lexical | 89.71% | 83.14% | 0.9301 | 0.7706 | 100.00% | 0.00% | 0.579 |
| hybrid_bm25 | 90.69% | 65.38% | 0.9117 | 0.6141 | 100.00% | 0.00% | 0.986 |
| hybrid_bm25_rerank | 83.58% | 69.24% | 0.8640 | 0.5237 | 100.00% | 0.00% | 1.303 |
| dense_minilm | 45.59% | 85.78% | 0.8578 | 0.5186 | 100.00% | 0.00% | 0.031 |
| dense_minilm_rerank | 45.59% | 59.22% | 0.7010 | 0.3767 | 100.00% | 0.00% | 1.189 |

## baseline_lexical
- Description: Token-coverage lexical retrieval only (no BM25, no rerank)
- Total queries: 204
- Total wall time: 118.2s
- Corpus: 47867 documents from local

### Confidence distribution
- high: 157
- low: 6
- medium: 41

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 80.00% | 80.00% | 0.8100 | 0.7257 | 100.00% | 1.475 |
| founder_agreements | 97.50% | 94.00% | 0.9500 | 0.8777 | 100.00% | 0.368 |
| compliance | 80.00% | 80.00% | 0.7917 | 0.6863 | 100.00% | 0.332 |
| contracts | 92.50% | 89.00% | 0.9500 | 0.8125 | 100.00% | 0.189 |
| tax_law | 72.50% | 77.00% | 0.8500 | 0.6726 | 100.00% | 0.531 |
| employment_law | 72.50% | 98.00% | 0.9750 | 0.9345 | 100.00% | 0.394 |
| auto_case | 100.00% | 91.00% | 1.0000 | 0.7355 | 100.00% | 0.519 |
| auto_clause | 100.00% | 100.00% | 1.0000 | 0.9365 | 100.00% | 1.197 |
| auto_faq | 100.00% | 27.00% | 1.0000 | 0.3776 | 100.00% | 0.339 |
| auto_statute | 100.00% | 96.00% | 0.9800 | 0.9255 | 100.00% | 0.758 |

## hybrid_bm25
- Description: BM25 + lexical fused via weighted Reciprocal Rank Fusion
- Total queries: 204
- Total wall time: 201.3s
- Corpus: 47867 documents from local

### Confidence distribution
- high: 70
- low: 79
- medium: 55

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 85.00% | 72.25% | 0.9600 | 0.6445 | 100.00% | 1.669 |
| founder_agreements | 95.00% | 95.00% | 0.9750 | 0.9231 | 100.00% | 0.408 |
| compliance | 82.50% | 68.00% | 0.9750 | 0.6378 | 100.00% | 0.138 |
| contracts | 92.50% | 79.25% | 0.9667 | 0.7213 | 100.00% | 2.681 |
| tax_law | 70.00% | 41.33% | 0.8667 | 0.4454 | 100.00% | 0.726 |
| employment_law | 80.00% | 78.17% | 0.9750 | 0.7356 | 100.00% | 0.926 |
| auto_case | 100.00% | 82.25% | 1.0000 | 0.7125 | 100.00% | 0.166 |
| auto_clause | 100.00% | 100.00% | 1.0000 | 0.9761 | 100.00% | 0.255 |
| auto_faq | 100.00% | 20.00% | 0.3808 | 0.1622 | 100.00% | 0.259 |
| auto_statute | 100.00% | 55.29% | 1.0000 | 0.5433 | 100.00% | 1.518 |

## hybrid_bm25_rerank
- Description: Hybrid BM25 with ms-marco-MiniLM-L-6-v2 cross-encoder re-rank
- Total queries: 204
- Total wall time: 265.8s
- Corpus: 47867 documents from local

### Confidence distribution
- high: 12
- low: 22
- medium: 170

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 80.00% | 67.00% | 0.7500 | 0.4462 | 100.00% | 2.917 |
| founder_agreements | 97.50% | 90.00% | 0.9750 | 0.8379 | 100.00% | 0.770 |
| compliance | 85.00% | 63.00% | 0.7500 | 0.4339 | 100.00% | 1.157 |
| contracts | 95.00% | 84.00% | 0.9750 | 0.7264 | 100.00% | 2.518 |
| tax_law | 72.50% | 61.00% | 0.7583 | 0.3358 | 100.00% | 1.069 |
| employment_law | 72.50% | 99.00% | 0.9750 | 0.8044 | 100.00% | 1.046 |
| auto_case | 40.00% | 36.00% | 0.7250 | 0.3410 | 100.00% | 1.025 |
| auto_clause | 100.00% | 100.00% | 1.0000 | 0.7071 | 100.00% | 1.121 |
| auto_faq | 100.00% | 27.25% | 0.9292 | 0.2781 | 100.00% | 0.970 |
| auto_statute | 95.00% | 79.50% | 0.8875 | 0.4982 | 100.00% | 0.795 |

## dense_minilm
- Description: Dense neural retrieval over the 28k-vector Chroma store (all-MiniLM-L6-v2, 384d)
- Total queries: 204
- Total wall time: 6.4s
- Corpus: 0 documents from uninitialized

### Confidence distribution
- low: 1
- medium: 203

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 65.00% | 95.00% | 0.9500 | 0.5536 | 100.00% | 0.114 |
| founder_agreements | 5.00% | 90.00% | 0.9000 | 0.4092 | 100.00% | 0.053 |
| compliance | 57.50% | 100.00% | 1.0000 | 0.5902 | 100.00% | 0.021 |
| contracts | 32.50% | 90.00% | 0.9000 | 0.5299 | 100.00% | 0.020 |
| tax_law | 50.00% | 80.00% | 0.8000 | 0.4444 | 100.00% | 0.018 |
| employment_law | 55.00% | 100.00% | 1.0000 | 0.8693 | 100.00% | 0.019 |
| auto_case | 0.00% | 100.00% | 1.0000 | 0.5414 | 100.00% | 0.023 |
| auto_clause | 0.00% | 100.00% | 1.0000 | 0.5106 | 100.00% | 0.014 |
| auto_faq | 0.00% | 0.00% | 0.0000 | 0.0000 | 100.00% | 0.018 |
| auto_statute | 100.00% | 100.00% | 1.0000 | 0.6249 | 100.00% | 0.015 |

## dense_minilm_rerank
- Description: Dense MiniLM retrieval + ms-marco-MiniLM-L-6-v2 cross-encoder re-rank
- Total queries: 204
- Total wall time: 242.7s
- Corpus: 0 documents from uninitialized

### Confidence distribution
- high: 2
- low: 7
- medium: 195

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 65.00% | 76.00% | 0.8500 | 0.4373 | 100.00% | 2.384 |
| founder_agreements | 5.00% | 14.00% | 0.4000 | 0.1830 | 100.00% | 1.003 |
| compliance | 57.50% | 59.00% | 0.7000 | 0.3569 | 100.00% | 1.284 |
| contracts | 32.50% | 62.00% | 0.8000 | 0.3758 | 100.00% | 0.962 |
| tax_law | 50.00% | 61.00% | 0.8000 | 0.3247 | 100.00% | 1.021 |
| employment_law | 55.00% | 98.00% | 1.0000 | 0.7417 | 100.00% | 1.076 |
| auto_case | 0.00% | 32.00% | 0.5000 | 0.2218 | 100.00% | 1.083 |
| auto_clause | 0.00% | 30.00% | 0.5000 | 0.2568 | 100.00% | 0.874 |
| auto_faq | 0.00% | 0.00% | 0.0000 | 0.0000 | 100.00% | 0.970 |
| auto_statute | 100.00% | 98.00% | 1.0000 | 0.5751 | 100.00% | 1.088 |