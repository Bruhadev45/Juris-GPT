# JurisGPT Legal Assistant Research PRD

**Working Research Title:** JurisGPT: A Citation-Grounded RAG Assistant for Indian Startup and Corporate Law

**Document Version:** 1.0  
**Date:** March 18, 2026  
**Status:** Research-Aligned Product Definition

## 1. Purpose

This PRD defines the product direction for JurisGPT as a research-aligned legal assistant whose primary contribution is a citation-grounded Retrieval-Augmented Generation (RAG) system for Indian startup and corporate law.

The goal is to align the codebase, product scope, evaluation pipeline, and documentation with a publishable research narrative. The legal assistant is the core system. Contract drafting, compliance tools, vault, review workflows, and related modules are treated as supporting product capabilities rather than the main research contribution.

## 2. Product Thesis

Indian founders, startups, and MSMEs often need quick answers to legal and compliance questions but face three recurring problems:

- legal information is fragmented across statutes, regulations, and case law
- legal language is difficult for non-lawyers to interpret
- generic LLMs answer confidently without reliable grounding or citations

JurisGPT addresses this by providing a domain-specific legal assistant that:

- retrieves relevant Indian legal sources from a curated corpus
- generates grounded answers with source references
- focuses on startup, corporate, contract, and compliance workflows
- supports legal research assistance rather than unsupervised legal decision-making

## 3. Core Positioning

### Primary Product Identity

JurisGPT is a citation-grounded legal research assistant for Indian startup and corporate law.

### Secondary Product Identity

JurisGPT also includes practical downstream modules that demonstrate application value:

- contract drafting
- document review
- compliance calendar
- document vault
- legal calculators

These modules support the ecosystem around the assistant but are not the paper's central claim.

## 4. Research Scope

### In-Scope Research Contribution

- domain-specific RAG pipeline for Indian legal question answering
- corpus design for startup and corporate legal research
- citation-grounded answer generation
- retrieval and answer-quality evaluation
- baseline comparison against non-RAG and weaker retrieval systems

### Out-of-Scope Research Claim

- autonomous legal advice
- full legal practice automation
- broad claims across all Indian legal domains
- replacing lawyers
- proving enforceability or correctness of generated documents in real cases

## 5. Target Users

### Primary Users

- startup founders
- early-stage operators
- compliance managers
- legal associates in startup-facing teams
- law students and legal researchers working on corporate law questions

### Secondary Users

- CA and CS firms
- in-house legal teams in small businesses
- incubators and startup support cells

## 6. Primary User Problems

Users need to:

- ask legal questions in natural language
- find relevant sections, cases, and legal references quickly
- understand compliance implications in plain English
- verify that answers are grounded in sources
- reduce time spent manually searching scattered legal material

## 7. Product Goals

### Product Goals

- provide fast and grounded answers to Indian startup and corporate law questions
- reduce hallucinated legal responses through retrieval and citation requirements
- create a usable legal research workflow for non-expert and semi-expert users
- demonstrate practical value through integrated downstream legal workflows

### Research Goals

- show measurable improvement over plain-LLM answering
- evaluate retrieval quality and citation usefulness
- establish a reproducible benchmark for this system configuration
- support a publishable research paper with a defensible methodology

## 8. Non-Goals

- full litigation strategy generation
- criminal law generalization across all jurisdictions
- ungrounded conversational legal advice
- end-to-end automation of corporate filings
- enterprise multi-tenant SaaS as the immediate research priority

## 9. Core Use Cases

### Use Case 1: Legal Research QA

The user asks a question such as:

"What are the annual compliance requirements for a private limited company in India?"

The system should:

- retrieve relevant legal and compliance sources
- generate a concise answer
- cite supporting sources
- suggest follow-up questions

### Use Case 2: Citation-Grounded Statute Lookup

The user asks:

"What does the Companies Act say about director duties?"

The system should:

- locate relevant statutory sections
- provide a grounded explanation
- show section references and supporting text snippets

### Use Case 3: Startup-Oriented Legal Guidance

The user asks:

"What clauses should be included in a founder agreement?"

The system should:

- answer from the legal assistant perspective
- ground the response in startup/corporate legal principles
- route the user to drafting workflows if needed

### Use Case 4: Compliance Assistance

The user asks:

"What filings are due this quarter for a private limited company?"

The system should:

- identify relevant compliance categories
- answer using corpus-backed knowledge where possible
- connect to compliance tracker workflows as a secondary feature

## 10. Functional Requirements

### FR1: Natural Language Legal QA

The system must accept legal questions in plain English and return structured answers.

### FR2: Retrieval from Curated Legal Corpus

The system must retrieve documents from the curated Indian legal corpus stored and managed through the project data pipeline.

### FR3: Citation-Grounded Answers

Each answer must include source references and evidence snippets where available.

### FR4: Domain Restriction

The system must prioritize startup, corporate, contract, governance, and compliance questions over unrelated legal domains.

### FR5: Query Routing

The assistant should distinguish among:

- legal research questions
- statute lookup
- compliance guidance
- drafting-oriented intent

### FR6: Failure Handling

If retrieval confidence is weak, the system must:

- reduce answer certainty
- surface ambiguity
- avoid presenting unsupported claims as facts

### FR7: Conversation Continuity

The assistant should preserve short conversational context for follow-up legal questions.

### FR8: Supporting Workflow Links

The assistant may guide users to subfeatures such as:

- contracts
- review
- compliance
- vault

These are support flows, not the primary research system.

## 11. Non-Functional Requirements

### Reliability

- answers should degrade safely when retrieval quality is poor
- system should log failures and retrieval misses

### Traceability

- outputs should be explainable via retrieved sources
- experiment settings must be versioned

### Reproducibility

- corpus version, chunking policy, embeddings, retrieval config, and prompt templates must be fixed for evaluation

### Latency

- target interactive response time: less than 8 seconds for normal queries in the evaluated setup

### Security

- user-facing data access must respect authentication and authorization
- research evaluation must avoid exposing sensitive uploaded documents

## 12. Corpus Strategy

The research system should use a clearly documented corpus, including:

- Indian corporate and startup-relevant statutes
- Companies Act related materials
- selected judgments and case summaries
- compliance materials relevant to startup operations
- curated legal reference documents

For the paper, the corpus description must specify:

- source categories
- number of documents
- preprocessing steps
- chunk size and overlap
- update policy
- storage and retrieval architecture

DigitalOcean-backed storage can be part of the system architecture, but it should be described as infrastructure, not the main novelty.

## 13. System Architecture

### Research-Critical Path

1. document ingestion
2. cleaning and normalization
3. chunking
4. embedding generation
5. vector index construction
6. query retrieval
7. answer generation using grounded prompt
8. citation formatting
9. evaluation logging

### Supporting Product Layer

- chat UI
- legal search dashboard
- compliance dashboard
- contract generation pages
- review and vault modules

## 14. Evaluation Requirements

### Evaluation Dataset

Create a gold evaluation set of legal questions with:

- question text
- topic label
- expected source references
- expected answer outline
- difficulty level

Suggested coverage:

- company incorporation
- founder agreements
- director duties
- shareholder and governance issues
- startup contracts
- annual and event-based compliance
- privacy and data obligations for startups

### Baselines

The research evaluation should compare:

- plain LLM without retrieval
- keyword or lexical search baseline
- current RAG system
- optional reranked or hybrid retrieval variant

### Metrics

Retrieval metrics:

- Recall@k
- MRR
- nDCG

Answer metrics:

- citation precision
- groundedness
- hallucination rate
- answer relevance
- completeness

Human evaluation:

- legal correctness
- practical usefulness
- trustworthiness

Operational metrics:

- latency
- token cost
- retrieval failure rate

## 15. Product Success Metrics

### Research Success

- measurable improvement over plain-LLM baseline
- human evaluators prefer grounded answers
- citation quality is acceptable and consistent
- experiment results are reproducible

### Product Success

- users can answer legal research questions faster than manual search
- users can identify sources behind answers
- users can transition from research to task workflows when needed

## 16. Risks

### Research Risks

- novelty overlap with prior RAG-for-law papers
- weak benchmark design
- insufficient human evaluation
- overly broad scope leading to weak claims

### Product Risks

- prototype modules weaken credibility if presented as core evidence
- outdated or sample data contaminates evaluation
- weak access control undermines trust
- poor citation formatting reduces legal usability

## 17. Alignment Rules for the Codebase

To align the codebase with the paper:

- the README must present the legal assistant as the primary system
- the assistant pipeline must be isolated and documented
- research experiments must live in a dedicated folder
- sample/demo data must be clearly separated from evaluation data
- downstream product modules must be marked as supporting features

## 18. Immediate Implementation Priorities

### Phase 1: Research Alignment

- update README and positioning
- isolate the legal assistant architecture in documentation
- define fixed research configuration
- separate demo/sample data from paper-evaluation data

### Phase 2: Evaluation Layer

- create benchmark dataset
- implement baseline runners
- implement retrieval and groundedness evaluation scripts
- add experiment logging

### Phase 3: Maturity Improvements

- strengthen auth and access control
- replace temporary in-memory pieces in research-critical paths
- improve citation formatting and answer confidence handling
- add tests for retrieval and response validation

### Phase 4: Paper Readiness

- freeze corpus version
- freeze model and prompt versions
- run ablation studies
- prepare tables, metrics, and qualitative examples

## 19. Final Product Statement

JurisGPT is a citation-grounded legal assistant for Indian startup and corporate law. Its research contribution is a domain-specific RAG pipeline for grounded legal question answering. Its surrounding product modules demonstrate practical value, but the legal assistant remains the core system for both product identity and research evaluation.
