# JurisGPT Paper Benchmark Summary

Generated: 2026-05-02T20:29:48.196050+00:00

## Aggregate Comparison

| Configuration | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Hallucination Proxy | Latency (s) |
|---|---|---|---|---|---|---|---|
| baseline_lexical | 66.25% | 86.67% | 0.8861 | 0.7785 | 100.00% | 0.00% | 0.053 |
| hybrid_bm25 | 68.33% | 66.67% | 0.9378 | 0.6079 | 100.00% | 0.00% | 0.075 |
| hybrid_bm25_rerank | 67.50% | 66.67% | 0.8250 | 0.4690 | 100.00% | 0.00% | 1.529 |

## baseline_lexical
- Description: Token-coverage lexical retrieval only (no BM25, no rerank)
- Total queries: 120
- Total wall time: 6.4s
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
| contracts | 47.50% | 89.00% | 0.9167 | 0.7953 | 100.00% | 0.049 |
| tax_law | 70.00% | 78.00% | 0.8750 | 0.6986 | 100.00% | 0.062 |
| employment_law | 72.50% | 99.00% | 1.0000 | 0.9512 | 100.00% | 0.052 |

## hybrid_bm25
- Description: BM25 + lexical fused via weighted Reciprocal Rank Fusion
- Total queries: 120
- Total wall time: 9.1s
- Corpus: 47606 documents from local

### Confidence distribution
- high: 27
- low: 53
- medium: 40

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 85.00% | 71.75% | 0.9600 | 0.6262 | 100.00% | 0.089 |
| founder_agreements | 42.50% | 82.00% | 0.9250 | 0.6927 | 100.00% | 0.072 |
| compliance | 82.50% | 70.00% | 0.9750 | 0.6417 | 100.00% | 0.068 |
| contracts | 52.50% | 55.75% | 0.9000 | 0.5180 | 100.00% | 0.075 |
| tax_law | 67.50% | 41.33% | 0.8667 | 0.4351 | 100.00% | 0.075 |
| employment_law | 80.00% | 79.17% | 1.0000 | 0.7339 | 100.00% | 0.073 |

## hybrid_bm25_rerank
- Description: Hybrid BM25 with ms-marco-MiniLM-L-6-v2 cross-encoder re-rank
- Total queries: 120
- Total wall time: 183.5s
- Corpus: 47606 documents from local

### Confidence distribution
- high: 1
- low: 17
- medium: 102

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 82.50% | 64.00% | 0.7750 | 0.4460 | 100.00% | 0.985 |
| founder_agreements | 47.50% | 46.00% | 0.7667 | 0.3743 | 100.00% | 0.710 |
| compliance | 85.00% | 63.00% | 0.7750 | 0.4438 | 100.00% | 1.113 |
| contracts | 47.50% | 66.00% | 0.8750 | 0.4055 | 100.00% | 2.329 |
| tax_law | 70.00% | 62.00% | 0.7583 | 0.3352 | 100.00% | 1.900 |
| employment_law | 72.50% | 99.00% | 1.0000 | 0.8095 | 100.00% | 2.138 |