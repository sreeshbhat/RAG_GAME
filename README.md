# RAG Detective Game

Production-ready classroom web app for RAG mystery investigations. Students log in from a local registry, investigate evidence-grounded cases, question a Groq-backed detective assistant, report hallucinations, and submit one final accusation per case.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style component foundation
- Framer Motion
- Next.js Route Handlers
- Groq API
- Neon PostgreSQL
- Drizzle ORM
- pgvector-ready retrieval with keyword fallback

## Install dependencies

```bash
npm install
```

## Create Neon PostgreSQL database

Create a Neon project and copy its connection string into `DATABASE_URL`.

## Enable pgvector if using vector search

Run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

This project currently uses keyword fallback retrieval by default. `pgvector` can still be enabled now for future upgrades, but no external embedding provider is required.

## Add students to `data/students.json`

Each student must include:

```json
{
  "id": "stu_001",
  "name": "Aarav Sharma",
  "email": "aarav@example.com",
  "rollNumber": "23EG001"
}
```

## Add crime scenes to `data/cases`

Follow the JSON shape shown in `data/cases/missing-ai-model.json`.

## Configure `.env`

Copy `.env.example` to `.env` and set:

```bash
DATABASE_URL=
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
ADMIN_PASSWORD=
EMBEDDING_PROVIDER=fallback
SESSION_SECRET=
NEXT_PUBLIC_APP_NAME=RAG Detective Game
```

## Run migrations

```bash
npm run db:generate
npm run db:migrate
```

## Seed cases

```bash
npm run seed
```

## Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deploy on Vercel

1. Push the `rag-detective-game` folder to GitHub.
2. Import the repository into Vercel.
3. Add the same environment variables in the Vercel dashboard.
4. Deploy.
5. Visit `/admin`.
6. Seed cases with `POST /api/seed` after admin login.
7. Share `/login` with students.

## Local commands

```bash
npm install
npm run db:generate
npm run db:migrate
npm run seed
npm run dev
```

## Classroom usage guide

1. Add the student roster in `data/students.json`.
2. Add or update case files in `data/cases`.
3. Log in at `/admin` using `ADMIN_PASSWORD`.
4. Seed the current case files into Neon.
5. Students log in individually at `/login`.
6. Students select a case and investigate with a 20-question cap.
7. Review `/scoreboard` during or after class.
8. Export CSV reports from `/admin`.
