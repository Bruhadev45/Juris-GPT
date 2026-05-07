# JurisGPT Paper Benchmark Summary

Generated: 2026-05-03T04:39:41.195635+00:00

## Aggregate Comparison

| Configuration | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Hallucination Proxy | Latency (s) |
|---|---|---|---|---|---|---|---|
| dense_minilm | 66.67% | 100.00% | 1.0000 | 0.5867 | 100.00% | 0.00% | 0.282 |

## dense_minilm
- Description: Dense neural retrieval over the 28k-vector Chroma store (all-MiniLM-L6-v2, 384d)
- Total queries: 6
- Total wall time: 1.7s
- Corpus: 0 documents from uninitialized

### Confidence distribution
- medium: 6

### Category metrics

| Category | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Avg Latency (s) |
|---|---|---|---|---|---|---|
| company_formation | 66.67% | 100.00% | 1.0000 | 0.5867 | 100.00% | 0.282 |