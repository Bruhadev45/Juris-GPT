# Tax FAQ supplement — review required before activation

10 entries (ids 85–94) targeting the tax-law recall gap. **Not loaded by the
pipeline yet, on purpose.** This is AI-drafted legal content going into a
product that presents answers as citation-grounded, so it needs a human pass
before it can be cited to a user.

## Why these entries exist

`data/eval/results/figures/error_failures.csv` shows every failing tax query
expects a `faq` document and retrieves a `statute` instead:

| Query | Expected | Retrieved |
|---|---|---|
| TX-005 "GST rate for software services?" | `faq` | `statute` |
| TX-012 "What is e-invoicing under GST?" | `faq` | `news`, `statute` |
| TX-014 "Startup India tax exemption scheme?" | `faq` | `statute` |
| TX-020 "Digital tax provisions for tech startups?" | `faq` | `news`, `statute` |

Tax had 5 FAQ entries against 13 for contracts (92.5% recall) and 11 for
founders (95%). This is the same imbalance the paper documents for founder
agreements and contracts, and the same fix: grow the underweight source, not
the retriever.

Entries 85, 86, 87 and 88 map directly onto TX-005, TX-012, TX-014 and TX-020.
The remaining six cover adjacent questions a founder actually asks, so the
category is not tuned to the benchmark alone — the point is coverage, not
scoring against four known queries.

**Adding CGST statute sections instead would likely make this worse**: it
would put ~157 more statute competitors against gold documents that are FAQs.

## Verify before activating

Every entry is written against a named provision, and the stable statutory
mechanics should hold. These specific points are rate- or date-sensitive and
have changed recently — confirm each against the current bare Act before
this goes live:

| id | Claim to verify |
|---|---|
| 86 | E-invoicing turnover threshold — lowered repeatedly since 2020. Entry deliberately avoids naming a figure. |
| 87 | Section 80-IAC incorporation-window sunset date — extended by successive Finance Acts |
| 88 | Section 194-O TDS rate; Equalisation Levy withdrawal dates (advertisement and e-commerce components withdrawn on different dates) |
| 90 | Composition rates and the Rs. 1.5 crore / Rs. 75 lakh / Rs. 50 lakh thresholds |
| 91 | Section 16(4) cut-off date wording |
| 93 | TDS rates and thresholds for 194C, 194J, 194-I, 194Q — revised by Finance Acts |
| 94 | Angel tax abolition effective date, and whether reopened earlier assessments are in scope |

Entries 85, 89 and 92 rest on classification and structural rules that move
less, but still deserve a read.

## Activating

After review, register the file so the pipeline loads it:

```python
# data/rag_pipeline.py — CURATED_SAMPLE_FILES
"legal_faqs_tax_supplement.json",
```

Then rebuild and re-benchmark:

```bash
python data/eval/run_paper_benchmarks.py     # confirm tax_law recall moved
aws s3 sync data/datasets/samples/ "s3://$(terraform output -raw corpus_bucket)/" --exclude "._*"
```

## If you re-run the benchmark

Tax law sat at 70.0% Recall@5 with a 15% failure rate. If this behaves like
the founder-agreement and contract fixes it should rise substantially. Two
cautions before quoting any new number:

- **It is no longer the paper's corpus.** The paper reports 47,867 documents.
  Adding these makes it 47,877, so any new figure must not be presented as
  the paper's result.
- **These queries are now partly in-domain.** Four entries were written with
  knowledge of four failing benchmark queries. That is legitimate corpus
  repair, but a recall gain on exactly those four is weaker evidence than a
  gain on held-out queries. Report the per-category number, and say what
  changed.
