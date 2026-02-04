# JurisGPT Frontend

Next.js 15 frontend for JurisGPT - AI-powered legal services platform.

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui components
- React Hook Form + Zod validation

## Setup

### Prerequisites

- Node.js 18+
- npm, yarn, or bun

### Installation

```bash
npm install
# or
bun install
```

### Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Running the Development Server

```bash
npm run dev
# or
bun dev
```

The app will be available at http://localhost:3000

## Project Structure

```
frontend/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── page.tsx         # Landing page
│   │   ├── dashboard/       # User dashboard
│   │   ├── agreements/      # Agreement pages
│   │   └── admin/           # Admin dashboard
│   ├── components/          # React components
│   │   └── ui/             # shadcn/ui components
│   ├── lib/                # Utilities and API client
│   └── types/              # TypeScript types
└── public/                 # Static assets
```

## Available Scripts

- `npm run dev` - Start development server (with Turbopack)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features

- ✅ Professional legal theme
- ✅ Landing page
- ✅ Multi-step form for Founder Agreements
- ✅ Dashboard
- ✅ Admin review interface

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Other Platforms

```bash
npm run build
npm run start
```
