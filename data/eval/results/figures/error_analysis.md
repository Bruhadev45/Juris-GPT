# JurisGPT Error Analysis

Configurations: dense_minilm, dense_minilm_rerank, baseline_lexical, hybrid_bm25_rerank, hybrid_bm25
Total failures (recall@5 = 0) across configs: 132

## Failure rate by category

| Category | dense_minilm | dense_minilm_rerank | baseline_lexical | hybrid_bm25_rerank | hybrid_bm25 |
|---|---|---|---|---|---|
| company_formation | 15.00% | 15.00% | 5.00% | 10.00% | 0.00% |
| compliance | 20.00% | 20.00% | 10.00% | 5.00% | 5.00% |
| contracts | 45.00% | 45.00% | 30.00% | 30.00% | 30.00% |
| employment_law | 5.00% | 5.00% | 5.00% | 0.00% | 0.00% |
| founder_agreements | 90.00% | 90.00% | 35.00% | 30.00% | 35.00% |
| tax_law | 20.00% | 20.00% | 10.00% | 15.00% | 15.00% |

## Most-failed expected acts (across all configs)

| Expected act | Failures |
|---|---|
| Companies Act, 2013 | 12 |
| CGST Act, 2017 | 10 |
| Indian Contract Act, 1872 | 9 |
| Income Tax Act, 1961 | 6 |

## Sample of hard failures (first 10)

| config | query_id | category | expected_doc_types | retrieved_doc_types |
|---|---|---|---|---|
| dense_minilm | CF-011 | company_formation | ['faq'] | ['statute'] |
| dense_minilm | CF-012 | company_formation | ['faq'] | ['statute'] |
| dense_minilm | CF-016 | company_formation | ['faq'] | ['statute'] |
| dense_minilm | FA-001 | founder_agreements | ['faq', 'clause'] | ['statute'] |
| dense_minilm | FA-002 | founder_agreements | ['clause', 'faq'] | ['statute'] |
| dense_minilm | FA-003 | founder_agreements | ['clause', 'faq'] | ['statute'] |
| dense_minilm | FA-004 | founder_agreements | ['clause', 'faq'] | ['statute'] |
| dense_minilm | FA-005 | founder_agreements | ['clause', 'faq'] | ['statute'] |
| dense_minilm | FA-006 | founder_agreements | ['clause', 'faq'] | ['statute'] |
| dense_minilm | FA-007 | founder_agreements | ['clause'] | ['statute'] |

## Generated figures
- error_failure_rate_by_category.png
- error_doctype_confusion_dense_minilm.png
- error_doctype_confusion_dense_minilm_rerank.png
- error_doctype_confusion_baseline_lexical.png
- error_doctype_confusion_hybrid_bm25_rerank.png
- error_doctype_confusion_hybrid_bm25.png
- error_failures.csv