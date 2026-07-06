# JurisGPT Paper Benchmark Summary

Generated: 2026-07-06T09:59:53.047020+00:00

## Aggregate Comparison

| Configuration | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Hallucination Proxy | Latency (s) |
|---|---|---|---|---|---|---|---|
| baseline_lexical | 65.83% | 86.33% | 0.8857 | 0.7786 | 100.00% | 0.00% | 0.044 |
| hybrid_bm25 | 68.33% | 66.75% | 0.9378 | 0.6121 | 100.00% | 0.00% | 0.082 |
| hybrid_bm25_rerank | 67.08% | 67.00% | 0.8208 | 0.4689 | 100.00% | 0.00% | 2.400 |
| dense_minilm | 44.17% | 92.50% | 0.9250 | 0.5661 | 100.00% | 0.00% | 0.036 |
| dense_minilm_rerank | 44.17% | 61.67% | 0.7583 | 0.4032 | 100.00% | 0.00% | 0.844 |

## baseline_lexical
- Description: Token-coverage lexical retrieval only (no BM25, no rerank)
- Total queries: 120
- Total wall time: 5.3s
- Corpus: 47756 documents from local

### Confidence distribution
- high: 94
- low: 10
- medium: 16

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 80.00% | 81.00% | 0.8183 | 0.7327 | 100.00% | 0.056 |
| founder_agreements | 45.00% | 90.00% | 0.9125 | 0.8027 | 100.00% | 0.039 |
| compliance | 80.00% | 81.00% | 0.7917 | 0.6899 | 100.00% | 0.042 |
| contracts | 47.50% | 89.00% | 0.9167 | 0.7957 | 100.00% | 0.039 |
| tax_law | 70.00% | 78.00% | 0.8750 | 0.6986 | 100.00% | 0.049 |
| employment_law | 72.50% | 99.00% | 1.0000 | 0.9517 | 100.00% | 0.041 |

## hybrid_bm25
- Description: BM25 + lexical fused via weighted Reciprocal Rank Fusion
- Total queries: 120
- Total wall time: 9.8s
- Corpus: 47756 documents from local

### Confidence distribution
- high: 29
- low: 50
- medium: 41

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 85.00% | 73.25% | 0.9600 | 0.6536 | 100.00% | 0.101 |
| founder_agreements | 42.50% | 83.00% | 0.9250 | 0.6940 | 100.00% | 0.047 |
| compliance | 82.50% | 67.00% | 0.9750 | 0.6324 | 100.00% | 0.084 |
| contracts | 52.50% | 56.75% | 0.9000 | 0.5245 | 100.00% | 0.081 |
| tax_law | 67.50% | 41.33% | 0.8667 | 0.4347 | 100.00% | 0.078 |
| employment_law | 80.00% | 79.17% | 1.0000 | 0.7336 | 100.00% | 0.100 |

## hybrid_bm25_rerank
- Description: Hybrid BM25 with ms-marco-MiniLM-L-6-v2 cross-encoder re-rank
- Total queries: 120
- Total wall time: 288.0s
- Corpus: 47756 documents from local

### Confidence distribution
- high: 1
- low: 16
- medium: 103

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 80.00% | 67.00% | 0.7750 | 0.4536 | 100.00% | 10.736 |
| founder_agreements | 47.50% | 46.00% | 0.7667 | 0.3743 | 100.00% | 0.580 |
| compliance | 85.00% | 63.00% | 0.7500 | 0.4359 | 100.00% | 0.558 |
| contracts | 47.50% | 66.00% | 0.8750 | 0.4049 | 100.00% | 0.606 |
| tax_law | 70.00% | 60.00% | 0.7583 | 0.3320 | 100.00% | 0.652 |
| employment_law | 72.50% | 100.00% | 1.0000 | 0.8128 | 100.00% | 1.267 |

## dense_minilm
- Description: Dense neural retrieval over the 28k-vector Chroma store (all-MiniLM-L6-v2, 384d)
- Total queries: 120
- Total wall time: 4.3s
- Corpus: 0 documents from uninitialized

### Confidence distribution
- medium: 120

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 65.00% | 95.00% | 0.9500 | 0.5536 | 100.00% | 0.113 |
| founder_agreements | 5.00% | 90.00% | 0.9000 | 0.4092 | 100.00% | 0.038 |
| compliance | 57.50% | 100.00% | 1.0000 | 0.5902 | 100.00% | 0.018 |
| contracts | 32.50% | 90.00% | 0.9000 | 0.5299 | 100.00% | 0.016 |
| tax_law | 50.00% | 80.00% | 0.8000 | 0.4444 | 100.00% | 0.014 |
| employment_law | 55.00% | 100.00% | 1.0000 | 0.8693 | 100.00% | 0.016 |

## dense_minilm_rerank
- Description: Dense MiniLM retrieval + ms-marco-MiniLM-L-6-v2 cross-encoder re-rank
- Total queries: 120
- Total wall time: 101.3s
- Corpus: 0 documents from uninitialized

### Confidence distribution
- high: 2
- low: 3
- medium: 115

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 65.00% | 76.00% | 0.8500 | 0.4373 | 100.00% | 1.334 |
| founder_agreements | 5.00% | 14.00% | 0.4000 | 0.1830 | 100.00% | 0.811 |
| compliance | 57.50% | 59.00% | 0.7000 | 0.3569 | 100.00% | 0.811 |
| contracts | 32.50% | 62.00% | 0.8000 | 0.3758 | 100.00% | 0.735 |
| tax_law | 50.00% | 61.00% | 0.8000 | 0.3247 | 100.00% | 0.718 |
| employment_law | 55.00% | 98.00% | 1.0000 | 0.7417 | 100.00% | 0.655 |