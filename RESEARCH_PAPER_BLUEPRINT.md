# JurisGPT Research Paper Blueprint

**Project:** JurisGPT  
**Paper Focus:** Citation-Grounded Legal Assistant for Indian Startup and Corporate Law  
**Prepared For:** Research paper drafting based on the current JurisGPT codebase  
**Date:** March 18, 2026

## Authors

### Kandimalla Bruhadev

Department of Computer Science and Engineering  
Lovely Professional University  
Phagwara, Punjab, India  
`devbruha@gmail.com`

### Mohammad Shaheem Abdul Salam

Department of Computer Science and Engineering  
Lovely Professional University  
Phagwara, Punjab, India  
`ashaheem32@gmail.com`

### Jonna Uday Keerthan

Department of Computer Science and Engineering  
Lovely Professional University  
Phagwara, Punjab, India  
`udaykeerthan2004@gmail.com`

## 1. Recommended Paper Title

**JurisGPT: A Citation-Grounded Legal Assistant for Indian Startup and Corporate Law**


## 2. One-Line Research Claim

JurisGPT is a domain-focused legal assistant that retrieves relevant Indian legal sources from a curated corpus and generates grounded answers with citations, confidence indicators, and source-aware limitations for startup and corporate law use cases.

## 3. Current Codebase Scope Relevant To The Paper

The research paper should focus on the **legal assistant path**, not the full platform.

### Core Research Modules

- `backend/app/routes/chatbot.py`
- `backend/app/services/chatbot_service.py`
- `data/rag_pipeline.py`
- `backend/app/routes/legal_data.py`
- `frontend/src/app/dashboard/chat/page.tsx`
- `frontend/src/app/dashboard/search/page.tsx`

### Supporting Product Modules

- compliance tracking
- contracts and drafting
- document review
- vault
- tools and calculators

These should be presented as **supporting workflows**, not the main research contribution.

## 4. System Overview For The Paper

### High-Level Pipeline

1. User asks a legal research question in natural language.
2. Backend receives the query through the chat route.
3. Query is processed by the legal assistant service.
4. RAG pipeline retrieves relevant sources from the legal corpus.
5. System returns:
   - answer
   - citations
   - confidence
   - limitations
   - follow-up questions
6. Frontend displays answer and citation cards for inspection.

### Current Runtime Modes

The current implementation supports multiple answer paths:

1. **Cloud/local corpus retrieval path**
2. **Direct OpenAI path** when configured and used
3. **Fallback/sample-data path** when retrieval or generation is unavailable

For the paper, you should freeze and evaluate **one research configuration only**.

## 5. Content Architecture

This is the architecture section you should use in the paper.

### 5.1 User Interaction Layer

- Next.js frontend
- Chat-first legal research workflow
- Source search workflow
- Citation display and confidence display

### 5.2 Application Layer

- FastAPI backend
- Chat routing
- Query handling
- Confidence/limitations handling
- Research-to-workflow routing

### 5.3 Retrieval Layer

- `JurisGPTRAG` in `data/rag_pipeline.py`
- lexical retrieval fallback
- local and cloud corpus loading
- citation construction from retrieved corpus items

### 5.4 Corpus Layer

The assistant currently uses curated legal content from:

- Companies Act sections
- case summaries
- founder agreement clauses
- Indian law JSON files
- cloud-hosted datasets in DigitalOcean Spaces

The currently observed DigitalOcean Spaces inventory shows that the cloud corpus is organized around these research-relevant groups:

- `jurisgpt-all-datasets/samples/companies_act_sections.json`
- `jurisgpt-all-datasets/samples/case_summaries.json`
- `jurisgpt-all-datasets/samples/compliance_deadlines.json`
- `jurisgpt-all-datasets/samples/founder_agreement_clauses.json`
- `jurisgpt-all-datasets/samples/legal_news.json`
- `jurisgpt-all-datasets/indian_law_json/Indian-Law-Penal-Code-Json-main/*.json`
- `jurisgpt-all-datasets/indian_legal/...`
- `jurisgpt-all-datasets/sc_judgments_chunked/...`

Important: `legal_faqs.json` was available locally in the repository during development, but was not found in the observed cloud bucket listing. For the paper, only claim cloud-hosted files that are actually present in the bucket.

### 5.5 Storage Layer

- DigitalOcean Spaces for cloud-stored corpus files
- local cache and local datasets for fallback/testing

## 6. AI / ML Stack Used

This section can go directly into the paper.

### Core AI Components

#### 1. Retrieval-Augmented Generation Framework

- custom RAG pipeline implemented in `data/rag_pipeline.py`
- response object includes grounding metadata, citations, confidence, and limitations

#### 2. Embeddings

Current code supports:

- `sentence-transformers/all-MiniLM-L6-v2`
- OpenAI embeddings as optional configuration

For the paper, state the exact embedding configuration used in the evaluated run.

#### 3. Retrieval

Current code supports:

- lexical retrieval over local/cloud corpus
- Chroma vector retrieval when vector store is available
- FAISS path exists but is not the primary paper path unless you evaluate it explicitly

#### 4. Generation

Current code supports:

- retrieval-only citation output mode
- OpenAI generation path for answer synthesis

For the paper, pick one:

- **Retrieval-only grounded summarization**
- or **retrieval + LLM answer synthesis**

Do not mix both in evaluation without documenting the split.

#### 5. Confidence Layer

The pipeline estimates confidence using retrieval quality and relevance of top citations:

- `high`
- `medium`
- `low`
- `insufficient`

#### 6. Safety / Failure Handling

- unsupported retrieval lowers confidence
- system returns limitations
- avoids unsupported claims when evidence is insufficient

## 7. Corpus Architecture

### Paper-Friendly Corpus Description

Describe the corpus in these categories:

1. **Statutory Sources**
   - Companies Act sections
   - IPC/CPC/CrPC/HMA/IDA/IEA/MVA/NIA JSON files where applicable

2. **Case-Law Sources**
   - case summaries
   - judgments metadata
   - court and citation fields

3. **Startup-Law Supporting Sources**
   - founder agreement clause bank
   - compliance-related structured content
   - startup-oriented legal FAQs

4. **Cloud Corpus Storage**
   - DigitalOcean Spaces bucket
   - current observed bucket prefix includes `jurisgpt-all-datasets/...`

### 7.1 Actual DigitalOcean Bucket Inventory

The observed DigitalOcean Spaces bucket contains the following major legal-data groups.

#### A. Structured Startup/Corporate Sample Data

- `jurisgpt-all-datasets/samples/case_summaries.json`
- `jurisgpt-all-datasets/samples/companies_act_sections.json`
- `jurisgpt-all-datasets/samples/compliance_deadlines.json`
- `jurisgpt-all-datasets/samples/founder_agreement_clauses.json`
- `jurisgpt-all-datasets/samples/legal_news.json`

These are the most immediately usable structured files for the current assistant.

#### B. Indian Law JSON Corpus

- `jurisgpt-all-datasets/indian_law_json/Indian-Law-Penal-Code-Json-main/ipc.json`
- `jurisgpt-all-datasets/indian_law_json/Indian-Law-Penal-Code-Json-main/cpc.json`
- `jurisgpt-all-datasets/indian_law_json/Indian-Law-Penal-Code-Json-main/crpc.json`
- `jurisgpt-all-datasets/indian_law_json/Indian-Law-Penal-Code-Json-main/hma.json`
- `jurisgpt-all-datasets/indian_law_json/Indian-Law-Penal-Code-Json-main/ida.json`
- `jurisgpt-all-datasets/indian_law_json/Indian-Law-Penal-Code-Json-main/iea.json`
- `jurisgpt-all-datasets/indian_law_json/Indian-Law-Penal-Code-Json-main/MVA.json`
- `jurisgpt-all-datasets/indian_law_json/Indian-Law-Penal-Code-Json-main/nia.json`
- `jurisgpt-all-datasets/indian_law_json/Indian-Law-Penal-Code-Json-main/IndiaLaw.db`

These files provide statute-level sections and descriptions across multiple Indian acts.

#### C. Indian Legal Dataset Splits

- `jurisgpt-all-datasets/indian_legal/dataset_dict.json`
- `jurisgpt-all-datasets/indian_legal/train/data-00000-of-00001.arrow`
- `jurisgpt-all-datasets/indian_legal/train/dataset_info.json`
- `jurisgpt-all-datasets/indian_legal/train/state.json`
- `jurisgpt-all-datasets/indian_legal/test/data-00000-of-00001.arrow`
- `jurisgpt-all-datasets/indian_legal/test/dataset_info.json`
- `jurisgpt-all-datasets/indian_legal/test/state.json`

These are useful for large-scale experiments, fine-tuning, and evaluation beyond the lightweight sample-data runtime.

#### D. Chunked Supreme Court / Judgment Corpora

- `jurisgpt-all-datasets/sc_judgments_chunked/dataset_dict.json`
- `jurisgpt-all-datasets/sc_judgments_chunked/train/data-00000-of-00001.arrow`
- `jurisgpt-all-datasets/sc_judgments_chunked/train/dataset_info.json`
- `jurisgpt-all-datasets/sc_judgments_chunked/train/state.json`

#### E. Additional Legal AI Datasets

The bucket also includes broader legal AI datasets under:

- `jurisgpt-all-datasets/legal_ai/...`
- `jurisgpt-all-datasets/kaggle/...`

These should be treated as supplementary or future-expansion datasets unless they are explicitly used in the evaluated configuration.

### 7.2 Data Schemas Used By The Current Assistant

The current assistant runtime is most directly compatible with these structured schemas:

#### Companies Act Sections

Typical fields:

- `act`
- `section`
- `title`
- `content`

#### Case Summaries

Typical fields:

- `case_name`
- `citation`
- `court`
- `year`
- `principle`
- `summary`
- `relevance`
- `category`

#### Founder Agreement Clauses

Typical fields:

- `clause_type`
- `standard_terms`
- `sample_text`

#### Indian Law JSON Files

Typical fields vary by act, but commonly include:

- `section` or `Section`
- `title` or `section_title`
- `description` or `section_desc`
- chapter metadata

### 7.3 Recommended Paper Dataset Framing

For the research paper, present the dataset in three layers:

1. **Primary evaluated corpus**
   - structured startup/corporate-law sample files
   - Companies Act sections
   - case summaries
   - founder agreement clauses

2. **Extended statute corpus**
   - Indian law JSON files
   - additional statute-level sections from the cloud bucket

3. **Future-scale corpora**
   - `indian_legal`
   - `sc_judgments_chunked`
   - `legal_ai`
   - `kaggle`

This framing keeps the paper honest: it separates what is directly used in the assistant from what is stored in the broader cloud corpus.

### 7.4 What To State Explicitly In The Paper

State these facts clearly:

- the legal corpus is stored in a DigitalOcean Spaces bucket
- the main observed prefix is `jurisgpt-all-datasets/`
- the evaluated assistant uses structured legal JSON data and supporting statute/case corpora
- some additional cloud datasets are available for future scaling, but are not necessarily part of the frozen evaluated configuration
- `legal_faqs.json` was not found in the cloud bucket listing and should not be described as a cloud-hosted source unless uploaded later

### Important For The Paper

You must report:

- number of source files
- number of records
- categories of documents
- document schema
- preprocessing method
- retrieval unit
- storage location

## 8. Suggested Paper Architecture Section

You can write the architecture section using this structure:

### 8.1 Frontend Research Interface

The user interacts with a chat-first legal research interface that accepts natural language legal questions and displays grounded responses together with citations, confidence indicators, and limitations.

### 8.2 Backend Orchestration

The FastAPI backend receives the query, routes it to the legal assistant service, and manages retrieval, response structuring, fallback handling, and output normalization for the frontend.

### 8.3 Retrieval Pipeline

The retrieval layer loads the legal corpus from cloud or local storage, ranks relevant records, and produces citation objects containing title, source, section, act, and content snippets.

### 8.4 Answer Generation

Depending on the evaluated configuration, the system either:

- synthesizes a response from retrieved evidence, or
- returns retrieval-grounded source summaries directly

### 8.5 Output Structuring

Each answer is accompanied by:

- citation list
- confidence label
- limitations statement
- follow-up suggestions

## 9. Research Questions

Use 2-3 narrow research questions, such as:

### RQ1

Can a domain-specific legal assistant improve grounded answer quality for Indian startup and corporate law questions compared with non-retrieval baselines?

### RQ2

Does citation-grounded retrieval improve user trustworthiness and verifiability over generic LLM responses?

### RQ3

How does retrieval quality affect answer confidence and perceived usefulness in startup-law legal research tasks?

## 10. Contributions Section

Your contribution bullets can be:

1. A domain-specific legal assistant for Indian startup and corporate law.
2. A citation-grounded retrieval pipeline that produces answer evidence, confidence, and limitations.
3. A cloud-backed legal corpus workflow using DigitalOcean Spaces.
4. A research-aligned product interface that supports grounded legal research rather than generic chatbot use.
5. An evaluation framework for legal QA, groundedness, and citation usefulness.

## 11. Methodology Section Structure

Use this sequence:

1. problem statement
2. system design
3. corpus construction
4. retrieval pipeline
5. answer generation
6. confidence and grounding mechanism
7. evaluation setup
8. baselines
9. metrics

## 12. Baselines To Include

At minimum:

1. **Plain LLM without retrieval**
2. **Keyword / lexical search baseline**
3. **JurisGPT grounded assistant**

Optional:

4. vector retrieval without reranking
5. vector retrieval with reranking
6. retrieval-only vs retrieval-plus-generation

## 13. Evaluation Metrics

### Retrieval Metrics

- Recall@k
- Precision@k
- MRR
- nDCG

### Answer Quality Metrics

- groundedness
- citation precision
- hallucination rate
- answer usefulness
- completeness

### System Metrics

- latency
- response success rate
- coverage by query type

## 14. Graphs You Should Include

These are the graphs most useful for your paper.

### Graph 1: Retrieval Performance By Method

**Type:** Bar chart  
**X-axis:** baseline methods  
**Y-axis:** Recall@k or MRR

Methods:

- plain search
- lexical retrieval
- JurisGPT final system

**Recommended caption:**  
Comparison of retrieval effectiveness across baseline and proposed legal-assistant retrieval configurations.

**What it proves:**  
Shows whether the proposed assistant retrieves more relevant legal material than weaker baselines.

### Graph 2: Answer Groundedness Comparison

**Type:** Bar chart  
**X-axis:** system variants  
**Y-axis:** grounded answers percentage

**Recommended caption:**  
Percentage of answers supported by explicit retrieved evidence across evaluated systems.

**What it proves:**  
Supports your central claim that JurisGPT is more evidence-grounded than plain LLM baselines.

### Graph 3: Hallucination Rate Comparison

**Type:** Bar chart  
**X-axis:** system variants  
**Y-axis:** hallucination rate

**Recommended caption:**  
Hallucination rate across legal-answering system variants.

**What it proves:**  
Demonstrates why citation grounding matters for legal QA.

### Graph 4: Confidence Distribution

**Type:** Stacked bar or pie chart  
**Categories:** high / medium / low / insufficient

**Recommended caption:**  
Distribution of confidence labels assigned by the legal assistant across the evaluation dataset.

**What it proves:**  
Shows how often the system is willing to answer confidently versus deferring.

### Graph 5: Query Category Performance

**Type:** Grouped bar chart  
**Categories:** incorporation, contracts, compliance, director duties, employment, startup clauses  
**Y-axis:** accuracy or usefulness score

**Recommended caption:**  
Performance variation by legal query category in the evaluated corpus.

**What it proves:**  
Helps you show where the assistant is strongest and where the corpus is weaker.

### Graph 6: Latency Comparison

**Type:** Bar chart  
**X-axis:** baseline variants  
**Y-axis:** average response time in seconds

**Recommended caption:**  
Average response latency across retrieval and generation configurations.

**What it proves:**  
Shows the engineering tradeoff between answer quality and usability.

### Graph 7: Human Evaluation Scores

**Type:** Radar chart or grouped bar chart  
**Metrics:** correctness, completeness, trustworthiness, citation usefulness

**Recommended caption:**  
Human evaluation of legal-answer quality and source usefulness across system variants.

**What it proves:**  
Turns the project into a publishable evaluation rather than only a product demo.

### Graph 8: Source-Type Contribution

**Type:** Stacked bar chart  
**X-axis:** query categories  
**Y-axis:** proportion of retrieved evidence  
**Stacks:** statutes / case summaries / startup clause bank / compliance data

**Recommended caption:**  
Contribution of different source types to answer generation across legal query categories.

**What it proves:**  
Shows how your mixed corpus supports different kinds of legal questions.

### Graph 9: Coverage Of The Corpus

**Type:** Bar chart  
**X-axis:** corpus categories  
**Y-axis:** number of records or files

Suggested categories:

- Companies Act sections
- case summaries
- founder agreement clauses
- compliance data
- Indian law JSON records
- extended cloud datasets

**Recommended caption:**  
Composition of the cloud-hosted legal corpus used by JurisGPT.

### Graph 10: Success vs Failure Breakdown

**Type:** Donut chart or stacked bar  
**Categories:** grounded correct / partially grounded / insufficient evidence / unsupported answer

**Recommended caption:**  
Distribution of answer outcomes in the evaluation dataset.

## 14A. How To Build The Graphs

Use a consistent graph style across the paper:

- font: one academic-safe sans serif
- same color mapping across all charts
- blue for baselines
- green for final JurisGPT system
- amber/red for failure or hallucination metrics

Recommended graph tools:

- Python `matplotlib`
- Python `seaborn`
- Excel if you need a fast draft
- Figma or Illustrator only for final polishing

Graph design rules:

- never use 3D charts
- keep axis labels explicit
- use exact metric names
- include sample size in the caption where relevant
- keep decimal places consistent
- avoid overloaded legends

## 14B. Suggested Results Section Graph Order

Use this order in the results section:

1. corpus composition graph
2. retrieval performance graph
3. groundedness and hallucination graphs
4. category-wise performance graph
5. latency graph
6. human evaluation graph

That order mirrors the logical paper argument:

- what data you have
- how well you retrieve
- how good the answers are
- where the system works best
- what the runtime tradeoffs are
- how humans perceive the results

## 15. Figures You Should Include

### Figure 1: System Architecture Diagram

Draw this flow:

`User -> Frontend Chat Interface -> FastAPI Backend -> Chatbot Service -> RAG Pipeline -> Cloud/Local Legal Corpus -> Structured Response -> Citation UI`

**Detailed block version:**

- User query
- Next.js legal assistant interface
- FastAPI `/api/chat/message`
- chatbot service orchestration
- query enhancement / context handling
- retrieval engine
- DigitalOcean Spaces corpus or local cache
- response formatter
- frontend rendering of answer, citations, confidence, and limitations

**Recommended caption:**  
End-to-end architecture of JurisGPT from user query to citation-grounded answer rendering.

### Figure 2: Query Processing Flow

`Query -> Intent handling -> Retrieval -> Confidence estimation -> Answer generation -> Citation formatting -> Frontend rendering`

**Expanded version for the paper:**

`Natural-language query -> intent classification / routing -> corpus retrieval -> top-k evidence selection -> confidence assessment -> answer synthesis or retrieval-only summarization -> citation assembly -> UI delivery`

**Recommended caption:**  
Internal processing stages used by the legal assistant for grounded legal response generation.

### Figure 3: Corpus Architecture

Show corpus groups:

- statutes
- case summaries
- startup clause bank
- compliance / support data
- DigitalOcean Spaces storage

Add cloud prefixes in the figure legend:

- `jurisgpt-all-datasets/samples/...`
- `jurisgpt-all-datasets/indian_law_json/...`
- `jurisgpt-all-datasets/indian_legal/...`
- `jurisgpt-all-datasets/sc_judgments_chunked/...`

**Recommended caption:**  
Organization of the cloud-hosted legal corpus used by the JurisGPT retrieval layer.

### Figure 4: Response Schema

Show:

- answer
- citations
- confidence
- limitations
- follow-up questions

Add optional fields:

- grounded
- section
- act
- source
- relevance
- url when available

**Recommended caption:**  
Structured response schema returned by JurisGPT for legal research interactions.

### Figure 5: Research Workflow In The Product

Show the user workflow you already aligned in the app:

`Ask assistant -> inspect citations -> deepen with source search -> move to contracts/compliance/review`

**Recommended caption:**  
Research-first user workflow implemented in the JurisGPT interface.

### Figure 6: Confidence Assignment Logic

Show the confidence path:

`retrieved citations -> relevance scoring -> top-citation analysis -> confidence label`

Confidence outputs:

- high
- medium
- low
- insufficient

**Recommended caption:**  
Confidence estimation pipeline based on retrieved legal evidence quality.

## 15A. Architecture Diagram Content You Can Directly Draw

Use these blocks exactly in a diagram:

### Layer 1: User Layer

- Founder / operator / legal researcher

### Layer 2: Interface Layer

- dashboard workspace
- legal assistant chat
- source search
- citation cards

### Layer 3: Backend Layer

- FastAPI API gateway
- chatbot route
- chatbot service

### Layer 4: Intelligence Layer

- query handling
- retrieval engine
- confidence estimation
- response formatting

### Layer 5: Data Layer

- DigitalOcean Spaces corpus
- local cache
- structured legal JSON files
- statute and case datasets

### Layer 6: Output Layer

- answer
- citations
- confidence
- limitations
- follow-up questions

## 15B. Architecture Diagram Variants

You should ideally create three diagrams, not just one:

### Diagram A: Full System Architecture

Used in the methodology section.

### Diagram B: Retrieval And Answer Pipeline

Used in the model/system section.

### Diagram C: Data Architecture

Used in the dataset/corpus section.

## 16. Tables You Should Include

### Table 1: Dataset Composition

Columns:

- source type
- file/group name
- number of records
- example fields

### Table 2: System Components

Columns:

- component
- implementation file
- function

Suggested entries:

- chat route
- chatbot service
- RAG pipeline
- legal search API
- frontend chat UI

### Table 3: Baseline Comparison

Columns:

- method
- retrieval
- citations
- groundedness
- answer generation

### Table 4: Quantitative Results

Columns:

- method
- Recall@k
- MRR
- groundedness
- hallucination rate
- usefulness score

### Table 5: Error Analysis

Columns:

- error type
- example
- cause
- mitigation

### Table 6: Cloud Data Inventory

Columns:

- cloud prefix
- dataset type
- format
- paper role

Suggested entries:

- `jurisgpt-all-datasets/samples/companies_act_sections.json`
- `jurisgpt-all-datasets/samples/case_summaries.json`
- `jurisgpt-all-datasets/samples/founder_agreement_clauses.json`
- `jurisgpt-all-datasets/indian_law_json/...`
- `jurisgpt-all-datasets/indian_legal/...`
- `jurisgpt-all-datasets/sc_judgments_chunked/...`

### Table 7: Query Categories Used In Evaluation

Columns:

- category
- example query
- expected source type
- evaluation objective

### Table 8: Human Evaluation Rubric

Columns:

- metric
- scoring scale
- definition

Example metrics:

- correctness
- groundedness
- completeness
- citation usefulness
- trustworthiness

## 16A. Figure And Table Placement Plan

Recommended placement in the paper:

### Introduction

- no large tables
- optionally one motivating figure

### System Architecture Section

- Figure 1: full architecture
- Figure 2: query flow
- Figure 4: response schema

### Dataset Section

- Figure 3: corpus architecture
- Table 1: dataset composition
- Table 6: cloud data inventory

### Experimental Setup

- Table 2: system components
- Table 3: baseline comparison
- Table 7: query categories
- Table 8: human evaluation rubric

### Results

- Graphs 1 through 10 as needed
- Table 4 quantitative results
- Table 5 error analysis

## 16B. What Visuals Matter Most If You Need To Prioritize

If you cannot include everything, prioritize:

1. full system architecture diagram
2. dataset composition table
3. retrieval performance graph
4. groundedness / hallucination graph
5. human evaluation graph
6. error analysis table

Those six visuals are enough for a strong paper draft.

## 17. Example Abstract Template

Use this as a starting point:

JurisGPT is a citation-grounded legal assistant designed for Indian startup and corporate law research. The system combines a curated legal corpus, retrieval-based source selection, structured answer generation, and confidence-aware response formatting to support grounded legal question answering. Unlike generic conversational models, JurisGPT emphasizes source transparency through citations, evidence snippets, and explicit limitations. We present the system architecture, corpus design, and evaluation methodology, and compare the proposed assistant against non-retrieval and weaker retrieval baselines. Experimental results show that domain-specific retrieval improves answer groundedness, citation usefulness, and user trustworthiness for startup-law legal research tasks. These findings suggest that research-oriented legal assistants can provide practical value without positioning themselves as substitutes for legal professionals.

## 18. Example Problem Statement

Startup founders and MSMEs frequently need timely answers to legal questions related to incorporation, contracts, compliance, governance, and employment. However, legal information is fragmented across statutes, case law, and regulatory materials, and generic large language models often produce confident but weakly grounded responses. This creates a need for a domain-specific legal assistant that prioritizes retrieval, citations, and transparency over generic fluency.

## 19. Example Limitations Section

Use points like:

- corpus coverage is currently strongest in startup and corporate law, not all legal domains
- some evaluated sources are structured summaries rather than full raw judgments
- system reliability depends on corpus quality and retrieval quality
- the assistant is for legal research support, not professional legal advice

## 20. What To Avoid Claiming In The Paper

Do not claim:

- AI lawyer replacement
- complete legal correctness
- universal coverage of Indian law
- autonomous legal advice
- production-grade compliance automation across all modules

## 21. Reproducibility Checklist

Before submission, freeze:

1. corpus version
2. cloud object paths
3. retrieval settings
4. embedding model
5. evaluated prompt version
6. evaluation dataset
7. baseline definitions
8. metrics script
9. screenshots/figures
10. exact code branch or commit

## 22. Paper Writing Order

Best writing order:

1. title
2. problem statement
3. system architecture
4. dataset/corpus section
5. evaluation methodology
6. tables and results
7. discussion
8. abstract last

## 22A. Suggested Section-Wise Writing Content

### Introduction

Write about:

- difficulty of legal research for startups
- risks of generic LLM hallucination
- need for citation-grounded assistance

### Related Work

Compare against:

- general legal LLM papers
- Indian legal assistant papers
- RAG-based legal QA systems

### Dataset / Corpus

Write about:

- DigitalOcean Spaces storage
- actual bucket prefixes
- structured sample data
- Indian law JSON corpus
- extended cloud datasets

### System Design

Write about:

- frontend interaction flow
- backend orchestration
- retrieval pipeline
- confidence and limitation logic
- structured response schema

### Experimental Setup

Write about:

- baselines
- evaluation dataset
- metrics
- human review protocol

### Results

Discuss:

- retrieval gains
- groundedness gains
- failure cases
- latency tradeoffs

### Discussion

Discuss:

- why domain restriction helps
- where the corpus is still weak
- why grounded legal assistance is preferable to generic legal chatbots

## 23. Recommended Next Files To Create

To turn this into a real paper package, create:

- `research/dataset_manifest.md`
- `research/experiment_log.md`
- `research/results_tables.md`
- `research/figure_plan.md`
- `research/evaluation_protocol.md`

## 24. Short Summary

The paper should present JurisGPT as:

- a **citation-grounded legal research assistant**
- focused on **Indian startup and corporate law**
- backed by a **curated cloud-hosted corpus**
- evaluated using **retrieval and answer-quality metrics**
- framed as a **research support system**, not a lawyer replacement
