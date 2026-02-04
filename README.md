# JurisGPT - AI-Powered Legal Services Platform

JurisGPT is an AI-powered legal services platform for Indian startups that generates Founder Agreements using GPT-4 and lawyer review.

## Project Structure

This project is organized into separate backend and frontend:

```
jurisgpt/
├── backend/          # FastAPI Python backend
├── frontend/         # Next.js 14 frontend
└── README.md        # This file
```

## Quick Start

### Backend Setup

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install email-validator
cp .env.example .env
# Edit .env with your API keys
uvicorn app.main:app --reload
```

See [backend/README.md](backend/README.md) for detailed backend setup.

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your API URL
npm run dev
```

See [frontend/README.md](frontend/README.md) for detailed frontend setup.

## Features

- ✅ AI-powered document generation (GPT-4)
- ✅ Multi-step form for Founder Agreement creation
- ✅ Lawyer review workflow
- ✅ Document storage and versioning
- ✅ Email notifications
- ⏳ Payment integration (to be added)
- ⏳ User authentication (to be added)

## Tech Stack

### Backend
- FastAPI (Python)
- PostgreSQL (Supabase)
- OpenAI GPT-4o API
- python-docx for document generation
- Resend for email notifications

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Hook Form + Zod validation

## Required Services (Backend Only)

1. **Supabase** - Database
   - Sign up at https://supabase.com
   - Run migration: `backend/migrations/001_initial_schema.sql`
   - Create storage bucket: "documents"

2. **OpenAI** - AI document generation
   - Sign up at https://platform.openai.com
   - Get API key from https://platform.openai.com/api-keys

3. **Resend** - Email notifications
   - Sign up at https://resend.com
   - Get API key from https://resend.com/api-keys

**Note:** Frontend works independently and doesn't require these services.

## Access URLs

Once running:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Development

### Running Both Services

**Terminal 1 - Backend**:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

## License

Private - All rights reserved
