# JurisGPT Backend API

FastAPI backend for JurisGPT - AI-powered legal services platform.

## Tech Stack

- FastAPI (Python)
- PostgreSQL (Supabase)
- OpenAI GPT-4o API
- python-docx for document generation
- Resend for email notifications

## Setup

### Prerequisites

- Python 3.11 or 3.12 (Python 3.14 has compatibility issues)
- pip

### Installation

1. **Create virtual environment**:
   ```bash
   python3.12 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   pip install email-validator  # Required for Pydantic EmailStr
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys
   ```

### Environment Variables

Create a `.env` file with:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_api_key
RESEND_API_KEY=your_resend_api_key
DATABASE_URL=your_database_url (optional)
ENVIRONMENT=development
```

### Database Setup

1. Create a Supabase project at https://supabase.com
2. Run the migration: `migrations/001_initial_schema.sql`
3. Create a storage bucket named "documents" in Supabase Storage

### Running the Server

```bash
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Companies
- `POST /api/companies` - Create a company
- `GET /api/companies/{id}` - Get company by ID

### Legal Matters
- `POST /api/matters` - Create a new matter (founder agreement request)
- `GET /api/matters/{id}` - Get matter details
- `GET /api/matters/{id}/status` - Get matter status

### Documents
- `POST /api/documents/generate` - Generate AI document
- `GET /api/documents/{id}` - Get document metadata
- `GET /api/documents/{id}/download` - Download document

### Admin
- `GET /api/admin/reviews/pending` - Get pending reviews
- `POST /api/admin/reviews/{id}/approve` - Approve document
- `POST /api/admin/reviews/{id}/request-changes` - Request changes

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry
│   ├── config.py            # Environment config
│   ├── database.py          # Supabase client
│   ├── models/              # Pydantic models
│   ├── schemas/             # Request/response schemas
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   └── utils/               # Utilities
├── migrations/              # Database migrations
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## Development

### Running Tests

```bash
pytest tests/
```

### Code Formatting

```bash
black app/
isort app/
```

## Deployment

### Docker

```bash
docker build -t jurisgpt-api .
docker run -p 8000:8000 --env-file .env jurisgpt-api
```

### Railway/Render

1. Set environment variables in your hosting platform
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
