# PostIQ – AI Social Media Pre-Post Intelligence Platform

> Generate, analyse, and optimise social media posts with AI-powered intelligence.

![Tech Stack](https://img.shields.io/badge/Next.js-15-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-336791?style=flat-square)

## Features

- **AI Post Generation** — Platform-optimised content with hook-first strategy
- **Platform Adaptation** — Transform one post into 5 platform-specific versions
- **Structural Analysis** — Extract hooks, CTAs, emotional triggers, readability
- **Engagement Scoring** — Deterministic scoring across 7 dimensions (0-100)
- **Risk Detection** — Flag spam, bait, caps overuse, sensitive content
- **Image Optimisation** — Resize to 1:1, 4:5, 16:9, 9:16 with WebP compression
- **JWT Authentication** — Secure auth with bcrypt and rate limiting

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, TailwindCSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| AI | OpenAI API (abstraction layer with mock fallback) |
| Images | Sharp |
| Auth | JWT + bcrypt |

## Project Structure

```
POSTIQ/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment config
│   │   ├── middleware/       # Auth, errors, rate limiting, validation
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic (AI, scoring, risk, etc.)
│   │   ├── utils/            # Logger, prompt templates
│   │   └── index.ts          # Express server entry
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # React components
│   │   └── lib/              # API client, auth, types
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── api.md                # API documentation
│   ├── schema.sql            # Raw SQL schema
│   └── PostIQ.postman_collection.json
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (or Supabase)
- OpenAI API key (optional — mock mode works without it)

### 1. Backend Setup

```bash
cd backend
cp .env.example .env       # Edit with your values
npm install
npx prisma generate
npx prisma db push         # Push schema to your database
npm run dev                # Starts on http://localhost:4000
```

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                # Starts on http://localhost:3000
```

### 3. Test the API

Register a user, then use the token for all requests:
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:password@localhost:5432/postiq
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-your-key    # Optional
OPENAI_MODEL=gpt-4-turbo-preview
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get profile |
| POST | `/api/generate` | Generate post |
| GET | `/api/generate/history` | Post history |
| POST | `/api/adapt` | Adapt to platforms |
| POST | `/api/analyse` | Structural analysis |
| POST | `/api/score` | Engagement scoring |
| POST | `/api/risk` | Risk detection |
| POST | `/api/image/optimise` | Image optimisation |

See [docs/api.md](docs/api.md) for full documentation.

## Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel
```
Set `NEXT_PUBLIC_API_URL` to your backend URL.

### Backend → Render / Railway
1. Create a web service pointing to `backend/`
2. Build command: `npm install && npx prisma generate && npm run build`
3. Start command: `npm start`
4. Set all environment variables from `.env.example`

### Database → Supabase
1. Create a Supabase project
2. Copy the connection string to `DATABASE_URL`
3. Run `npx prisma db push`

## Phase 2 Roadmap (Architected, Not Built)

- **ML Engagement Prediction** — Train on historical data for platform-specific scoring
- **User Analytics** — Historical performance dashboard with trends
- **Team Collaboration** — Multi-user workspaces with role-based access
- **A/B Testing Simulation** — Compare variants before posting
- **SaaS Billing** — Stripe integration with plan management (schema includes `planType`)
- **Brand Profiles** — Save tone, audience, and style preferences (table ready)

## Disclaimer

PostIQ is **not affiliated** with Instagram, LinkedIn, X (Twitter), Facebook, or TikTok.
All previews are **generic simulations** and do not represent actual platform UIs.

## License
jAM ransom
