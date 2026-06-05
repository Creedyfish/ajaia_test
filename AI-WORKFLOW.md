# AI Workflow Note — Ajaia Docs

## Tools Used

**Claude (Anthropic)** — primary AI tool used throughout the assignment for code generation, debugging, and decision support.

## Where AI Materially Sped Up the Work

**Schema and boilerplate** — Claude generated the initial Prisma schema, seed file, and Prisma singleton with the Neon adapter. This saved roughly 20–30 minutes of documentation reading and trial and error with the serverless adapter setup.

**API routes** — Claude drafted the document CRUD routes, the sharing endpoint, and the file upload handler. The access control logic (ownership check + DocShare lookup) was generated correctly on the first pass.

**Vitest test** — Claude wrote the full sharing access control test. I provided the schema and seed file as context so the generated test matched the actual field names (`docId` instead of `documentId`) and email format (`@ajaia.test`).

**Debugging** — When the vitest run failed with a missing `DATABASE_URL` error, Claude identified that Vitest does not load `.env` automatically and provided the `dotenv.config()` fix for `vitest.config.ts` immediately.

**Middleware and routing** — Claude wrote the root redirect (`/` → `/dashboard` or `/login` based on session) and the NextAuth middleware config.

## What I Suggested or Changed

**Framework choice** — I directed the stack toward Next.js 14 App Router from the start. It is the fastest path to a working full-stack MVP in a timebox like this and I was already familiar with it. AI did not suggest this — it was my call.

**shadcn/ui** — I proposed using shadcn/ui as the component library for consistent, accessible UI primitives. Given more time, this would have made the app look significantly more polished. Due to the time constraint, the UI remained minimal, but the library is installed and components are used throughout.

**Field name correction** — The first version of the vitest test used `documentId` in the `DocShare` create call. My schema uses `docId`. I caught the mismatch from the TypeScript error and corrected it.

## What I Rejected or Did Not Use

I did not use AI-generated output blindly. Every route, component, and config file was reviewed before being used. The overall architecture, stack decisions, and prioritization calls were mine — AI accelerated execution, not judgment.

## How I Verified Correctness

- **Manual browser testing** — ran through the full user flow (login, create doc, format, save, reopen, upload file, share between accounts) on both local and the live Vercel deployment
- **Browser DevTools** — checked network responses to confirm API routes returned correct status codes and payloads
- **Vitest** — ran `npm run test` to confirm the sharing access control test passed against the live Neon database
- **Prisma Studio** — used to inspect the database directly and confirm seed data, document rows, and share rows were created correctly

## Summary

AI handled the majority of code generation and significantly compressed the time needed to go from schema to working product. My contribution was directing the architecture, choosing the stack, catching errors in generated output, and making all prioritization decisions. The combination allowed a full-stack working product to be delivered within the 4–6 hour timebox.
