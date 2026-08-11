# JurisGPT Paper Benchmark Summary

Generated: 2026-07-08T05:06:28.769951+00:00

## Aggregate Comparison

| Configuration | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Hallucination Proxy | Latency (s) |
|---|---|---|---|---|---|---|---|
| dense_minilm_full | 67.92% | 90.67% | 0.9333 | 0.6771 | 46.67% | 53.33% | 6.980 |
| dense_inlegalbert | 48.33% | 88.83% | 0.8982 | 0.7800 | 77.50% | 57.50% | 6.955 |

## dense_minilm_full
- Description: Dense MiniLM retrieval over the full-corpus Chroma index (all-MiniLM-L6-v2, 384d, cosine; built by build_dense_indexes.py)
- Total queries: 120
- Total wall time: 837.6s
- Corpus: 0 documents from uninitialized

### Confidence distribution
- high: 1
- insufficient: 64
- medium: 55

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 75.00% | 95.00% | 0.9500 | 0.6436 | 45.00% | 5.036 |
| founder_agreements | 72.50% | 93.00% | 1.0000 | 0.7446 | 65.00% | 8.283 |
| compliance | 67.50% | 97.00% | 1.0000 | 0.6617 | 20.00% | 2.724 |
| contracts | 72.50% | 93.00% | 0.9500 | 0.6940 | 65.00% | 10.455 |
| tax_law | 60.00% | 66.00% | 0.7000 | 0.4084 | 45.00% | 6.844 |
| employment_law | 60.00% | 100.00% | 1.0000 | 0.9106 | 40.00% | 8.538 |

## dense_inlegalbert
- Description: Dense InLegalBERT retrieval over the full-corpus Chroma index (law-ai/InLegalBERT, 768d CLS-pooled, cosine; built by build_dense_indexes.py)
- Total queries: 120
- Total wall time: 834.7s
- Corpus: 0 documents from uninitialized

### Confidence distribution
- high: 67
- insufficient: 14
- low: 13
- medium: 26

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 67.50% | 85.00% | 0.8767 | 0.6929 | 70.00% | 6.433 |
| founder_agreements | 15.00% | 90.00% | 0.9000 | 0.7800 | 55.00% | 6.014 |
| compliance | 65.00% | 97.00% | 0.9625 | 0.8700 | 85.00% | 6.827 |
| contracts | 27.50% | 77.00% | 0.8000 | 0.6876 | 65.00% | 7.138 |
| tax_law | 60.00% | 85.00% | 0.8500 | 0.6833 | 95.00% | 7.965 |
| employment_law | 55.00% | 99.00% | 1.0000 | 0.9662 | 95.00% | 7.357 |