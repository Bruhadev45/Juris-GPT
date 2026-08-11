# JurisGPT Paper Benchmark Summary

Generated: 2026-07-07T15:17:28.498881+00:00

## Aggregate Comparison

| Configuration | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Hallucination Proxy | Latency (s) |
|---|---|---|---|---|---|---|---|
| baseline_lexical | 82.50% | 86.33% | 0.8878 | 0.7849 | 100.00% | 0.00% | 0.058 |
| hybrid_bm25 | 84.17% | 72.33% | 0.9531 | 0.6846 | 100.00% | 0.00% | 0.075 |

## baseline_lexical
- Description: Token-coverage lexical retrieval only (no BM25, no rerank)
- Total queries: 120
- Total wall time: 6.9s
- Corpus: 47867 documents from local

### Confidence distribution
- high: 103
- low: 1
- medium: 16

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 80.00% | 80.00% | 0.8100 | 0.7257 | 100.00% | 0.070 |
| founder_agreements | 97.50% | 94.00% | 0.9500 | 0.8777 | 100.00% | 0.052 |
| compliance | 80.00% | 80.00% | 0.7917 | 0.6863 | 100.00% | 0.053 |
| contracts | 92.50% | 89.00% | 0.9500 | 0.8125 | 100.00% | 0.055 |
| tax_law | 72.50% | 77.00% | 0.8500 | 0.6726 | 100.00% | 0.066 |
| employment_law | 72.50% | 98.00% | 0.9750 | 0.9345 | 100.00% | 0.051 |

## hybrid_bm25
- Description: BM25 + lexical fused via weighted Reciprocal Rank Fusion
- Total queries: 120
- Total wall time: 9.0s
- Corpus: 47867 documents from local

### Confidence distribution
- high: 48
- low: 42
- medium: 30

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 85.00% | 72.25% | 0.9600 | 0.6445 | 100.00% | 0.083 |
| founder_agreements | 95.00% | 95.00% | 0.9750 | 0.9230 | 100.00% | 0.068 |
| compliance | 82.50% | 68.00% | 0.9750 | 0.6377 | 100.00% | 0.078 |
| contracts | 92.50% | 79.25% | 0.9667 | 0.7213 | 100.00% | 0.071 |
| tax_law | 70.00% | 41.33% | 0.8667 | 0.4454 | 100.00% | 0.075 |
| employment_law | 80.00% | 78.17% | 0.9750 | 0.7356 | 100.00% | 0.073 |