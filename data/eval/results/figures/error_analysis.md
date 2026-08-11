# JurisGPT Error Analysis

Configurations: baseline_lexical, hybrid_bm25, hybrid_bm25_rerank, dense_minilm, dense_minilm_rerank
Total failures (recall@5 = 0) across configs: 94

## Failure rate by category

| Category | baseline_lexical | hybrid_bm25 | hybrid_bm25_rerank | dense_minilm | dense_minilm_rerank |
|---|---|---|---|---|---|
| company_formation | 5.00% | 0.00% | 10.00% | 15.00% | 15.00% |
| compliance | 10.00% | 5.00% | 5.00% | 20.00% | 20.00% |
| contracts | 0.00% | 0.00% | 0.00% | 45.00% | 45.00% |
| employment_law | 5.00% | 0.00% | 0.00% | 5.00% | 5.00% |
| founder_agreements | 0.00% | 0.00% | 0.00% | 90.00% | 90.00% |
| tax_law | 10.00% | 15.00% | 15.00% | 20.00% | 20.00% |

## Most-failed expected acts (across all configs)

| Expected act | Failures |
|---|---|
| CGST Act, 2017 | 10 |
| Companies Act, 2013 | 9 |
| Income Tax Act, 1961 | 6 |
| Indian Contract Act, 1872 | 6 |

## Sample of hard failures (first 10)

| config | query_id | category | expected_doc_types | retrieved_doc_types |
|---|---|---|---|---|
| baseline_lexical | CF-018 | company_formation | ['statute'] | ['compliance'] |
| baseline_lexical | CO-002 | compliance | ['statute', 'faq'] | ['compliance'] |
| baseline_lexical | CO-016 | compliance | ['faq'] | ['statute'] |
| baseline_lexical | TX-005 | tax_law | ['faq'] | ['statute'] |
| baseline_lexical | TX-012 | tax_law | ['faq'] | ['news', 'statute'] |
| baseline_lexical | EL-016 | employment_law | ['clause', 'faq'] | ['case', 'news', 'statute'] |
| hybrid_bm25 | CO-016 | compliance | ['faq'] | ['statute'] |
| hybrid_bm25 | TX-005 | tax_law | ['faq'] | ['news', 'statute'] |
| hybrid_bm25 | TX-012 | tax_law | ['faq'] | ['news', 'statute'] |
| hybrid_bm25 | TX-020 | tax_law | ['faq'] | ['news', 'statute'] |

## Generated figures
- error_failure_rate_by_category.png
- error_doctype_confusion_baseline_lexical.png
- error_doctype_confusion_hybrid_bm25.png
- error_doctype_confusion_hybrid_bm25_rerank.png
- error_doctype_confusion_dense_minilm.png
- error_doctype_confusion_dense_minilm_rerank.png
- error_failures.csv