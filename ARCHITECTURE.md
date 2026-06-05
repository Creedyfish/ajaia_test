# Architecture Note — Ajaia Docs

## Overview

Ajaia Docs is a lightweight collaborative document editor built as a full-stack Next.js 14 application. The goal was to ship a working, coherent product slice within a 4–6 hour timebox — prioritizing depth in core flows over broad feature coverage.

## Stack Decisions

### Next.js 14 App Router
Chosen because it is the fastest framework to go from zero to a working full-stack MVP. The App Router collocates API routes, server components, and pages in one repo with no separate backend needed. This saved significant setup time compared to a decoupled frontend/backend approach.

### TipTap
Selected over alternatives (Quill, Slate, ProseMirror directly) because it has a clean React API, first-class TypeScript support, and a StarterKit that ships bold, italic, underline, headings, and lists out of the box. Debounced autosave (500ms) was added to avoid excessive API calls on every keystroke.

### Prisma + Neon Postgres
Prisma was chosen for type-safe database access and straightforward schema management. Neon was chosen as the Postgres provider because it has a generous free tier, a serverless driver (`@neondatabase/serverless`) that works well in Vercel's edge/serverless environment, and fast project setup.

### NextAuth.js (Credentials Provider)
Used for session management with email/password login against hashed passwords in the database. Three seeded users (alice, bob, carol) allow reviewers to test the sharing flow without a real registration system, which was a deliberate scope cut.

### shadcn/ui + Tailwind CSS
shadcn/ui was chosen as the component library for consistent, accessible UI primitives without a heavy dependency footprint. Due to time constraints, the UI remained minimal — the priority was working product logic over visual polish.

## Database Schema

```
User         — id, name, email, password
Document     — id, title, content (Json), ownerId, createdAt, updatedAt
DocShare     — id, docId, userId, role (VIEWER | EDITOR)
```

The `DocShare` table is the core of the sharing model. A user has access to a document if they are either the `ownerId` on the `Document` row, or have a corresponding `DocShare` row. The `@@unique([docId, userId])` constraint prevents duplicate shares.

## Key Prioritization Decisions

| Included | Reason |
|----------|--------|
| Full CRUD + autosave | Core product requirement, highest user value |
| TipTap rich text | Required by assignment, fast to implement with StarterKit |
| File upload (.txt, .md, .docx) | Required by assignment, handled with mammoth + marked |
| Sharing with owned/shared tabs | Required by assignment, clean DB model |
| Vitest access control test | Required by assignment |

| Skipped | Reason |
|---------|--------|
| Real-time collaboration | Highest complexity, biggest timebox risk |
| Role enforcement (VIEWER vs EDITOR) | Role column exists in schema, UI enforcement deprioritized |
| Version history | Good signal but outside core requirements |
| Export to PDF/Markdown | Nice-to-have, not required |
| Visual polish | Deprioritized in favor of working full-stack logic |

## What I Would Build Next (2–4 More Hours)

1. **Role-based access enforcement** — the schema already has the `Role` enum, it is mostly a UI and middleware change
2. **Version history** — add a `DocumentVersion` table, snapshot on every save, show a sidebar list in the editor
3. **UI polish** — the shadcn/ui components are already installed, applying consistent layout and spacing across the dashboard and editor would make the product feel significantly more complete
