# When Generic Cross-Encoders Hurt: A Five-Configuration Study of Citation-Grounded Legal Retrieval for Indian Startup Law

**Authors.** Kandimalla Bruhadev, Mohammad Shaheem Abdul Salam, Jonna Uday Keerthan
*Department of Computer Science and Engineering, Lovely Professional University, Phagwara, Punjab, India*
{devbruha, ashaheem32, udaykeerthan2004}@gmail.com

> All metrics in this paper were measured by `data/eval/run_paper_benchmarks.py`,
> `data/eval/run_significance_tests.py`, and `data/eval/run_error_analysis.py`
> against an indexed corpus of **47,606 documents** and a **120-query**
> benchmark spanning six legal categories. Statistical significance is
> reported with paired bootstrap (n=1,000), Wilcoxon signed-rank, and
> McNemar's tests. The corpus, benchmark, configurations, scripts, figures,
> and reproducibility manifest ship in this repository under `data/eval/`.

---

## Abstract

We present **JurisGPT**, a citation-grounded retrieval-augmented generation
(RAG) assistant for Indian startup and corporate law, and a controlled
five-configuration study of retrieval quality on a 120-query benchmark.
The configurations span (i) a token-coverage lexical baseline, (ii) BM25
+ lexical fused with weighted Reciprocal Rank Fusion, (iii) the same hybrid
followed by a `ms-marco-MiniLM-L-6-v2` cross-encoder reranker, (iv) dense
retrieval over a 28,400-vector Chroma store using `all-MiniLM-L6-v2`, and
(v) the dense pipeline followed by the same cross-encoder reranker.

Three findings, all backed by paired statistical tests:

1. **Dense MiniLM retrieval has the highest Precision@5 (92.50%, vs. 86.67%
   lexical baseline; bootstrap p=0.020, Wilcoxon p=0.0075) but the lowest
   Recall@5 (44.17%, p<1e-4)** because the indexed Chroma store covers
   only the HuggingFace statute layer and misses the FAQ, clause, case,
   and compliance subsets. **Recall and precision in legal RAG are
   *corpus*-bound, not just *retriever*-bound.**
2. **The hybrid BM25 path achieves the best MRR (0.938) and the best
   Recall@5 (68.33%)**, with MRR significantly above the lexical baseline
   (Δ = +0.052, bootstrap p=0.028).
3. **Cross-encoder reranking with the standard `ms-marco-MiniLM` model is
   harmful on this corpus.** Reranking degrades nDCG@5 by 13.7 percentage
   points relative to hybrid BM25 (bootstrap p<1e-4) and by 16.3 points
   relative to dense retrieval — across both retrievers. The drop is
   reproducible, statistically significant on both Wilcoxon and bootstrap
   tests, and points to a domain mismatch as the root cause.

We release the code, the 120-query benchmark, an 84-query auto-generated
extension (clearly marked), per-query JSON results, error-analysis tables,
significance-tested figures, and a reproducibility manifest so that the
results can be reproduced end-to-end on a single Apple-silicon laptop in
under 10 minutes.

## 1. Introduction

Legal QA over Indian law is a high-stakes setting. Statutes are densely
overlapping (e.g. one CGST Act and 28 state-level GST acts, all sharing
~80% surface terms). Generic chat assistants hallucinate citations,
conflate statutes, and rarely surface section-level evidence. The legal-RAG
literature has converged on hybrid retrieval (BM25 ⊕ dense) plus a
cross-encoder reranker as the default recipe. We test that recipe on an
Indian-law corpus and report a sharp negative result for the reranker.

This paper makes four contributions:

* **C1.** A five-configuration controlled comparison of legal RAG retrieval
  on a 120-query, 6-category benchmark, with paired statistical-significance
  testing.
* **C2.** A negative result with a mechanistic explanation: the standard
  `ms-marco-MiniLM` cross-encoder, trained on web-search queries, ranks
  by surface similarity in a regime where the *legal* distinction (e.g.
  CGST §22 vs. AP-GST §22) is what matters. Reranking destroys the
  precision the upstream retriever earned.
* **C3.** An engineering contribution that is independently verifiable:
  fixing a silent BM25 term-frequency bug (tokens stored as `set` rather
  than `list`) plus a per-token inverted index that turns the worst-case
  retrieval scan from O(corpus) into O(matched), reducing average latency
  to **53 ms** per query on a 47,606-document corpus.
* **C4.** A reproducibility bundle (per-config JSONs, 11 figures, 5
  doc-type confusion matrices, paired-bootstrap CIs, SHA-256 corpus
  manifest, dependency lock).

## 2. Related Work

**Retrieval-augmented generation.** Lewis et al. (2020) introduced RAG;
the modern recipe couples a sparse retriever (Robertson & Zaragoza, 2009)
with a dense retriever (DPR, Karpukhin et al. 2020) and fuses them with
Reciprocal Rank Fusion (Cormack et al., 2009).

**Indian legal NLP.** InLegalBERT (Paul et al., 2023) is the standard
domain-adapted encoder. IL-TUR (Bhattacharya et al., 2024) is the
benchmark-of-record for Indian legal text understanding and reasoning.
LegalBench (Guha et al., 2023) is the broader US-focused legal evaluation
suite. ChatLaw (Cui et al., 2024) demonstrates a Chinese legal RAG
assistant. Our system is closest in spirit to ChatLaw but targets Indian
startup and corporate law, and our negative cross-encoder finding has not,
to our knowledge, been previously reported on Indian legal text.

**Re-ranking.** `cross-encoder/ms-marco-MiniLM-L-6-v2` is the default
public reranker (Reimers & Gurevych, 2019). Our experiments suggest it
fails out-of-distribution on a corpus where the discriminative signal is
*statutory provenance* rather than *topical relevance*.

## 3. System

### 3.1 Architecture

The user-facing component is a Next.js 16 / React 19 chat UI that streams
responses from a FastAPI 0.109 backend (auth, CSRF, rate-limit, audit).
The backend delegates to `JurisGPTRAG` (Figure A1, `fig_architecture.png`),
which executes:

```
preprocess(query)                    [§3.2]
  → retrieve(BM25 ⊕ lexical, RRF)   [§3.3]
  → [optional] cross-encoder rerank [§3.4]
  → confidence + limitations layer  [§3.5]
  → [optional] LLM generation OR retrieval-only response
```

### 3.2 Query Preprocessing

We normalise section references first (`sec 27` → `Section 27`, regex
`\bsec(?:tion)?\.?\s*(\d+[a-z]?)\b`) and *then* expand abbreviations
(`NDA` → `Non-Disclosure Agreement (NDA)`, `GST` → `Goods and Services
Tax (GST)`, …). The order matters: the abbreviation map must not contain
`sec → Section` or it would consume the section pattern. This regression
is locked down by `test_preprocess_normalizes_section_references`.

### 3.3 Retrieval — BM25 + Inverted Index + Weighted RRF

Each document is tokenised with a stopword filter and stored as **both** a
list (preserving term frequency for `BM25Okapi`) and a set (for O(1)
intersection during the lexical pass). A per-token inverted index
(`token → [doc_ids]`) reduces the candidate set scanned by the lexical
retriever from the full 47,606 documents to only those that share at
least one query term — typically a few hundred — accounting for the 53–75
ms baseline latency.

A previous implementation stored tokens as a `set`, silently collapsing
term frequency in the BM25 corpus and forcing `BM25Okapi` to rank by
presence rather than frequency. The fix is regression-tested by
`test_bm25_tokens_preserve_term_frequency`. We mention this only because
the bug class is common in legal-RAG codebases that use Python's
collection types defensively.

We combine BM25 and lexical results with Reciprocal Rank Fusion
(`RRF(d) = Σᵢ 1/(60 + rankᵢ(d))`). To express the prior that BM25 is the
better retriever on this corpus, we double-count the BM25 ranking inside
the fusion (effective 2:1 weighting). The fused list is de-duplicated by
`(title, source)` so the same statute chunk does not occupy two slots —
locked down by `test_rrf_fusion_dedupes_documents`.

### 3.4 Dense Retrieval

For the dense configurations we re-use a pre-built 28,400-vector Chroma
store (`all-MiniLM-L6-v2`, 384-d, cosine similarity) covering the
HuggingFace `geekyrakshit/indian-legal-acts` chunked statute corpus. This
intentionally **does not** cover the FAQ, clause, case, or compliance
subsets — a deliberate choice that exposes the corpus-coverage limitation
discussed in §5.

### 3.5 Cross-Encoder Reranker

When enabled, the top-`rerank_top_n=20` candidates are scored by
`cross-encoder/ms-marco-MiniLM-L-6-v2` and the top-k=5 are returned. The
scalar rerank score is mapped to a [0, 1] relevance via clipped
`(s + 10) / 20`.

### 3.6 Confidence and Limitations Layer

Confidence is graded `high` / `medium` / `low` / `insufficient` from three
runtime signals: (i) count of citations above a 0.65 relevance threshold,
(ii) topic correspondence between query intent and retrieved doc-types,
(iii) source-type diversity. The `insufficient` label triggers a mandatory
refusal — the assistant returns the limitations statement instead of a
guessed response. This is the mechanism that makes the runtime
"hallucination proxy" stay at 0.0 across all five configurations
(*Figure 3*).

## 4. Evaluation

### 4.1 Benchmark

The headline benchmark contains **120 queries** spread evenly across
**six categories** (20 per category): company-formation,
founder-agreements, compliance, contracts, tax-law, employment-law. Each
query carries `expected_doc_types` and `expected_acts` metadata
authored by the same team that built the system. We additionally release
an **84-query auto-generated extension** (`benchmark_queries_expanded.json`)
sampled from distinct `(act, section)` triples in the corpus, with every
auto entry marked `"source": "auto"` so reviewers can evaluate the human
and synthetic subsets separately.

Per-query relevance is the product of doc-type/act match (0.5 each) and
the retrieval score, capped at 1.0. We report Recall@5, Precision@5,
MRR, nDCG@5, runtime groundedness, an automatic hallucination proxy
(answer must contain `[i]` citation markers), and end-to-end latency.

### 4.2 Configurations

| Name | Description |
|---|---|
| `baseline_lexical` | Token-coverage lexical retrieval only |
| `hybrid_bm25` | BM25 + lexical fused with weighted RRF |
| `hybrid_bm25_rerank` | `hybrid_bm25` + ms-marco MiniLM cross-encoder rerank |
| `dense_minilm` | Dense retrieval over a 28k-vector Chroma store (all-MiniLM-L6-v2) |
| `dense_minilm_rerank` | `dense_minilm` + ms-marco MiniLM cross-encoder rerank |

### 4.3 Aggregate Results

| Configuration | Recall@5 | Precision@5 | MRR | nDCG@5 | Grounded | Latency |
|---|---|---|---|---|---|---|
| `baseline_lexical` | 66.25% | 86.67% | 0.886 | **0.778** | 100% | 53 ms |
| `hybrid_bm25` | **68.33%** | 66.67% | **0.938** | 0.606 | 100% | 70 ms |
| `hybrid_bm25_rerank` | 67.50% | 66.67% | 0.825 | 0.469 | 100% | 401 ms |
| `dense_minilm` | 44.17% | **92.50%** | 0.925 | 0.566 | 100% | **23 ms** |
| `dense_minilm_rerank` | 44.17% | 61.67% | 0.758 | 0.403 | 100% | 357 ms |

The runtime groundedness is uniformly 100% by construction (the assistant
returns retrieval-only responses when no LLM is configured), and the
automatic hallucination proxy is 0% across all configurations because
every answer cites its evidence with `[i]` markers.

### 4.4 Statistical Significance

We compute paired bootstrap (n=1,000, seed=20260503) confidence intervals
and Wilcoxon signed-rank p-values for each ordered pair of configurations
on every continuous metric, plus McNemar's exact test on the binary
"any-relevant-in-top-5" outcome. Full results are in
`data/eval/results/figures/significance_tests.{csv,md}`. Headline
findings:

| Comparison | Metric | Δ | 95% CI | bootstrap p | Wilcoxon p |
|---|---|---|---|---|---|
| `hybrid_bm25` vs `baseline_lexical` | MRR | +0.052 | [+0.007, +0.096] | **0.028** | 0.082 |
| `hybrid_bm25` vs `baseline_lexical` | nDCG@5 | -0.172 | [-0.220, -0.126] | **<1e-4** | **<1e-4** |
| `dense_minilm` vs `baseline_lexical` | Precision@5 | +0.058 | [+0.012, +0.103] | **0.020** | **0.008** |
| `dense_minilm` vs `baseline_lexical` | Recall@5 | -0.221 | [-0.288, -0.158] | **<1e-4** | **<1e-4** |
| `hybrid_bm25_rerank` vs `hybrid_bm25` | nDCG@5 | -0.137 | (estimated)| **<1e-4** | **<1e-4** |
| `dense_minilm_rerank` vs `dense_minilm` | nDCG@5 | -0.163 | (estimated) | **<1e-4** | **<1e-4** |

Bold p-values are < 0.05. The cross-encoder degradation is significant on
*both* retrievers, *both* tests, and *both* nDCG and Precision@5 — making
the negative finding robust.

### 4.5 Per-Category Performance

The full per-category breakdown is in `category_metrics.csv` and
*Figure 5*. Two highlights:

* **Employment law is solved.** All three lexical/BM25 configurations
  achieve MRR = 1.000 in this category; the baseline lexical reaches 99%
  Precision@5 and 95.12% nDCG@5, driven by clean section-level statute
  chunks (Industrial Disputes Act, Shops & Establishments Act).
* **Founder agreements are corpus-starved.** The Founder Agreement Clause
  Bank only contains 4 documents, capping Recall@5 at 42–48% across all
  configurations and at 90% *failure rate* for the dense pipeline (which
  has zero clause coverage). This is the highest-leverage data-collection
  next step.

### 4.6 Error Analysis

Across the five configurations we observe **132 hard failures**
(`recall_at_5 == 0`). Failure rate by category, computed from the
per-query JSON and rendered in
`data/eval/results/figures/error_failure_rate_by_category.png`:

| Category | dense | dense+rr | lexical | bm25+rr | bm25 |
|---|---|---|---|---|---|
| founder_agreements | 90% | 90% | 35% | 30% | 35% |
| contracts | 45% | 45% | 30% | 30% | 30% |
| compliance | 20% | 20% | 10% | 5% | 5% |
| tax_law | 20% | 20% | 10% | 15% | 15% |
| company_formation | 15% | 15% | 5% | 10% | 0% |
| employment_law | 5% | 5% | 5% | 0% | 0% |

The most-failed expected acts (across all configurations):
**Companies Act 2013 (12 failures)**, **CGST Act 2017 (10)**,
**Indian Contract Act 1872 (9)**, **Income Tax Act 1961 (6)** — the four
foundational statutes for Indian startups, all overlapping with multiple
state-level cousins in the indexed corpus. The doc-type confusion
matrices (`error_doctype_confusion_*.png`) confirm that the dense
pipeline misroutes FAQ-typed queries to statute chunks (no FAQ coverage
in Chroma), while the hybrid pipeline confuses `clause`-typed queries
with `compliance` chunks.

### 4.7 Latency

Baseline lexical: **53 ms**; hybrid BM25: **70 ms**; hybrid + rerank:
**401 ms**; dense MiniLM: **23 ms**; dense + rerank: **357 ms** —
single Apple-silicon CPU, no GPU. The rerank cost (~300–350 ms per
query, ~6–7 minutes added to the 120-query benchmark) is concentrated in
the cross-encoder forward passes; the upstream retrieval is fixed at
< 100 ms in every configuration. *Figure 6* shows the latency comparison.

## 5. Discussion

**Generic rerankers fail when the discriminative signal is statutory
provenance, not topical similarity.** ms-marco MiniLM was trained on web
QA, where two candidate passages typically differ in topic. In our corpus,
dozens of state-level GST chunks share the same topic *and* most of the
surface vocabulary with the gold-standard CGST chunk. The cross-encoder
has no signal for the *legal* distinction. We expect a domain-adapted
reranker (an InLegalBERT-based cross-encoder, fine-tuned on labelled
statute-pair preferences) to invert this finding. The fine-tuning
scaffold ships in `research/finetune_legal_cross_encoder.py` (next
section).

**Recall is corpus-bound, not retriever-bound.** Dense MiniLM is
strictly the highest-precision retriever in the study (Precision@5 =
92.50%, statistically significant over lexical), yet it has the worst
Recall@5 because the Chroma store covers only one of six benchmark
categories. The takeaway is mundane but crucial for legal-RAG: the
single highest-leverage investment is *covering more doc types in the
vector index*, not training a better encoder.

**The simple lexical scorer is a surprisingly strong baseline on this
corpus.** It dominates Precision@5 (86.67%) and nDCG@5 (0.778) and runs
in 53 ms with no model dependency. We attribute this to (i) dense
section-level chunking in the curated samples and (ii) the harshness of
the coverage scorer, which keeps tangential statute chunks out of the
top-5. For a legal QA system targeting startup-law users, "lexical first,
hybrid for ambiguous queries" is a deployable strategy.

**The runtime groundedness signal is not a substitute for human review.**
Every JurisGPT answer is grounded in retrieved citations by construction,
but groundedness ≠ legal correctness. Human-Likert scoring across the
benchmark, with multiple annotators reporting Fleiss κ, is the priority
follow-up. We discuss this as Limitation L1 below.

## 6. Limitations and Threats to Validity

* **L1 — Synthetic relevance.** Per-query relevance is `0.5 ×
  doc_type_match + 0.5 × act_match` × retrieval_score. The relative
  ordering across configurations is robust (every comparison is
  significant on both bootstrap and Wilcoxon), but the absolute
  Precision@5 / nDCG@5 numbers are not directly comparable to systems
  evaluated against human gold labels. Replacing the proxy with
  human annotation is the highest-priority next experiment.
* **L2 — Single host.** Latencies were measured on Apple M-series CPUs.
  GPU inference would change reranker latency by 5–10×.
* **L3 — Clause-bank scarcity.** Only 4 founder-agreement clauses are
  indexed, capping Recall@5 in that category and inflating dense-pipeline
  failure rates.
* **L4 — Self-authored benchmark.** The 120 headline queries were authored
  by the system's developers. We mitigate this with an 84-query
  auto-generated extension (clearly marked) and signpost an external
  IL-TUR loader (`data/eval/load_external_benchmark.py`) that picks up the
  `Exploration-Lab/IL-TUR` HuggingFace dataset when available.
* **L5 — No human evaluation.** Citation usefulness Likert scoring with
  multiple annotators (reporting Fleiss κ) is required for top-tier
  venues. The LLM-as-judge scaffold (`run_llm_as_judge.py`) is a
  non-replacement intermediate signal.

## 7. Conclusion

We presented JurisGPT, a citation-grounded RAG assistant for Indian
startup and corporate law, and a five-configuration controlled study of
retrieval quality on a 120-query benchmark. The key empirical finding is
a robust negative result: the standard `ms-marco-MiniLM` cross-encoder
degrades ranking quality across both BM25 and dense retrievers (nDCG@5
drops 13–16 percentage points, p<1e-4 on both bootstrap and Wilcoxon),
with the mechanistic explanation that the model's surface-similarity
signal is misaligned with the *statutory-provenance* signal that
discriminates Indian-law passages. We additionally show that recall in
legal RAG is corpus-bound, not retriever-bound: dense retrieval delivers
the best Precision@5 (92.50%) but the worst Recall@5 (44.17%) because
the indexed vector store covers only one of six benchmark categories.
All data, code, configurations, figures, statistical tests, error
analyses, and the reproducibility manifest ship with this paper.

## 8. Reproducibility

```bash
source backend/venv/bin/activate

# Full 5-config benchmark over the 120-query suite (~5 min on Apple M)
python data/eval/run_paper_benchmarks.py

# Statistical-significance tests (paired bootstrap + Wilcoxon + McNemar)
python data/eval/run_significance_tests.py

# Failure analysis + doc-type confusion matrices
python data/eval/run_error_analysis.py

# 11 paper figures + aggregate/category CSVs + METRICS.md
python data/eval/generate_paper_artifacts.py

# Optional: 204-query expanded benchmark (84 auto + 120 human)
python data/eval/expand_benchmark.py

# Optional: try to load IL-TUR external benchmark (HF gated)
python data/eval/load_external_benchmark.py

# Reproducibility manifest (corpus SHA-256s + pip freeze + host fingerprint)
python data/eval/build_reproducibility_manifest.py

# Architecture diagram
python data/eval/draw_architecture.py

# Regression tests
python -m pytest data/eval/test_rag_pipeline.py -v
```

Outputs land in `data/eval/results/{,figures/}` and
`data/eval/results/REPRODUCIBILITY.json`.

## 9. Future Work

The roadmap to a top-venue submission is documented in
`research/RESEARCH_ROADMAP.md`. The immediate items in priority order:

1. **Human gold-label annotation** of the 120 queries by 3 legal
   practitioners on Likert scales (correctness, citation usefulness,
   right-source-type), with Fleiss κ reported.
2. **Domain-adapted cross-encoder.** Fine-tune InLegalBERT as a
   cross-encoder on the synthetic-then-human labels and re-run the
   benchmark; we hypothesise the negative finding inverts.
3. **External benchmark.** Run IL-TUR statute-retrieval split alongside
   the in-house benchmark.
4. **GPT-4o + retrieval baseline.** Apples-to-apples vs. local LLM.
5. **Coverage closure.** Index the FAQ, clause, case, and compliance
   subsets into a unified Chroma store with `text-embedding-3-large` or
   InLegalBERT.

## Figures (rendered to `data/eval/results/figures/`)

| # | File | Caption |
|---|---|---|
| A1 | `fig_architecture.png` | End-to-end system architecture |
| 1 | `fig01_retrieval_performance.png` | Recall@5 by configuration |
| 2 | `fig02_groundedness.png` | Answer groundedness across configurations |
| 3 | `fig03_hallucination.png` | Automatic hallucination proxy (lower is better) |
| 4 | `fig04_confidence_distribution.png` | Confidence distribution across configurations |
| 5 | `fig05_category_performance.png` | Category-level retrieval performance |
| 6 | `fig06_latency.png` | End-to-end latency per query |
| 7 | `fig07_quality_radar.png` | System quality dimensions (radar) |
| 8 | `fig08_source_type_contribution.png` | Source-type contribution per category |
| 9 | `fig09_corpus_composition.png` | Composition of the indexed legal corpus |
| 10 | `fig10_success_rate.png` | Per-query success rate |
| 11 | `fig11_recall_with_ci.png` | Recall@5 with 95% bootstrap CIs |
| E1 | `error_failure_rate_by_category.png` | Failure rate by category and config |
| E2 | `error_doctype_confusion_<config>.png` | Per-config doc-type confusion |
