<p align="center">
  <h1 align="center">JurisGPT</h1>
  <p align="center">
    <strong>AI-Powered Legal Services Platform for Indian Startups</strong>
  </p>
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#installation">Installation</a> •
    <a href="#api-documentation">API Docs</a> •
    <a href="#contributing">Contributing</a>
  </p>
</p>

---

## Overview

**JurisGPT** is a comprehensive AI-powered legal services platform designed specifically for Indian startups and businesses. It streamlines legal document generation, compliance management, and legal research using advanced AI capabilities powered by GPT-4.

The platform provides an end-to-end solution for:
- Automated legal document drafting
- Founder agreement generation with lawyer review workflow
- Indian law compliance tracking
- Legal research and case law analysis
- RTI (Right to Information) filing assistance

## Features

### Document Generation
- **AI-Powered Drafting** — Generate legal documents using GPT-4 with Indian law context
- **Founder Agreements** — Multi-step wizard for creating comprehensive founder agreements
- **Document Templates** — Pre-built templates for common legal documents
- **Version Control** — Track document revisions and changes

### Legal Research & Analysis
- **Case Law Search** — Search through Indian court judgments and case summaries
- **Document Analyzer** — Upload and analyze legal documents for key clauses
- **Legal News Feed** — Stay updated with latest legal developments

### Compliance Management
- **Compliance Calendar** — Track important deadlines and filings
- **Company Registry** — Manage company information and MCA filings
- **Automated Reminders** — Never miss a compliance deadline

### Additional Features
- **Legal Calculator** — Calculate stamp duty, registration fees, and penalties
- **RTI Filing Assistant** — Draft and track RTI applications
- **Secure Document Vault** — Encrypted storage for sensitive documents
- **Team Collaboration** — Invite team members with role-based access
- **Lawyer Review Workflow** — Built-in review and approval process

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance Python web framework |
| **PostgreSQL** | Primary database (via Supabase) |
| **OpenAI GPT-4** | AI document generation and analysis |
| **python-docx** | Word document generation |
| **Resend** | Transactional email service |
| **Razorpay** | Payment processing |

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS** | Utility-first CSS framework |
| **shadcn/ui** | Accessible UI component library |
| **React Hook Form** | Form state management |
| **Zod** | Schema validation |
| **Framer Motion** | Animations |

## Project Structure

```
jurisgpt/
├── backend/                      # FastAPI Python Backend
│   ├── app/
│   │   ├── main.py              # Application entry point
│   │   ├── config.py            # Configuration settings
│   │   ├── database.py          # Database connection
│   │   ├── models/              # SQLAlchemy/Pydantic models
│   │   │   ├── company.py
│   │   │   ├── document.py
│   │   │   ├── founder.py
│   │   │   └── user.py
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.py          # Authentication
│   │   │   ├── documents.py     # Document management
│   │   │   ├── companies.py     # Company operations
│   │   │   ├── chatbot.py       # AI chat interface
│   │   │   ├── compliance.py    # Compliance tracking
│   │   │   ├── analyzer.py      # Document analysis
│   │   │   └── ...
│   │   ├── schemas/             # Request/Response schemas
│   │   ├── services/            # Business logic
│   │   │   ├── ai_generator.py  # GPT-4 integration
│   │   │   ├── chatbot_service.py
│   │   │   └── document_service.py
│   │   └── utils/               # Helper functions
│   ├── migrations/              # Database migrations
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile
│
├── frontend/                     # Next.js React Frontend
│   ├── src/
│   │   ├── app/                 # App Router pages
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── dashboard/       # Dashboard pages
│   │   │   │   ├── page.tsx     # Dashboard home
│   │   │   │   ├── chat/        # AI chat interface
│   │   │   │   ├── vault/       # Document vault
│   │   │   │   ├── compliance/  # Compliance tracker
│   │   │   │   ├── analyzer/    # Document analyzer
│   │   │   │   ├── calculator/  # Legal calculator
│   │   │   │   ├── cases/       # Case management
│   │   │   │   └── ...
│   │   │   └── agreements/      # Agreement wizard
│   │   ├── components/          # Reusable components
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   └── sidebar.tsx      # Navigation sidebar
│   │   ├── lib/                 # Utilities
│   │   │   ├── api.ts           # API client
│   │   │   └── utils.ts         # Helper functions
│   │   └── types/               # TypeScript definitions
│   ├── package.json
│   └── tailwind.config.ts
│
├── data/                         # Datasets & Resources
│   ├── datasets/
│   │   ├── indian_law_json/     # Indian law statutes (IPC, CrPC, etc.)
│   │   ├── kaggle/              # Company datasets
│   │   └── samples/             # Sample data
│   └── processed/               # Processed chunks for RAG
│
└── README.md
```

## Installation

### Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.10
- **PostgreSQL** (or Supabase account)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install email-validator

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys (see Environment Variables section)

# Run database migrations (if using Supabase)
# Execute migrations/001_initial_schema.sql in Supabase SQL editor

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
# or
bun install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your backend URL

# Start development server
npm run dev
# or
bun dev
```

### Environment Variables

#### Backend (.env)
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Email (Resend)
RESEND_API_KEY=re_your-resend-api-key

# Razorpay (optional)
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Documentation

Once the backend is running, access the interactive API documentation:

| Documentation | URL |
|--------------|-----|
| **Swagger UI** | http://localhost:8000/docs |
| **ReDoc** | http://localhost:8000/redoc |
| **Health Check** | http://localhost:8000/health |

### Key API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/documents` | GET, POST | Document management |
| `/api/v1/companies` | GET, POST | Company registry |
| `/api/v1/chat` | POST | AI chatbot |
| `/api/v1/analyze` | POST | Document analysis |
| `/api/v1/compliance` | GET | Compliance deadlines |
| `/api/v1/templates` | GET | Document templates |

## Running the Application

### Development Mode

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### Access URLs
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

## Required Services

| Service | Purpose | Sign Up |
|---------|---------|---------|
| **Supabase** | PostgreSQL database & storage | [supabase.com](https://supabase.com) |
| **OpenAI** | GPT-4 API for AI features | [platform.openai.com](https://platform.openai.com) |
| **Resend** | Email notifications | [resend.com](https://resend.com) |
| **Razorpay** | Payment processing (optional) | [razorpay.com](https://razorpay.com) |

## Data Sources

JurisGPT incorporates multiple Indian legal datasets:

- **Indian Penal Code (IPC)** — Criminal law sections
- **Code of Criminal Procedure (CrPC)** — Criminal procedure
- **Code of Civil Procedure (CPC)** — Civil procedure
- **Indian Evidence Act (IEA)** — Evidence rules
- **Motor Vehicles Act (MVA)** — Traffic laws
- **Companies Act** — Corporate law
- **Case Summaries** — Indian court judgments

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## Roadmap

- [ ] User authentication & authorization
- [ ] Multi-language support (Hindi, regional languages)
- [ ] Mobile application (React Native)
- [ ] Integration with DigiLocker
- [ ] E-signing integration
- [ ] Advanced analytics dashboard
- [ ] API rate limiting & usage tracking

## License

This project is proprietary software. All rights reserved.

---

<p align="center">
  Built with ❤️ for Indian Startups
</p>
