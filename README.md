# Ajaia Docs

A lightweight collaborative document editor built with Next.js 14, TipTap, Prisma, and Neon Postgres.

## Live Demo

**URL:** https://ajaia-test.vercel.app/

### Test Credentials

| User  | Email            | Password    |
| ----- | ---------------- | ----------- |
| Alice | alice@ajaia.test | password123 |
| Bob   | bob@ajaia.test   | password123 |
| Carol | carol@ajaia.test | password123 |

## Features

- **Document editing** — rich text with bold, italic, underline, headings, and bullet/numbered lists
- **Autosave** — content saves automatically with a "Saved / Saving..." indicator
- **File upload** — import `.txt`, `.md`, or `.docx` files as editable documents
- **Sharing** — share documents with other users by email, with distinct "Owned" and "Shared with me" tabs
- **Persistence** — documents and sharing data survive refresh and session changes

## Local Setup

### Prerequisites

- Node.js 18+
- A Neon Postgres database ([neon.tech](https://neon.tech))

### 1. Clone the repo

```bash
git clone https://github.com/Creedyfish/ajaia_test
cd ajaia_test
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=your_neon_connection_string
NEXTAUTH_SECRET=any_random_string
NEXTAUTH_URL=http://localhost:3000
```

### 4. Run database migrations and seed

```bash
npx prisma migrate dev
npx prisma db seed
```

This creates the database tables and seeds three test users: alice, bob, and carol.

### 5. Generate Prisma client

```bash
npx prisma generate
```

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to login.

## Running Tests

```bash
npm run test
```

Tests verify the sharing access control logic directly against the database — alice creates a doc, shares it with bob, bob can access it, carol cannot.

> **Note:** Requires a valid `DATABASE_URL` in your `.env` file and seeded users.

## File Upload

Supported file types: `.txt`, `.md`, `.docx`

Uploaded files are parsed and converted into new editable documents. Other file types are rejected with a clear error message.

## Tech Stack

| Layer      | Technology                |
| ---------- | ------------------------- |
| Framework  | Next.js 14 App Router     |
| Editor     | TipTap                    |
| Auth       | NextAuth.js (Credentials) |
| Database   | Neon Postgres             |
| ORM        | Prisma                    |
| Styling    | Tailwind CSS + shadcn/ui  |
| Testing    | Vitest                    |
| Deployment | Vercel                    |

## What Was Intentionally Scoped Out

- Real-time collaboration (WebSockets / live cursors)
- Role-based permissions (viewer vs editor enforcement)
- Version history
- Export to PDF or Markdown

Given the 4–6 hour timebox, I prioritized depth in the core editing, persistence, and sharing flows over breadth.

## Running in Production

The app is deployed on Vercel with environment variables set via the Vercel dashboard. The Neon database is shared between local and production environments via `DATABASE_URL`.
