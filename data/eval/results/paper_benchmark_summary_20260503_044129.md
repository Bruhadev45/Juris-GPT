# JurisGPT Paper Benchmark Summary

Generated: 2026-05-03T04:43:42.406108+00:00

## Aggregate Comparison

| Configuration | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Hallucination Proxy | Latency (s) |
|---|---|---|---|---|---|---|---|
| baseline_lexical | 66.25% | 86.67% | 0.8861 | 0.7785 | 100.00% | 0.00% | 0.053 |
| hybrid_bm25 | 68.33% | 66.67% | 0.9378 | 0.6063 | 100.00% | 0.00% | 0.070 |
| hybrid_bm25_rerank | 67.50% | 66.67% | 0.8250 | 0.4690 | 100.00% | 0.00% | 0.401 |
| dense_minilm | 44.17% | 92.50% | 0.9250 | 0.5661 | 100.00% | 0.00% | 0.023 |
| dense_minilm_rerank | 44.17% | 61.67% | 0.7583 | 0.4032 | 100.00% | 0.00% | 0.357 |

## baseline_lexical
- Description: Token-coverage lexical retrieval only (no BM25, no rerank)
- Total queries: 120
- Total wall time: 6.3s
- Corpus: 47606 documents from local

### Confidence distribution
- high: 94
- low: 10
- medium: 16

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 82.50% | 82.00% | 0.8208 | 0.7313 | 100.00% | 0.060 |
| founder_agreements | 45.00% | 90.00% | 0.9125 | 0.8028 | 100.00% | 0.046 |
| compliance | 80.00% | 82.00% | 0.7917 | 0.6920 | 100.00% | 0.051 |
| contracts | 47.50% | 89.00% | 0.9167 | 0.7953 | 100.00% | 0.047 |
| tax_law | 70.00% | 78.00% | 0.8750 | 0.6986 | 100.00% | 0.063 |
| employment_law | 72.50% | 99.00% | 1.0000 | 0.9512 | 100.00% | 0.050 |

## hybrid_bm25
- Description: BM25 + lexical fused via weighted Reciprocal Rank Fusion
- Total queries: 120
- Total wall time: 8.4s
- Corpus: 47606 documents from local

### Confidence distribution
- high: 25
- low: 53
- medium: 42

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 85.00% | 71.75% | 0.9600 | 0.6262 | 100.00% | 0.083 |
| founder_agreements | 42.50% | 82.00% | 0.9250 | 0.6863 | 100.00% | 0.062 |
| compliance | 82.50% | 70.00% | 0.9750 | 0.6417 | 100.00% | 0.060 |
| contracts | 52.50% | 55.75% | 0.9000 | 0.5180 | 100.00% | 0.069 |
| tax_law | 67.50% | 41.33% | 0.8667 | 0.4356 | 100.00% | 0.074 |
| employment_law | 80.00% | 79.17% | 1.0000 | 0.7301 | 100.00% | 0.072 |

## hybrid_bm25_rerank
- Description: Hybrid BM25 with ms-marco-MiniLM-L-6-v2 cross-encoder re-rank
- Total queries: 120
- Total wall time: 48.1s
- Corpus: 47606 documents from local

### Confidence distribution
- high: 1
- low: 17
- medium: 102

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 82.50% | 64.00% | 0.7750 | 0.4460 | 100.00% | 0.865 |
| founder_agreements | 47.50% | 46.00% | 0.7667 | 0.3743 | 100.00% | 0.320 |
| compliance | 85.00% | 63.00% | 0.7750 | 0.4438 | 100.00% | 0.341 |
| contracts | 47.50% | 66.00% | 0.8750 | 0.4055 | 100.00% | 0.311 |
| tax_law | 70.00% | 62.00% | 0.7583 | 0.3352 | 100.00% | 0.252 |
| employment_law | 72.50% | 99.00% | 1.0000 | 0.8095 | 100.00% | 0.317 |

## dense_minilm
- Description: Dense neural retrieval over the 28k-vector Chroma store (all-MiniLM-L6-v2, 384d)
- Total queries: 120
- Total wall time: 2.7s
- Corpus: 0 documents from uninitialized

### Confidence distribution
- medium: 120

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 65.00% | 95.00% | 0.9500 | 0.5536 | 100.00% | 0.045 |
| founder_agreements | 5.00% | 90.00% | 0.9000 | 0.4092 | 100.00% | 0.035 |
| compliance | 57.50% | 100.00% | 1.0000 | 0.5902 | 100.00% | 0.015 |
| contracts | 32.50% | 90.00% | 0.9000 | 0.5299 | 100.00% | 0.014 |
| tax_law | 50.00% | 80.00% | 0.8000 | 0.4444 | 100.00% | 0.013 |
| employment_law | 55.00% | 100.00% | 1.0000 | 0.8693 | 100.00% | 0.014 |

## dense_minilm_rerank
- Description: Dense MiniLM retrieval + ms-marco-MiniLM-L-6-v2 cross-encoder re-rank
- Total queries: 120
- Total wall time: 42.8s
- Corpus: 0 documents from uninitialized

### Confidence distribution
- high: 2
- low: 3
- medium: 115

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 65.00% | 76.00% | 0.8500 | 0.4373 | 100.00% | 0.527 |
| founder_agreements | 5.00% | 14.00% | 0.4000 | 0.1830 | 100.00% | 0.308 |
| compliance | 57.50% | 59.00% | 0.7000 | 0.3569 | 100.00% | 0.312 |
| contracts | 32.50% | 62.00% | 0.8000 | 0.3758 | 100.00% | 0.319 |
| tax_law | 50.00% | 61.00% | 0.8000 | 0.3247 | 100.00% | 0.335 |
| employment_law | 55.00% | 98.00% | 1.0000 | 0.7417 | 100.00% | 0.341 |