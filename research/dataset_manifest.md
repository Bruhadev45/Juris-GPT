# JurisGPT Dataset Manifest

This manifest describes the corpus files the runtime RAG loader can ingest from
`data/datasets/samples/` and from DigitalOcean Spaces when configured.

## Runtime Local Corpus

The current local RAG loader includes:

- `companies_act_sections.json`
- `patent_act_sections.json`
- `trademark_act_sections.json`
- `income_tax_act_sections.json`
- `gst_act_sections.json`
- `consumer_protection_act_sections.json`
- `industrial_disputes_act_sections.json`
- `sebi_regulations_sections.json`
- `shops_establishments_act_sections.json`
- `case_summaries.json`
- `legal_faqs.json`
- `founder_agreement_clauses.json`
- `compliance_deadlines.json`
- `legal_news.json`

As of the latest local runtime check, this gives 393 local corpus records:

- statute: 201
- case: 62
- faq: 60
- compliance: 41
- news: 25
- clause: 4

Cloud corpus size can differ when `DO_SPACES_BUCKET` and related environment
variables are configured. Any paper or README corpus-size claim must state
whether it refers to local samples, processed HuggingFace corpus, vector-store
chunks, or DigitalOcean Spaces.

## Benchmark Corpus

The main automatic benchmark is:

- `data/eval/benchmark_queries.json`

It contains 120 queries across:

- company formation
- founder agreements
- compliance
- contracts
- tax law
- employment law

Current labels are coarse (`expected_doc_types`, `expected_acts`). For stronger
research claims, add graded qrels with source IDs or passage IDs.
