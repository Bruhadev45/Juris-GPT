# JurisGPT Backend — Detailed Technical Presentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture & Directory Structure](#3-architecture--directory-structure)
4. [Application Entry Point (`main.py`)](#4-application-entry-point-mainpy)
5. [Configuration Management (`config.py`)](#5-configuration-management-configpy)
6. [Database Layer (`database.py`)](#6-database-layer-databasepy)
7. [Database Schema & Migrations](#7-database-schema--migrations)
8. [Data Models (`models/`)](#8-data-models-models)
9. [Request/Response Schemas (`schemas/`)](#9-requestresponse-schemas-schemas)
10. [API Routes — Core Business Logic (`routes/`)](#10-api-routes--core-business-logic-routes)
    - 10.1 [Companies API](#101-companies-api)
    - 10.2 [Matters API](#102-matters-api)
    - 10.3 [Documents API](#103-documents-api)
    - 10.4 [Admin / Lawyer Review API](#104-admin--lawyer-review-api)
    - 10.5 [AI Chatbot API](#105-ai-chatbot-api)
    - 10.6 [Legal Data & Search API](#106-legal-data--search-api)
    - 10.7 [Compliance Deadlines API](#107-compliance-deadlines-api)
    - 10.8 [Legal Templates API](#108-legal-templates-api)
    - 10.9 [Document Review API](#109-document-review-api)
    - 10.10 [Contract Analyzer API](#1010-contract-analyzer-api)
    - 10.11 [Legal Calculator API](#1011-legal-calculator-api)
    - 10.12 [RTI Application Generator API](#1012-rti-application-generator-api)
    - 10.13 [Legal News API](#1013-legal-news-api)
    - 10.14 [Document Vault API](#1014-document-vault-api)
    - 10.15 [Settings, Support, Team & Integrations APIs](#1015-settings-support-team--integrations-apis)
11. [Services Layer (`services/`)](#11-services-layer-services)
    - 11.1 [AI Analyzer Service](#111-ai-analyzer-service)
    - 11.2 [AI Document Generator Service](#112-ai-document-generator-service)
    - 11.3 [Chatbot Service (NyayaSetu)](#113-chatbot-service-nyayasetu)
    - 11.4 [Document Service](#114-document-service)
    - 11.5 [Email Service](#115-email-service)
12. [Utility Functions (`utils/`)](#12-utility-functions-utils)
13. [External Integrations](#13-external-integrations)
14. [Security Considerations](#14-security-considerations)
15. [Deployment](#15-deployment)
16. [API Endpoint Summary Table](#16-api-endpoint-summary-table)
17. [Data Flow Diagrams](#17-data-flow-diagrams)

---

## 1. Project Overview

**JurisGPT** is an AI-powered legal services platform designed specifically for **Indian startups and MSMEs** (Micro, Small & Medium Enterprises). The backend is a RESTful API built with **FastAPI** (Python) that serves as the core engine for:

- **AI-powered legal document generation** (Founder Agreements, NDAs, Employment Contracts, etc.)
- **Smart contract analysis** with clause-by-clause risk assessment
- **Legal chatbot (NyayaSetu)** for real-time legal Q&A using RAG (Retrieval-Augmented Generation)
- **Compliance tracking** with deadline management and AI risk assessments
- **RTI (Right to Information) application generation** for Indian government departments
- **Legal news aggregation** with AI-generated summaries
- **Document vault** for secure document storage and management
- **Legal calculators** (Stamp Duty, Court Fees, GST, TDS, Gratuity, EMI)

The platform is built to comply with Indian legal frameworks including the **Companies Act 2013**, **Indian Contract Act 1872**, **Arbitration and Conciliation Act 1996**, **IT Act 2000**, and **DPDPA 2023**.

### Current Version: `0.2.0`

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | FastAPI 0.109+ | High-performance async Python web framework |
| **Server** | Uvicorn | ASGI server for running the FastAPI app |
| **Language** | Python 3.11+ | Core programming language |
| **Database** | Supabase (PostgreSQL) | Cloud-hosted PostgreSQL with built-in auth & storage |
| **AI/LLM** | OpenAI GPT-4o | Document generation, contract analysis, chatbot |
| **Document Gen** | python-docx | Converting Markdown legal docs to Word (.docx) |
| **PDF Parsing** | PyPDF2 | Extracting text from uploaded PDF contracts |
| **Email** | Resend | Transactional email notifications |
| **Payments** | Razorpay | Payment gateway for legal service fees |
| **HTTP Client** | httpx | Async HTTP requests for integration checks |
| **Validation** | Pydantic v2 | Data validation and serialization |
| **Config** | pydantic-settings | Environment variable management |
| **File Upload** | python-multipart | Handling multipart file uploads |
| **Containerization** | Docker | Deployment containerization |

### Key Dependencies (`requirements.txt`)

```
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
python-dotenv>=1.0.0
pydantic>=2.8.0
pydantic-settings>=2.2.0
supabase>=2.3.0
openai>=1.12.0
python-docx>=1.1.0
razorpay>=1.4.1
resend>=0.7.0
httpx>=0.26.0
python-multipart>=0.0.6
PyPDF2>=3.0.0
```

---

## 3. Architecture & Directory Structure

The backend follows a **layered architecture** pattern separating concerns into routes, services, models, schemas, and utilities.

```
backend/
├── app/
│   ├── __init__.py            # Package initializer (empty)
│   ├── main.py                # FastAPI application entry point
│   ├── config.py              # Environment configuration (Settings)
│   ├── database.py            # Supabase client initialization
│   │
│   ├── models/                # Pydantic data models (domain objects)
│   │   ├── __init__.py        # Exports all models
│   │   ├── user.py            # UserProfile model
│   │   ├── company.py         # Company model
│   │   ├── founder.py         # Founder model
│   │   ├── matter.py          # LegalMatter model
│   │   ├── document.py        # Document model
│   │   ├── payment.py         # Payment model
│   │   ├── review.py          # LawyerReview model
│   │   └── preference.py      # LegalPreference model
│   │
│   ├── schemas/               # Request/Response schemas (API contracts)
│   │   ├── __init__.py        # Exports all schemas
│   │   ├── company.py         # CompanyCreate, CompanyResponse
│   │   ├── founder.py         # FounderCreate, FounderResponse
│   │   ├── matter.py          # MatterCreate, MatterResponse
│   │   ├── document.py        # DocumentGenerateRequest, DocumentResponse
│   │   ├── payment.py         # Payment-related schemas
│   │   └── preference.py      # LegalPreferenceCreate, LegalPreferenceResponse
│   │
│   ├── routes/                # API route handlers (18 route modules)
│   │   ├── __init__.py        # Package initializer
│   │   ├── companies.py       # Company CRUD
│   │   ├── matters.py         # Legal matter management
│   │   ├── documents.py       # Document generation & download
│   │   ├── admin.py           # Lawyer review admin panel
│   │   ├── auth.py            # Authentication (currently disabled)
│   │   ├── chatbot.py         # NyayaSetu AI chatbot
│   │   ├── legal_data.py      # Indian law search & case database
│   │   ├── compliance.py      # Compliance deadline tracker
│   │   ├── templates.py       # Legal document templates
│   │   ├── reviews.py         # Smart document review (AI)
│   │   ├── analyzer.py        # Contract analyzer (AI)
│   │   ├── calculator.py      # Legal fee calculators
│   │   ├── rti.py             # RTI application generator
│   │   ├── news.py            # Legal news feed
│   │   ├── vault.py           # Document vault/storage
│   │   ├── settings.py        # User settings
│   │   ├── support.py         # Support tickets
│   │   ├── team.py            # Team management
│   │   └── integrations.py    # Integration status checks
│   │
│   ├── services/              # Business logic layer
│   │   ├── __init__.py        # Package initializer
│   │   ├── ai_analyzer.py     # GPT-4o contract analysis engine
│   │   ├── ai_generator.py    # GPT-4o document generation
│   │   ├── chatbot_service.py # NyayaSetu chatbot with RAG
│   │   ├── document_service.py# Markdown-to-DOCX conversion & storage
│   │   └── email_service.py   # Transactional email via Resend
│   │
│   ├── utils/                 # Utility functions
│   │   ├── __init__.py        # Package initializer
│   │   ├── auth.py            # Auth utilities (currently disabled)
│   │   └── validators.py      # Equity & founder count validators
│   │
│   └── tasks/                 # Background tasks (reserved for future)
│       └── __init__.py
│
├── data/                      # Local data storage
│   ├── reviews.json           # Stored document reviews
│   └── (runtime JSON files)   # Settings, tickets, team, etc.
│
├── migrations/
│   └── 001_initial_schema.sql # PostgreSQL database schema
│
├── tests/
│   └── __init__.py            # Test package
│
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Docker container config
├── setup.sh                   # Local setup script
└── README.md                  # Backend documentation
```

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                      │
│              http://localhost:3000                         │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTP/REST API Calls
                       ▼
┌──────────────────────────────────────────────────────────┐
│                  FastAPI Application                       │
│              http://localhost:8000                         │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Routes     │  │  Schemas    │  │   Middleware     │  │
│  │  (18 modules)│  │  (Pydantic) │  │  (CORS, etc.)   │  │
│  └──────┬──────┘  └─────────────┘  └─────────────────┘  │
│         │                                                 │
│  ┌──────▼──────────────────────────────────────────────┐ │
│  │              Services Layer                          │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │ │
│  │  │AI Analyzer│ │AI Gen    │ │Chatbot   │            │ │
│  │  │(GPT-4o)  │ │(GPT-4o)  │ │(RAG+GPT) │            │ │
│  │  └──────────┘ └──────────┘ └──────────┘            │ │
│  │  ┌──────────┐ ┌──────────┐                          │ │
│  │  │Doc Service│ │Email Svc │                          │ │
│  │  │(python-  │ │(Resend)  │                          │ │
│  │  │ docx)    │ │          │                          │ │
│  │  └──────────┘ └──────────┘                          │ │
│  └─────────────────────────────────────────────────────┘ │
│         │                                                 │
│  ┌──────▼───────┐  ┌─────────────┐  ┌───────────────┐   │
│  │  Supabase    │  │  OpenAI     │  │  Local JSON   │   │
│  │  (PostgreSQL)│  │  GPT-4o API │  │  Data Files   │   │
│  └──────────────┘  └─────────────┘  └───────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Application Entry Point (`main.py`)

The `main.py` file is the heart of the backend. It:

1. **Creates the FastAPI application** with metadata (title, description, version)
2. **Configures CORS middleware** to allow cross-origin requests from the frontend
3. **Registers all 18 route modules** with appropriate URL prefixes and tags
4. **Provides a health check endpoint** at `GET /health`

### How It Works

```python
app = FastAPI(
    title="JurisGPT API",
    description="AI-powered legal services platform for Indian startups and MSMEs",
    version="0.2.0",
)
```

- The app object is the central FastAPI instance
- It auto-generates **OpenAPI/Swagger documentation** at `/docs`
- Version tracking helps in API versioning

### CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # ["http://localhost:3000", ...]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

- Allows the Next.js frontend (running on port 3000) to make API calls
- Supports all HTTP methods and headers
- Credentials (cookies, auth headers) are permitted

### Router Registration

Routes are organized into **three phases**:

| Phase | Routes | Purpose |
|-------|--------|---------|
| **Core** | companies, matters, documents, admin, chatbot, legal_data | Primary business operations |
| **Phase 1** | compliance, templates, reviews, settings, support, team, integrations | Extended features |
| **Phase 2** | vault, analyzer, calculator, rti, news | Advanced AI-powered features |

Each router is registered with a URL prefix (e.g., `/api/companies`) and a tag for Swagger docs grouping.

---

## 5. Configuration Management (`config.py`)

The configuration uses **pydantic-settings** for type-safe environment variable management.

```python
class Settings(BaseSettings):
    supabase_url: Optional[str] = "https://placeholder.supabase.co"
    supabase_service_key: Optional[str] = "placeholder-service-key"
    openai_api_key: Optional[str] = "sk-placeholder"
    razorpay_key_id: Optional[str] = None
    razorpay_key_secret: Optional[str] = None
    resend_api_key: Optional[str] = "re_placeholder"
    database_url: Optional[str] = None
    environment: str = "development"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]
```

### Key Features

- **Automatic `.env` file loading** — reads from a `.env` file in the backend directory
- **Default placeholders** — the app starts even without real API keys (graceful degradation)
- **Case-insensitive** — `OPENAI_API_KEY` or `openai_api_key` both work
- **Singleton pattern** — `settings = Settings()` is instantiated once at module level

### Environment Variables Required

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | Yes (for DB) | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes (for DB) | Supabase service role key |
| `OPENAI_API_KEY` | Yes (for AI) | OpenAI API key for GPT-4o |
| `RESEND_API_KEY` | Optional | Email service API key |
| `RAZORPAY_KEY_ID` | Optional | Payment gateway key |
| `RAZORPAY_KEY_SECRET` | Optional | Payment gateway secret |
| `ENVIRONMENT` | Optional | `development` or `production` |

---

## 6. Database Layer (`database.py`)

```python
from supabase import create_client, Client
from app.config import settings

try:
    supabase: Client = create_client(settings.supabase_url, settings.supabase_service_key)
except Exception as e:
    print(f"Warning: Supabase client initialization failed: {e}")
    supabase = None
```

### Key Design Decisions

- **Supabase as BaaS** — provides PostgreSQL + Auth + Storage + Realtime out of the box
- **Graceful failure** — if Supabase credentials are missing, the app still starts but DB operations will fail
- **Service role key** — uses the admin-level key for backend operations (bypasses Row Level Security)
- **Singleton client** — one Supabase client instance shared across the application

---

## 7. Database Schema & Migrations

The database schema is defined in `migrations/001_initial_schema.sql` and contains **8 tables** with proper relationships, constraints, and security policies.

### Entity-Relationship Diagram

```
┌──────────────────┐     ┌──────────────────┐
│  user_profiles   │     │    companies      │
│──────────────────│     │──────────────────│
│ id (PK, FK→auth) │◄───┤ user_id (FK)      │
│ email            │     │ id (PK)           │
│ name             │     │ name              │
│ created_at       │     │ description       │
│ updated_at       │     │ state             │
└──────────────────┘     │ authorized_capital│
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼                             ▼
          ┌──────────────────┐          ┌──────────────────┐
          │    founders      │          │  legal_matters    │
          │──────────────────│          │──────────────────│
          │ id (PK)          │          │ id (PK)          │
          │ company_id (FK)  │          │ company_id (FK)  │
          │ name             │          │ matter_type      │
          │ email            │          │ status           │
          │ role             │          │ price            │
          │ equity_percentage│          └────────┬─────────┘
          │ vesting_months   │                   │
          │ cliff_months     │     ┌─────────────┼─────────────────┐
          └──────────────────┘     ▼             ▼                 ▼
                         ┌────────────┐  ┌──────────────┐  ┌──────────────────┐
                         │ documents   │  │  payments     │  │ lawyer_reviews   │
                         │────────────│  │──────────────│  │──────────────────│
                         │ id (PK)    │  │ id (PK)      │  │ id (PK)          │
                         │ matter_id  │  │ matter_id    │  │ matter_id (FK)   │
                         │ content    │  │ amount       │  │ lawyer_id (FK)   │
                         │ version    │  │ razorpay_*   │  │ status           │
                         │ is_final   │  │ status       │  │ notes            │
                         │ storage_url│  └──────────────┘  │ changes_requested│
                         │ file_name  │                     └──────────────────┘
                         └────────────┘
                                             ┌──────────────────┐
                                             │ legal_preferences │
                                             │──────────────────│
                                             │ id (PK)          │
                                             │ matter_id (FK)   │
                                             │ non_compete      │
                                             │ dispute_resolution│
                                             │ governing_law    │
                                             └──────────────────┘
```

### Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user_profiles` | User accounts linked to Supabase Auth | id, email, name |
| `companies` | Registered companies/startups | name, state, authorized_capital |
| `founders` | Company founders with equity details | name, role, equity_percentage, vesting_months, cliff_months |
| `legal_matters` | Legal service requests | matter_type, status (7 states), price |
| `documents` | Generated legal documents | content (markdown), version, is_final, storage_url |
| `payments` | Razorpay payment records | amount, razorpay_order_id, status |
| `lawyer_reviews` | Human lawyer review queue | status (pending/approved/changes_requested) |
| `legal_preferences` | Per-matter legal preferences | non_compete, dispute_resolution, governing_law |

### Matter Status State Machine

```
draft → payment_pending → ai_generating → lawyer_review → approved → completed
                                              │
                                              └──→ rejected
```

### Security Features

- **Row Level Security (RLS)** enabled on all sensitive tables
- Users can only access their own data
- Admin policies restrict lawyer reviews to `@jurisgpt.com` email domain
- UUID primary keys prevent enumeration attacks

---

## 8. Data Models (`models/`)

Models represent the **domain entities** as Pydantic BaseModel classes. They map directly to database table rows.

### All 8 Models

| Model | File | Key Fields | Description |
|-------|------|------------|-------------|
| `UserProfile` | `user.py` | id, email, name, created_at | User account information |
| `Company` | `company.py` | id, user_id, name, state, authorized_capital | Registered company |
| `Founder` | `founder.py` | id, company_id, name, email, role, equity_percentage, vesting_months, cliff_months | Company founder details |
| `LegalMatter` | `matter.py` | id, company_id, matter_type, status, price | A legal service request |
| `Document` | `document.py` | id, matter_id, content, version, is_final, storage_url | Generated legal document |
| `Payment` | `payment.py` | id, matter_id, amount, razorpay_order_id, status | Payment transaction |
| `LawyerReview` | `review.py` | id, matter_id, lawyer_id, status, notes, changes_requested | Lawyer review entry |
| `LegalPreference` | `preference.py` | id, matter_id, non_compete, dispute_resolution, governing_law | Legal document preferences |

### Type-Safe Enums (Literals)

```python
MatterStatus = Literal["draft", "payment_pending", "ai_generating", "lawyer_review", "approved", "rejected", "completed"]
PaymentStatus = Literal["pending", "processing", "completed", "failed", "refunded"]
ReviewStatus = Literal["pending", "approved", "changes_requested"]
DisputeResolution = Literal["arbitration", "court", "mediation"]
```

All models use `from_attributes = True` in their Config class, enabling ORM-mode serialization from database rows.

---

## 9. Request/Response Schemas (`schemas/`)

Schemas define the **API contracts** — what data the API accepts and returns. They are separate from models to allow different shapes for creation vs. retrieval.

### Schema Design Pattern

```
Request Schema (Create)     →     Route Handler     →     Response Schema
   (validated input)           (business logic)          (formatted output)
```

### Key Schemas

| Schema | Type | Validation Rules |
|--------|------|------------------|
| `CompanyCreate` | Request | name (1-200 chars), state (1-50 chars), authorized_capital (> 0) |
| `CompanyResponse` | Response | Full company data with timestamps |
| `FounderCreate` | Request | name, email (EmailStr), equity (0-100%), vesting (12-120 months), cliff (0-48 months) |
| `MatterCreate` | Request | company_id (UUID), matter_type (default: "founder_agreement") |
| `MatterResponse` | Response | Includes nested company, founders[], and preferences |
| `DocumentGenerateRequest` | Request | matter_id (UUID) |
| `LegalPreferenceCreate` | Request | non_compete (bool), dispute_resolution (enum), governing_law |

### Nested Response Example

The `MatterResponse` schema demonstrates **nested serialization**:

```python
class MatterResponse(BaseModel):
    id: UUID
    company_id: UUID
    matter_type: str
    status: MatterStatus
    price: Decimal
    company: Optional[CompanyResponse] = None      # Nested company
    founders: List[FounderResponse] = []            # List of founders
    preferences: Optional[LegalPreferenceResponse] = None  # Legal preferences
```

---

## 10. API Routes — Core Business Logic (`routes/`)

The backend exposes **18 route modules** with **50+ endpoints** organized by feature.

---

### 10.1 Companies API

**Prefix:** `/api/companies`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/companies` | Create a new company |
| `GET` | `/api/companies/{company_id}` | Get company by ID |

**How It Works:**
- When a company is created, it is stored in Supabase's `companies` table
- The company data includes: name, description, Indian state of incorporation, and authorized capital
- Company ID is a UUID auto-generated by PostgreSQL

---

### 10.2 Matters API

**Prefix:** `/api/matters`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/matters` | Create a legal matter with founders & preferences |
| `GET` | `/api/matters/{matter_id}` | Get matter with all relations |
| `GET` | `/api/matters/{matter_id}/status` | Get matter status |

**How It Works:**
1. The `POST` endpoint accepts a **composite request** containing:
   - Matter data (company_id, matter_type)
   - List of founders (2-4 required, equity must total 100%)
   - Legal preferences (non-compete, dispute resolution, governing law)
2. **Validation** is performed:
   - `validate_founder_count()` — ensures 2-4 founders
   - `validate_equity_sum()` — ensures equity adds up to 100%
3. The matter, founders, and preferences are all inserted into separate tables
4. The `GET` endpoint performs **4 database queries** to assemble the full response:
   - Fetch the matter record
   - Fetch the company
   - Fetch all founders for the company
   - Fetch legal preferences for the matter

---

### 10.3 Documents API

**Prefix:** `/api/documents`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/documents/generate` | Generate AI-powered legal document |
| `GET` | `/api/documents/{document_id}` | Get document metadata |
| `GET` | `/api/documents/{document_id}/download` | Download final document |

**How It Works — Document Generation Flow:**

```
1. Client sends POST /api/documents/generate with matter_id
2. Backend fetches matter, company, founders, and preferences from DB
3. Matter status → "ai_generating"
4. OpenAI GPT-4o generates the document (Markdown format)
5. Markdown is converted to .docx via python-docx
6. .docx is uploaded to Supabase Storage
7. Document record is saved in DB with version number
8. Matter status → "lawyer_review"
9. A lawyer_review entry is created (status: pending)
10. Admin notification email is sent
11. Response returns the document metadata
```

---

### 10.4 Admin / Lawyer Review API

**Prefix:** `/api/admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/reviews/pending` | Get all pending reviews |
| `POST` | `/api/admin/reviews/{review_id}/approve` | Approve a document |
| `POST` | `/api/admin/reviews/{review_id}/request-changes` | Request changes |

**How It Works:**
- **Approve:** Updates review status to "approved", marks document as final, updates matter to "completed", and sends approval email with download link
- **Request Changes:** Updates review status to "changes_requested", updates matter to "rejected", and sends feedback email to the user

---

### 10.5 AI Chatbot API

**Prefix:** `/api/chat`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat/message` | Send a message to NyayaSetu chatbot |
| `POST` | `/api/chat/document-assistance` | Get AI help for document generation |
| `GET` | `/api/chat/suggestions` | Get initial conversation suggestions |
| `GET` | `/api/chat/status` | Check chatbot and RAG pipeline status |

**How It Works:**

The chatbot uses a **3-tier fallback strategy:**

```
1. RAG Pipeline (if vector store is available)
   └── Retrieves relevant Indian law documents
   └── Generates response with citations

2. Direct OpenAI GPT-4o (if API key is valid)
   └── Uses comprehensive Indian law system prompt
   └── Generates context-aware follow-up suggestions

3. Hardcoded Fallback Responses
   └── Pre-written answers for common legal questions
   └── Works even without API keys
```

The chatbot covers **4 suggestion categories** with pre-defined questions:
- Company Formation
- Founder Agreements
- Legal Clauses
- Compliance

---

### 10.6 Legal Data & Search API

**Prefix:** `/api/legal`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/legal/search` | Unified search across laws & cases |
| `GET` | `/api/legal/laws` | List all law sections |
| `GET` | `/api/legal/laws/{law_name}` | Get sections of a specific law |
| `GET` | `/api/legal/cases` | List case summaries |
| `GET` | `/api/legal/cases/{case_id}` | Get case details |
| `POST` | `/api/legal/cases` | Add a new case |
| `GET` | `/api/legal/companies-act` | Companies Act sections |
| `GET` | `/api/legal/stats` | Database statistics |

**How It Works:**
- Loads legal data from **JSON datasets** (IPC, CPC, CrPC, HMA, IDA, IEA, etc.)
- Implements **fuzzy search** with relevance scoring
- Supports filtering by law type, category, and keyword
- Indian law datasets are stored in `data/datasets/indian_law_json/`

---

### 10.7 Compliance Deadlines API

**Prefix:** `/api/compliance`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/compliance/deadlines` | Get all compliance deadlines |
| `GET` | `/api/compliance/upcoming` | Get deadlines due within N days |
| `GET` | `/api/compliance/categories` | Get categories with counts |
| `GET` | `/api/compliance/risk-assessment/{id}` | AI risk assessment for a deadline |

**How It Works:**
- Loads compliance templates from `compliance_deadlines.json`
- **Dynamically generates actual dates** from recurring templates (monthly, quarterly, annual)
- Calculates `days_remaining` and assigns urgency levels:
  - **Critical:** overdue (days < 0)
  - **High:** due within 7 days
  - **Medium:** due within 30 days
  - **Low:** due beyond 30 days
- AI risk assessment uses GPT-4o to analyze penalty information and suggest action items

---

### 10.8 Legal Templates API

**Prefix:** `/api/templates`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/templates` | List all available templates |
| `GET` | `/api/templates/{template_id}` | Get template with field schema |
| `POST` | `/api/templates/{template_id}/generate` | Generate document from template |

**Available Templates (7 types):**

| Template ID | Name | Price (INR) |
|-------------|------|-------------|
| `nda` | Non-Disclosure Agreement | 999 |
| `employment` | Employment Contract | 1,499 |
| `msa` | Master Service Agreement | 1,499 |
| `freelancer` | Freelancer/Contractor Agreement | 999 |
| `mou` | Memorandum of Understanding | 999 |
| `rental` | Rental/Lease Agreement | 999 |
| `poa` | Power of Attorney | 799 |

**How It Works:**
- Each template defines a **field schema** (text, number, boolean, select, textarea fields)
- Required fields are validated before generation
- **GPT-4o generates a complete legal document** in Markdown format
- Template-specific guidance ensures Indian law compliance (Companies Act, Contract Act, Transfer of Property Act, etc.)

---

### 10.9 Document Review API

**Prefix:** `/api/reviews`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/reviews/upload` | Upload document for AI review |
| `GET` | `/api/reviews` | List all reviews |
| `GET` | `/api/reviews/{review_id}` | Get specific review |
| `POST` | `/api/reviews/{review_id}/analyze` | Trigger AI analysis |

**How It Works:**
1. User uploads a document (PDF, DOCX, DOC, or TXT)
2. File is saved locally and metadata stored in `reviews.json`
3. When analysis is triggered:
   - Text is extracted from the uploaded file
   - GPT-4o performs a structured legal review
   - Returns: overall risk score (0-100), clause analysis, risks, and suggestions
4. Analysis covers: Indemnity, Limitation of Liability, Termination, Force Majeure, Confidentiality, Dispute Resolution, Governing Law, IP Assignment, Non-Compete, Payment Terms, Data Protection

---

### 10.10 Contract Analyzer API

**Prefix:** `/api/analyzer`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyzer/upload` | Upload a contract for analysis |
| `POST` | `/api/analyzer/{doc_id}/analyze` | Run AI clause-by-clause analysis |
| `GET` | `/api/analyzer/{doc_id}` | Get analysis results |

**How It Works (Clause-by-Clause Analysis):**
1. Upload: Contract file is saved locally in `data/analyzer_uploads/`
2. Analysis: GPT-4o analyzes **8 key clause types**:
   - Indemnity, Termination, Non-Compete, Intellectual Property
   - Force Majeure, Confidentiality, Limitation of Liability, Governing Law
3. For each clause, the AI determines:
   - **Status:** Present, Missing, or Risky
   - **Risk Level:** Low, Medium, or High
   - **Description** of findings
   - **Extracted text** from the document
   - **Risk factors** identified
   - **Actionable suggestions** for improvement
4. Overall risk score (0-10) and contract type detection
5. References Indian law: Contract Act 1872, Companies Act 2013, Arbitration Act 1996, IT Act 2000, DPDPA 2023

---

### 10.11 Legal Calculator API

**Prefix:** `/api/calculator`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/calculator/types` | List all calculator types |
| `POST` | `/api/calculator/stamp-duty` | Calculate stamp duty by state |
| `POST` | `/api/calculator/court-fees` | Calculate court fees |
| `POST` | `/api/calculator/gst` | Calculate GST |
| `POST` | `/api/calculator/tds` | Calculate TDS |
| `POST` | `/api/calculator/gratuity` | Calculate gratuity |
| `POST` | `/api/calculator/emi` | Calculate loan EMI |

**How It Works:**
- **Stamp Duty:** Uses state-wise rate tables (e.g., Maharashtra 5%, Karnataka 5.6%, Delhi 6%)
- **Court Fees:** Tiered fee schedule based on claim amount
- **GST:** Calculates CGST + SGST (or IGST) based on rate and amount
- **TDS:** Section-wise TDS rates (194C, 194J, 194H, etc.)
- **Gratuity:** Formula: (15 × Last Drawn Salary × Years of Service) / 26
- **EMI:** Standard reducing balance EMI formula

---

### 10.12 RTI Application Generator API

**Prefix:** `/api/rti`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/rti/departments` | List 20 government departments |
| `POST` | `/api/rti/generate` | Generate formatted RTI application |
| `GET` | `/api/rti/applications` | List all generated applications |
| `GET` | `/api/rti/applications/{app_id}` | Get specific application |

**How It Works:**
- Supports **20 Indian government departments** (Ministry of Finance, Home Affairs, Education, etc.)
- Generates a properly formatted RTI application under **Section 6(1) of the RTI Act, 2005**
- Includes:
  - Proper salutation and addressing to the CPIO
  - Information sought section
  - Fee details (Rs. 10 via IPO/DD/Cash/Online)
  - BPL fee exemption under Section 7(5)
  - Applicant details and declaration
  - Guidelines for submission and appeals
- Applications are stored in `rti_applications.json`

---

### 10.13 Legal News API

**Prefix:** `/api/news`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/news` | Get legal news feed |
| `GET` | `/api/news/categories` | Get news categories with counts |
| `GET` | `/api/news/{article_id}/summary` | Get AI-generated article summary |

**Categories:** Supreme Court, High Courts, Legislative Updates, SEBI, RBI, MCA, Tax, DPDPA/Data Privacy

**How It Works:**
- Loads news articles from `legal_news.json`
- Supports filtering by category and search in title/content
- AI summaries are generated on-demand using GPT-4o, focusing on legal implications for Indian businesses

---

### 10.14 Document Vault API

**Prefix:** `/api/vault`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vault` | List vault documents (with filters) |
| `POST` | `/api/vault/upload` | Upload document to vault |
| `GET` | `/api/vault/categories` | Get categories with counts |
| `GET` | `/api/vault/{doc_id}` | Get document metadata |
| `GET` | `/api/vault/{doc_id}/download` | Download document file |
| `DELETE` | `/api/vault/{doc_id}` | Delete document |

**Categories:** Agreements, Contracts, Compliance, Tax, Employment, Corporate, Court Documents

**How It Works:**
- Files are stored locally in `data/vault_files/` with UUID-based filenames
- Metadata (original name, size, type, category, tags) stored in `vault_documents.json`
- Supports filtering by category and tags
- Download endpoint returns the actual file using FastAPI's `FileResponse`

---

### 10.15 Settings, Support, Team & Integrations APIs

#### Settings (`/api/settings`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/settings` | Get all settings |
| `PUT` | `/api/settings/profile` | Update profile settings |
| `PUT` | `/api/settings/notifications` | Update notification preferences |
| `PUT` | `/api/settings/appearance` | Update appearance settings |

Settings are stored in `data/settings.json` with defaults for profile, notifications, and appearance.

#### Support (`/api/support`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/support/tickets` | Create a support ticket |
| `GET` | `/api/support/tickets` | List all tickets |
| `GET` | `/api/support/tickets/{ticket_id}` | Get ticket details |

Support tickets are stored in `data/support_tickets.json`.

#### Team (`/api/team`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/team` | List team members |
| `POST` | `/api/team` | Add team member |
| `PUT` | `/api/team/{member_id}` | Update member |
| `DELETE` | `/api/team/{member_id}` | Remove member |

Team data stored in `data/team.json` with 3 default members.

#### Integrations (`/api/integrations`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/integrations` | Check all integration statuses |

Checks real connectivity for: Supabase (DB ping), OpenAI (key presence), Resend (key), Razorpay (key), Google Drive (available).

---

## 11. Services Layer (`services/`)

The services layer contains the **core business logic** separated from the route handlers.

---

### 11.1 AI Analyzer Service (`ai_analyzer.py`)

This is the **most feature-rich service** in the backend. It provides 6 key functions:

| Function | Purpose | AI Model |
|----------|---------|----------|
| `extract_text_from_file()` | Extract text from PDF/DOCX/TXT files | N/A (PyPDF2, python-docx) |
| `analyze_contract_with_ai()` | Clause-by-clause contract analysis | GPT-4o |
| `review_document_with_ai()` | Legal document review with risk scoring | GPT-4o |
| `generate_template_document()` | Generate legal documents from templates | GPT-4o |
| `summarize_news_article()` | Summarize legal news articles | GPT-4o |
| `assess_compliance_risk()` | Risk assessment for compliance deadlines | GPT-4o |

**Text Extraction:**
- **PDF:** Uses PyPDF2 to extract text page by page
- **DOCX:** Uses python-docx to extract paragraph text
- **TXT:** Direct UTF-8 decoding
- **DOC:** Not directly supported (suggests conversion)

**Contract Analysis (GPT-4o):**
- Documents are truncated to 25,000 characters to fit the context window
- Uses `response_format={"type": "json_object"}` for structured JSON output
- Temperature set to 0.2 for consistent, factual analysis
- Returns structured data with clauses, risks, scores, and suggestions
- Graceful error handling with `_generate_error_analysis()` fallback

**Template Document Generation:**
- Template-specific guidance maps (NDA, Employment, MSA, Freelancer, MoU, Rental, PoA)
- Temperature set to 0.3 for consistent legal language
- Max 6,000 tokens for comprehensive document output
- Returns complete Markdown document ready for use

---

### 11.2 AI Document Generator Service (`ai_generator.py`)

Specialized for **Founder Agreement** generation.

```python
def generate_founder_agreement(
    company_name, company_description, company_state,
    authorized_capital, founders, preferences
) -> str:
```

**How It Works:**
1. Builds a detailed prompt with all company, founder, and preference data
2. Instructs GPT-4o to generate a **Companies Act 2013** compliant document
3. Document includes:
   - Preamble with date and parties
   - Equity distribution
   - Vesting schedule with cliff periods
   - Roles and responsibilities
   - Non-compete clause (if requested)
   - Dispute resolution mechanism
   - Governing law (India)
   - Signature section for all founders
4. Output is in **Markdown format** for conversion to Word document

---

### 11.3 Chatbot Service — NyayaSetu (`chatbot_service.py`)

The chatbot service implements the **NyayaSetu** AI legal assistant.

**Architecture:**

```
NyayaSetuChatbotService (Singleton)
│
├── _lazy_init() ──→ Tries to load RAG pipeline
│
├── get_legal_response()
│   ├── 1st: _get_rag_response()     ← RAG pipeline (if available)
│   ├── 2nd: _get_openai_response()  ← Direct GPT-4o
│   └── 3rd: _get_fallback_response()← Hardcoded responses
│
├── get_document_assistance()         ← Document-specific help
│
├── _generate_smart_suggestions()     ← AI-generated follow-ups
└── _generate_suggestions()           ← Keyword-based follow-ups
```

**RAG Pipeline Integration:**
- Attempts to import `NyayaSetuRAG` from the data directory
- If the vector store is built, it retrieves relevant Indian law documents
- Enhances queries with user context (company name, founders, matter type)
- Returns responses with **source citations** and relevance scores

**OpenAI Direct Mode:**
- Comprehensive system prompt covering 14+ Indian laws
- Maintains conversation history (last 6 messages)
- Generates smart follow-up suggestions using a separate GPT-4o call

**Fallback Mode:**
- Pre-written responses for: vesting, incorporation, non-compete, founder agreements
- Provides useful information even without any API keys configured

---

### 11.4 Document Service (`document_service.py`)

Handles **Markdown → Word document conversion** and storage.

**Key Functions:**

| Function | Purpose |
|----------|---------|
| `markdown_to_docx()` | Converts Markdown to a formatted .docx file |
| `upload_document_to_storage()` | Uploads .docx to Supabase Storage |
| `create_document_version()` | Creates versioned document records |
| `get_latest_document()` | Retrieves the latest document version |

**Markdown to DOCX Conversion:**
- Font: Times New Roman, 12pt
- Handles: H1-H3 headings, bullet lists, numbered lists, regular paragraphs
- Outputs as bytes for storage upload

---

### 11.5 Email Service (`email_service.py`)

Transactional email notifications via **Resend**.

| Function | Trigger |
|----------|---------|
| `send_document_ready_email()` | Document generated, pending review |
| `send_document_approved_email()` | Lawyer approves the document |
| `send_changes_requested_email()` | Lawyer requests changes |
| `send_admin_notification_email()` | New document ready for review |

All emails use HTML templates with JurisGPT branding and include relevant Matter IDs and action links.

---

## 12. Utility Functions (`utils/`)

### Validators (`validators.py`)

```python
def validate_equity_sum(founders: List[FounderCreate]) -> bool:
    """Ensures total equity = 100% (with 0.01% tolerance for floating point)"""

def validate_founder_count(founders: List[FounderCreate]) -> bool:
    """Ensures 2-4 founders"""
```

### Auth (`auth.py`) — Currently Disabled

```python
# get_current_user() — Extract user from Bearer token via Supabase Auth
# verify_user_access() — Check resource ownership
```

Authentication is commented out for development. When enabled, it will:
- Extract Bearer tokens from Authorization headers
- Verify tokens via Supabase Auth
- Enforce resource-level access control

---

## 13. External Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| **Supabase** | PostgreSQL database + file storage + auth | Primary database |
| **OpenAI GPT-4o** | AI document generation + analysis + chatbot | Core AI engine |
| **Resend** | Transactional email delivery | Email notifications |
| **Razorpay** | Payment processing (INR) | Available (optional) |
| **Google Drive** | Cloud document storage | Planned |

The `/api/integrations` endpoint performs **real-time health checks** on each service, pinging Supabase and checking for API key presence.

---

## 14. Security Considerations

| Feature | Implementation |
|---------|---------------|
| **CORS** | Restricted to specific frontend origins |
| **UUID Primary Keys** | Prevents sequential ID enumeration |
| **Row Level Security** | PostgreSQL RLS policies per user |
| **Input Validation** | Pydantic v2 with strict field constraints |
| **File Type Validation** | Only PDF, DOCX, DOC, TXT allowed for uploads |
| **Document Truncation** | AI inputs limited to 25,000 chars (context window protection) |
| **Environment Variables** | Secrets stored in `.env` (not committed to git) |
| **Graceful Degradation** | App runs even if services are unavailable |
| **Service Key Isolation** | Supabase service key used only server-side |

---

## 15. Deployment

### Docker Deployment

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Local Development

```bash
# Setup
./setup.sh

# Run
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production (Railway/Render)

- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Set environment variables in hosting platform dashboard

---

## 16. API Endpoint Summary Table

| # | Method | Endpoint | Feature |
|---|--------|----------|---------|
| 1 | `GET` | `/health` | Health check |
| 2 | `POST` | `/api/companies` | Create company |
| 3 | `GET` | `/api/companies/{id}` | Get company |
| 4 | `POST` | `/api/matters` | Create legal matter |
| 5 | `GET` | `/api/matters/{id}` | Get matter details |
| 6 | `GET` | `/api/matters/{id}/status` | Get matter status |
| 7 | `POST` | `/api/documents/generate` | Generate AI document |
| 8 | `GET` | `/api/documents/{id}` | Get document |
| 9 | `GET` | `/api/documents/{id}/download` | Download document |
| 10 | `GET` | `/api/admin/reviews/pending` | Pending reviews |
| 11 | `POST` | `/api/admin/reviews/{id}/approve` | Approve review |
| 12 | `POST` | `/api/admin/reviews/{id}/request-changes` | Request changes |
| 13 | `POST` | `/api/chat/message` | Chat with NyayaSetu |
| 14 | `POST` | `/api/chat/document-assistance` | Document help |
| 15 | `GET` | `/api/chat/suggestions` | Chat suggestions |
| 16 | `GET` | `/api/chat/status` | Chatbot status |
| 17 | `GET` | `/api/legal/search` | Unified legal search |
| 18 | `GET` | `/api/legal/laws` | List laws |
| 19 | `GET` | `/api/legal/laws/{name}` | Law sections |
| 20 | `GET` | `/api/legal/cases` | List cases |
| 21 | `GET` | `/api/legal/cases/{id}` | Case details |
| 22 | `POST` | `/api/legal/cases` | Add case |
| 23 | `GET` | `/api/legal/companies-act` | Companies Act |
| 24 | `GET` | `/api/legal/stats` | Database stats |
| 25 | `GET` | `/api/compliance/deadlines` | All deadlines |
| 26 | `GET` | `/api/compliance/upcoming` | Upcoming deadlines |
| 27 | `GET` | `/api/compliance/categories` | Deadline categories |
| 28 | `GET` | `/api/compliance/risk-assessment/{id}` | AI risk assessment |
| 29 | `GET` | `/api/templates` | List templates |
| 30 | `GET` | `/api/templates/{id}` | Template details |
| 31 | `POST` | `/api/templates/{id}/generate` | Generate from template |
| 32 | `POST` | `/api/reviews/upload` | Upload for review |
| 33 | `GET` | `/api/reviews` | List reviews |
| 34 | `GET` | `/api/reviews/{id}` | Get review |
| 35 | `POST` | `/api/reviews/{id}/analyze` | AI analysis |
| 36 | `POST` | `/api/analyzer/upload` | Upload contract |
| 37 | `POST` | `/api/analyzer/{id}/analyze` | Analyze contract |
| 38 | `GET` | `/api/analyzer/{id}` | Analysis results |
| 39 | `GET` | `/api/calculator/types` | Calculator types |
| 40 | `POST` | `/api/calculator/stamp-duty` | Stamp duty calc |
| 41 | `POST` | `/api/calculator/court-fees` | Court fees calc |
| 42 | `POST` | `/api/calculator/gst` | GST calc |
| 43 | `POST` | `/api/calculator/tds` | TDS calc |
| 44 | `POST` | `/api/calculator/gratuity` | Gratuity calc |
| 45 | `POST` | `/api/calculator/emi` | EMI calc |
| 46 | `GET` | `/api/rti/departments` | RTI departments |
| 47 | `POST` | `/api/rti/generate` | Generate RTI |
| 48 | `GET` | `/api/rti/applications` | List RTI apps |
| 49 | `GET` | `/api/rti/applications/{id}` | Get RTI app |
| 50 | `GET` | `/api/news` | Legal news feed |
| 51 | `GET` | `/api/news/categories` | News categories |
| 52 | `GET` | `/api/news/{id}/summary` | AI article summary |
| 53 | `GET` | `/api/vault` | List vault docs |
| 54 | `POST` | `/api/vault/upload` | Upload to vault |
| 55 | `GET` | `/api/vault/categories` | Vault categories |
| 56 | `GET` | `/api/vault/{id}` | Get vault doc |
| 57 | `GET` | `/api/vault/{id}/download` | Download from vault |
| 58 | `DELETE` | `/api/vault/{id}` | Delete vault doc |
| 59 | `GET` | `/api/settings` | Get settings |
| 60 | `PUT` | `/api/settings/profile` | Update profile |
| 61 | `PUT` | `/api/settings/notifications` | Update notifications |
| 62 | `PUT` | `/api/settings/appearance` | Update appearance |
| 63 | `POST` | `/api/support/tickets` | Create ticket |
| 64 | `GET` | `/api/support/tickets` | List tickets |
| 65 | `GET` | `/api/support/tickets/{id}` | Get ticket |
| 66 | `GET` | `/api/team` | List team |
| 67 | `POST` | `/api/team` | Add member |
| 68 | `PUT` | `/api/team/{id}` | Update member |
| 69 | `DELETE` | `/api/team/{id}` | Remove member |
| 70 | `GET` | `/api/integrations` | Integration status |

**Total: 70 API endpoints across 18 route modules**

---

## 17. Data Flow Diagrams

### Founder Agreement Generation Flow

```
User (Frontend)
    │
    ▼
POST /api/companies ──→ Create Company (Supabase)
    │
    ▼
POST /api/matters ──→ Create Matter + Founders + Preferences
    │                  Validate: 2-4 founders, equity = 100%
    ▼
POST /api/documents/generate
    │
    ├──→ Fetch: matter, company, founders, preferences
    ├──→ Status: "ai_generating"
    ├──→ GPT-4o: Generate Founder Agreement (Markdown)
    ├──→ python-docx: Convert to .docx
    ├──→ Supabase Storage: Upload .docx
    ├──→ Status: "lawyer_review"
    ├──→ Create lawyer_review entry
    └──→ Email: Notify admin
    │
    ▼
GET /api/admin/reviews/pending ──→ Lawyer reviews document
    │
    ├──→ POST .../approve ──→ Status: "completed", is_final: true
    │                         Email: Approval + download link
    │
    └──→ POST .../request-changes ──→ Status: "rejected"
                                      Email: Feedback to user
```

### Contract Analysis Flow

```
User (Frontend)
    │
    ▼
POST /api/analyzer/upload ──→ Save file locally
    │                         Store metadata in JSON
    ▼
POST /api/analyzer/{id}/analyze
    │
    ├──→ extract_text_from_file() ──→ PDF/DOCX/TXT
    ├──→ Truncate to 25,000 chars
    ├──→ GPT-4o: Analyze 8 clause types
    │   (Indemnity, Termination, Non-Compete, IP,
    │    Force Majeure, Confidentiality, Liability, Governing Law)
    ├──→ Return: risk_score, clauses[], risks[], suggestions[]
    └──→ Save analysis results
    │
    ▼
GET /api/analyzer/{id} ──→ Return full analysis
```

### Chatbot (NyayaSetu) Flow

```
User Message
    │
    ▼
POST /api/chat/message
    │
    ├──→ Try RAG Pipeline
    │    ├── Query vector store (Indian law documents)
    │    ├── Retrieve relevant chunks
    │    ├── Generate answer with citations
    │    └── Return: message + sources + suggestions
    │
    ├──→ (Fallback) Try Direct OpenAI
    │    ├── System prompt: Indian law expert
    │    ├── Include conversation history
    │    ├── Generate response with GPT-4o
    │    ├── Generate follow-up suggestions (separate call)
    │    └── Return: message + suggestions
    │
    └──→ (Fallback) Hardcoded Responses
         ├── Match keywords (vesting, incorporate, etc.)
         └── Return: pre-written answer + suggestions
```

---

## Summary

JurisGPT's backend is a comprehensive, AI-powered legal services API that:

- Serves **70 API endpoints** across **18 feature modules**
- Uses **GPT-4o** for intelligent document generation, contract analysis, and legal chat
- Implements a **3-tier chatbot fallback** (RAG → OpenAI → Hardcoded)
- Manages a full **document lifecycle** (draft → generation → review → approval)
- Provides **Indian law-specific** features (RTI, Stamp Duty, GST, TDS calculators)
- Stores data in **Supabase PostgreSQL** with Row Level Security
- Supports **file upload/download** for contracts, documents, and vault items
- Sends **transactional emails** for document status updates
- Is **containerized with Docker** for easy deployment
- Follows a **clean layered architecture** (routes → services → database)

---

*Document prepared for JurisGPT project presentation*
