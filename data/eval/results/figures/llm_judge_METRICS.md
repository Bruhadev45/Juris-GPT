# LLM-as-judge citation quality (Claude Opus 4.8, 2026-07-06)

120 queries/config; each retrieved citation scored 0-4 on two axes.
'weak@top5 %' = share of citations scoring <=1 on supports_answer (unhelpful-citation rate).

| config | n citations | supports_answer (mean) | right_kind_of_source (mean) | weak@top5 % | top1 supports (mean) |
|---|---|---|---|---|---|
| baseline_lexical | 212 | 1.81 | 2.23 | 46.2% | 1.78 |
| hybrid_bm25 | 217 | 1.79 | 2.26 | 44.2% | 1.66 |
| hybrid_bm25_rerank | 219 | 1.77 | 2.20 | 49.8% | 1.65 |
| dense_minilm | 120 | 0.53 | 1.52 | 88.3% | 0.53 |
| dense_minilm_rerank | 120 | 0.59 | 1.52 | 87.5% | 0.59 |
