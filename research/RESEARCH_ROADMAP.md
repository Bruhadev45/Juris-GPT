# JurisGPT — Roadmap to a Research-Grade Submission

This document is the honest gap analysis between the current state and a
publishable research paper, the work I (autonomously) am executing now,
and the work that requires human or compute resources you have to provide.

It is structured so that, after this run, each Phase-1 item is **done**
in the codebase, each Phase-2 item is **scaffolded with a runnable script
that needs your data**, and each Phase-3 item has a **shovel-ready plan**.

---

## 1. Gap Analysis (where the paper falls short today)

| # | Gap | Severity | Fix venue |
|---|---|---|---|
| G1 | Synthetic relevance proxy, no human gold labels | High | Phase 3 (humans) |
| G2 | Only one self-authored 120-query benchmark | High | Phase 1 (expand to 200) + Phase 2 (IL-TUR/LegalBench) |
| G3 | No statistical significance testing | High | Phase 1 (paired bootstrap + Wilcoxon + McNemar) |
| G4 | No dense / neural retrieval baseline | High | Phase 1 (add InLegalBERT chroma config) |
| G5 | No comparison to prior legal-RAG work or related-work section | High | Phase 1 (write related work) |
| G6 | "Novelty" is engineering, not science | Medium | Phase 1 (pivot narrative around negative cross-encoder finding) |
| G7 | No commercial baseline (GPT-4o + retrieval) | Medium | Phase 2 (needs OPENAI_API_KEY) |
| G8 | No error analysis | Medium | Phase 1 (failure categorisation + plots) |
| G9 | Headline numbers are mediocre | Medium | Phase 1 (dense retrieval should lift them) |
| G10 | No domain-adapted reranker | Medium | Phase 3 (needs GPU) |
| G11 | No system architecture diagram | Low | Phase 1 |
| G12 | No reproducibility manifest (corpus hash, deps lock) | Low | Phase 1 |
| G13 | No citation-usefulness eval beyond presence-check | Low | Phase 1 (LLM-as-judge with validation harness) |

---

## 2. Phase 1 — What I am executing autonomously (this run)

These ship **in this session**, with measured numbers and tests.

### P1.1 — Statistical significance tests
- Paired bootstrap (1,000 resamples) on Recall@5, Precision@5, MRR, nDCG@5.
- Two-sided Wilcoxon signed-rank for paired query comparisons.
- McNemar's test for the binary "any-relevant-in-top-5" outcome.
- Outputs: `data/eval/results/figures/significance_tests.csv`,
  appendix tables in the paper.

### P1.2 — Dense retrieval baseline (InLegalBERT + Chroma)
- The codebase already ships a 28,400-vector Chroma store under
  `data/vectors/chroma_db/`. Add `dense_inlegalbert` as a fourth
  configuration that retrieves from Chroma alone, plus
  `hybrid_dense_bm25_rerank` that fuses dense + BM25 + cross-encoder.
- Run the 120-query benchmark across **all four** configs.

### P1.3 — Expanded benchmark (auto-generated, clearly marked)
- Generate ~80 additional queries by sampling distinct statute titles
  from the indexed corpus and templating natural-language questions
  ("What does Section X of Y say about ...?"). Clearly mark every
  generated query with `"source": "auto"` in JSON so reviewers can
  separate human-authored from auto-generated subsets.
- Result: **200-query** benchmark with explicit provenance.

### P1.4 — Automated error analysis
- For each (config, query) pair where `recall_at_5 == 0`, log:
  retrieved doc-types vs. expected, whether any retrieved doc was
  in the same Act, and the highest-relevance retrieved citation.
- Aggregate: failure rate by category, by expected_doc_type, by
  expected Act, plus a co-occurrence matrix between retrieved and
  expected doc-types.
- Render two new failure plots (failure rate per category + confusion
  matrix).

### P1.5 — Related Work section + pivot narrative
- Rewrite `research/PAPER.md` so that:
  - Related Work cites InLegalBERT (Paul et al., 2023), LegalBench
    (Guha et al., 2023), IL-TUR (Bhattacharya et al., 2024), ChatLaw
    (Cui et al., 2024), the original RAG paper (Lewis et al., 2020),
    and BM25 (Robertson & Zaragoza, 2009).
  - The headline contribution is the **negative cross-encoder finding**
    + the **inverted-index BM25 latency story**, not just "we built it".
  - Significance results appear in §5.

### P1.6 — System architecture diagram
- Matplotlib-rendered architecture PNG showing
  user → Next.js → FastAPI → JurisGPTRAG → (Inverted Index, BM25,
  Chroma+InLegalBERT, Cross-Encoder, LLM) → response envelope.

### P1.7 — Reproducibility manifest
- `data/eval/results/REPRODUCIBILITY.json` with:
  - SHA-256 of every loaded corpus file
  - `pip freeze` snapshot from `backend/venv`
  - Python version, OS, CPU
  - Git commit (when available)
- Lets a reviewer verify that two runs are on the same data.

### P1.8 — LLM-as-judge citation-usefulness evaluator (with validation)
- Optional path: when `OPENAI_API_KEY` (or any LiteLLM-compatible key)
  is set, ask `gpt-4o-mini` to rate each cited evidence on a 0–4
  Likert scale for "supports the answer" and "is the right kind of
  source". Validation harness prints inter-rater agreement against the
  synthetic relevance proxy so we know how much trust the judge earns.
- When no key is set, the script writes a stub with reproducible seeds
  and exits cleanly so the rest of the pipeline still runs.

### P1.9 — Statistical-significance figures
- Add Figure 11 (Recall@5 with 95% bootstrap CIs as error bars) and
  Figure 12 (paired-bootstrap pairwise win-rate matrix between configs).

---

## 3. Phase 2 — Scaffolded but needs your data or keys

Each item below is **a runnable script** that fails cleanly if its
prerequisite is missing, so you can flip the switch later.

### P2.1 — IL-TUR / LegalBench external benchmark (G2)
- `data/eval/load_external_benchmark.py` will attempt to download
  IL-TUR's statute-retrieval split from HuggingFace
  (`Exploration-Lab/IL-TUR`). The download is large; the script
  will work without intervention if the HF cache or internet is
  available, otherwise it prints the exact dataset-id to fetch.
- Once downloaded, `run_paper_benchmarks.py --benchmark il_tur`
  re-uses the same harness end-to-end.
- **You provide:** internet bandwidth (~1–5 GB) for the first run,
  optionally `HF_TOKEN` for gated splits.

### P2.2 — Commercial baseline (GPT-4o + retrieval) (G7)
- `data/eval/run_commercial_baseline.py` (added in Phase 1, behind
  `OPENAI_API_KEY` gate) wraps the same retrieval pipeline but
  generates with `gpt-4o`. Apples-to-apples vs. local LLM.
- **You provide:** `OPENAI_API_KEY`.

### P2.3 — Domain-adapted cross-encoder (G10)
- `research/finetune_legal_cross_encoder.py` will scaffold a
  fine-tuning loop on InLegalBERT against the synthetic relevance
  proxy. On a Mac this is too slow to run in a single session; the
  scaffold is correct and ready for a GPU run.
- **You provide:** GPU (Colab Pro / RunPod / similar) for ~6–12 GPU-hours.

---

## 4. Phase 3 — Requires humans

These are blockers for top-tier (SIGIR/ACL/EMNLP) submission. Workshop
(NLLP) and IEEE conference acceptance are reachable without them.

### P3.1 — Human gold-label annotation (G1)
- Recruit **3 legal practitioners or LLB-final-year students**.
- Annotate the 200-query benchmark on:
  - per-citation relevance (binary: relevant / not),
  - per-answer correctness (Likert 1–5),
  - per-answer citation usefulness (Likert 1–5).
- Report Fleiss κ for each axis.
- Replace `relevance` proxy in evaluator.py with the human labels and
  re-run the benchmark — that becomes the headline table.
- Time cost: ~20–30 hours per annotator.

### P3.2 — Independent benchmark queries (G2)
- Same 3 practitioners write ~50 additional queries each *without*
  seeing the corpus. These become the held-out "unseen" split.
- Crucial for any peer-reviewed venue.

### P3.3 — IRB / ethics statement
- For top venues, you need a one-paragraph ethics statement covering
  the legal-advice limitations and the corpus licensing chain.

---

## 5. After this session — your next actions

In order of impact:

1. **Get an `OPENAI_API_KEY` into `backend/.env`** so the GPT-4o
   baseline and the LLM-as-judge evaluator both light up.
2. **Run the full pipeline**:

   ```bash
   source backend/venv/bin/activate
   python data/eval/run_paper_benchmarks.py
   python data/eval/run_significance_tests.py
   python data/eval/run_error_analysis.py
   python data/eval/generate_paper_artifacts.py
   ```

3. **Schedule the human-evaluation round** (3 annotators × 3 weeks).
4. **Spin up a GPU** (Colab/RunPod) and run
   `research/finetune_legal_cross_encoder.py` once the human labels
   exist.

---

## 6. Realistic venue map after each phase

| Phase complete | Venue tier reachable |
|---|---|
| Phase 1 (this session) | Workshop (NLLP@EMNLP, Legal-NLP), arXiv, IEEE conf system paper, defended thesis |
| Phase 1 + Phase 2 | JURIX, ICAIL, NLLP main track |
| Phase 1 + 2 + 3 | SIGIR / ACL / EMNLP short; outside chance long |

The single biggest lift is Phase 3.1 (human annotation). Everything
else is automatable.
