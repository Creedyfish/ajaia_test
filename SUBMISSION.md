# Submission — Ajaia Docs

**Candidate:** Irvin Elbanbuena
**Email:** ielbanbuenawork@gmail.com
**Repo:** https://github.com/Creedyfish/ajaia_test
**Live URL:** https://ajaia-test.vercel.app/

## Test Credentials

| User | Email | Password |
|------|-------|----------|
| Alice | alice@ajaia.test | password123 |
| Bob | bob@ajaia.test | password123 |
| Carol | carol@ajaia.test | password123 |

Use alice and bob to demonstrate the sharing flow.

## What Is Included

| File | Description |
|------|-------------|
| `README.md` | Local setup and run instructions |
| `ARCHITECTURE.md` | Stack decisions, schema overview, prioritization rationale |
| `AI-WORKFLOW.md` | AI tools used, where AI helped, what was changed or rejected |
| `SUBMISSION.md` | This file |
| `prisma/schema.prisma` | Database schema |
| `prisma/seed.ts` | Seeded users (alice, bob, carol) |
| `tests/sharing.test.ts` | Vitest access control test |
| `app/` | Next.js App Router — pages, API routes, auth |
| `components/` | Editor, ShareModal, UI components |
| `lib/` | Prisma singleton, auth config |

## What Works End to End

- Login with seeded credentials
- Create, rename, and delete documents
- Rich text editing — bold, italic, underline, headings, bullet and numbered lists
- Autosave with "Saved / Saving..." indicator
- File upload — `.txt`, `.md`, `.docx` imported as editable documents
- Share a document with another user by email
- Owned and Shared with me tabs on the dashboard
- ShareModal visible in editor for document owners only
- Persistence — documents and sharing survive refresh
- Automated test — sharing access control verified with Vitest

## What Is Incomplete

- **Role enforcement** — the `Role` enum (VIEWER / EDITOR) exists in the schema but is not enforced in the UI. All shared users currently have edit access regardless of role.
- **UI polish** — shadcn/ui is installed but the interface is minimal. Layout and visual consistency would be improved with more time.

## What I Would Build Next (2–4 More Hours)

1. Role-based access enforcement — VIEWER cannot edit, EDITOR can
2. Version history — snapshot on save, restore from sidebar
3. UI polish — consistent layout, spacing, and empty states across dashboard and editor
