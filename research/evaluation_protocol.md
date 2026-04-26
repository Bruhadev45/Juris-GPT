# JurisGPT Evaluation Protocol

This protocol separates automatic system metrics from human legal-quality labels.

## Automatic Evaluation

Run:

```bash
python data/eval/evaluator.py
```

For baseline comparisons:

```bash
python research/run_baselines.py
```

Automatic metrics:

- Recall@5, Precision@5, MRR, and nDCG@5 from benchmark metadata.
- Runtime groundedness from the RAG confidence/citation policy.
- Hallucination proxy from citation-marker presence.
- Latency and runtime configuration.

These metrics are useful for engineering comparisons. They are not a substitute
for human legal correctness or manual hallucination labels.

## Human Evaluation

For paper-level claims, each answer should be independently annotated by at
least three reviewers with legal familiarity.

Required labels:

- Correctness on a 1-5 Likert scale.
- Completeness on a 1-5 Likert scale.
- Trustworthiness on a 1-5 Likert scale.
- Citation usefulness on a 1-5 Likert scale.
- Clarity on a 1-5 Likert scale.
- Binary groundedness: every legal claim is supported by retrieved text.
- Binary hallucination: answer contains unsupported or false legal claims.

Report inter-annotator agreement for categorical labels, preferably Fleiss
kappa. Keep the raw annotation file separate from generated evaluation output.

## Reporting Rule

Do not report automatic hallucination proxy as the paper hallucination rate.
Use the phrase "automatic hallucination proxy" unless the value comes from
manual annotation.
