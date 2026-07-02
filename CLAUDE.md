cat << 'EOF'
# Job Tracker — Project Context for Claude Code

## What this is
A personal web app for tracking job applications. Built from scratch as a learning project to develop full-stack SWE skills. The goal is to save jobs applied to (title, company, recruiter, description), automatically extract required skills/technologies from the description using an LLM API, and display them as tags on each job card.

## Tech stack
- **Framework**: Next.js 16 (App Router, TypeScript, Tailwind CSS)
- **Database**: Supabase (hosted Postgres, free tier)
- **ORM**: Prisma 7 — important: Prisma 7 has breaking changes vs v5/v6. Connection URLs live in `prisma.config.ts`, NOT in `schema.prisma`. PrismaClient requires a driver adapter (`@prisma/adapter-pg`) passed explicitly in the constructor.
- **Auth**: Supabase Auth (email/password). Uses `@supabase/ssr` package. Two separate clients: `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (server components/API routes).
- **LLM**: DeepSeek API (`deepseek-chat` model) for skill extraction. Called once per job save, result stored in DB, never re-called for the same job.
- **Styling**: Tailwind + custom CSS token system for theming (see Theming section below)

## Project structure
```
app/
├── api/jobs/route.ts        # POST (create job + extract skills), PATCH (update status/title/notes), DELETE (delete job + cascade)
├── jobs/
│   ├── page.tsx             # Jobs list (server component, queries DB directly)
│   ├── new/page.tsx         # Add job form (client component)
│   ├── [id]/page.tsx        # Job detail page (server component)
│   ├── [id]/EditJobForm.tsx # Edit job inline form (client component)
│   ├── Header.tsx           # Header with email, theme switcher, sign out (client component)
│   ├── StatusSelect.tsx     # Status dropdown per job card (client component)
│   └── DeleteButton.tsx     # Delete with confirmation (client component)
├── login/page.tsx           # Login/signup page (client component)
├── layout.tsx               # Root layout — wraps everything in ThemeProvider
├── globals.css              # Global styles
└── themes.css               # CSS custom properties per theme (see Theming)
lib/
├── prisma.ts                # Shared PrismaClient instance (singleton pattern for dev hot-reload)
├── extractSkills.ts         # DeepSeek API call — takes description string, returns string[] of skill names
├── ThemeProvider.tsx        # React Context for theme switching (client component)
└── supabase/
    ├── client.ts            # Browser Supabase client
    └── server.ts            # Server Supabase client (reads/writes cookies)
prisma/
├── schema.prisma            # DB schema
├── config.ts                # Prisma 7 config (connection URLs live here, not schema.prisma)
└── migrations/              # Migration history — commit these
proxy.ts                     # Route protection (replaces middleware.ts in this Next.js version)
```

## Database schema
```prisma
enum ApplicationStatus {
  APPLIED
  INTERVIEWING
  OFFER
  REJECTED
  WITHDRAWN
}

model Company {
  id        String   @id @default(cuid())
  name      String   @unique
  jobs      Job[]
  createdAt DateTime @default(now())
}

model Skill {
  id        String     @id @default(cuid())
  name      String     @unique
  jobs      JobSkill[]
  createdAt DateTime   @default(now())
}

model Job {
  id            String            @id @default(cuid())
  title         String
  description   String
  recruiterName String?
  notes         String?
  appliedAt     DateTime          @default(now())
  status        ApplicationStatus @default(APPLIED)
  userId        String
  companyId     String
  company       Company           @relation(fields: [companyId], references: [id])
  skills        JobSkill[]
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
}

model JobSkill {
  jobId   String
  skillId String
  job     Job   @relation(fields: [jobId], references: [id])
  skill   Skill @relation(fields: [skillId], references: [id])
  @@id([jobId, skillId])
}
```

## Key architectural decisions (with reasoning)
- **Skills as a first-class entity** (own table, many-to-many with Job) — not a comma-separated string field. This enables future features like filtering by skill, and clean Obsidian graph export where each skill is a node linked to every job that requires it.
- **Company as a first-class entity** — same reason. Cascade delete: when a job is deleted, if its company has no remaining jobs, the company row is also deleted.
- **Orphaned skills are intentionally kept** — skills persist even if no jobs reference them. Revisit if this becomes clutter.
- **LLM extraction happens in the same POST request** as job creation (not background). Means ~2-5s delay on save, but simpler architecture for now.
- **`extractSkills()` in `lib/extractSkills.ts` is intentionally isolated** behind one function so the LLM provider can be swapped (DeepSeek → Anthropic → OpenAI) without touching the rest of the app.
- **No `SAVED` status** — the act of adding a job to this app means you already applied. Status starts at `APPLIED`.
- **Soft delete was rejected** — hard delete only. When a job is deleted: JobSkill rows first, then Job row, then Company if orphaned.
- **`proxy.ts` instead of `middleware.ts`** — Next.js deprecated the middleware filename convention in this version.

## Theming system
The app has a token-based theme switcher with 4 themes: LinkedIn, Instagram, Twitter, Notion.

**How it works:**
1. `app/themes.css` defines CSS custom properties per theme using `:root[data-theme="linkedin"]` attribute selectors
2. `lib/ThemeProvider.tsx` holds the active theme in React state, uses `useEffect` to set `data-theme` on `document.documentElement`, and exposes `{ theme, setTheme }` via React Context
3. `app/layout.tsx` wraps everything in `<ThemeProvider>`
4. Components use `style={{ color: "var(--text-primary)" }}` instead of hardcoded Tailwind color classes
5. The theme switcher dropdown lives in `app/jobs/Header.tsx`

**Available tokens:**
- `--bg-page` — page background
- `--bg-card` — card/surface background
- `--text-primary` — main text color
- `--text-secondary` — muted/supporting text
- `--accent` — accent color (links, buttons, company name)
- `--accent-bg` — light accent background (status badges etc.)
- `--radius` — border radius for cards/buttons
- `--card-border` — full border shorthand for cards
- `--tag-radius` — border radius for skill tags
- `--tag-bg` — skill tag background
- `--tag-text` — skill tag text color

**Adding a new theme:** add a `:root[data-theme="newtheme"]` block to `themes.css`, add `"newtheme"` to the `Theme` union type in `ThemeProvider.tsx`, add an `<option>` to the dropdown in `Header.tsx`. No other changes needed.

**Twitter theme note:** Twitter uses `--layout-mode: list` (dividers, no card boxes) vs the other themes which use grid/card layout. This structural difference requires a conditional branch in the JSX, not just CSS token values — components need to check `theme === "twitter"` for layout-level differences.

## What's fully done
- [x] Next.js scaffolding + GitHub repo
- [x] Supabase project + Prisma 7 schema + migrations
- [x] POST /api/jobs — creates job, company (upsert), extracts skills via DeepSeek, saves JobSkill rows
- [x] PATCH /api/jobs — updates status, title, recruiterName, notes (same endpoint, fields are optional)
- [x] DELETE /api/jobs — hard deletes job, JobSkill rows, orphaned company
- [x] Jobs list page with responsive grid (1/2/3 cols)
- [x] Add job form
- [x] Job detail page with full description, skills, status, delete
- [x] Inline edit form on detail page (title, recruiter, notes)
- [x] Status update dropdown with color coding per status
- [x] Delete with two-step confirmation
- [x] Auth (Supabase email/password, protected routes via proxy.ts, jobs scoped to userId)
- [x] Header with email display, sign out, theme switcher
- [x] Theme system with 4 themes (LinkedIn, Instagram, Twitter, Notion)
- [x] Theme propagation to: job cards, page backgrounds, headings, buttons, inputs, login page, detail page

## What's in progress
- [ ] Theme propagation remaining: `EditJobForm.tsx` still uses hardcoded Tailwind color classes — needs same token-swap pattern as other components
- [ ] Twitter theme layout mode — currently only token values differ, the list/divider structural difference hasn't been implemented yet

## What's planned (in rough priority order)
1. **Company logo feature** — use a logo API (e.g. `logo.clearbit.com/{domain}`) to fetch and display company logos on job cards. Needs a `companyDomain` field added to Company model (new migration), a way for user to input the domain when saving a job, and logo display on cards and detail page.
2. **Edit job as separate page** (`/jobs/[id]/edit`) — currently edit form is inline at bottom of detail page. Move to its own route for cleaner UX.
3. **Obsidian markdown export** — export all jobs as `.md` files (one per job) with `[[skill name]]` wikilinks, plus one `.md` per skill. This creates a graph in Obsidian where skills are shared nodes across job notes. Needs a GET /api/export route that generates a zip file.
4. **LinkedIn job scraping** — attempt to auto-fill job details from a LinkedIn URL. Known to be hard (LinkedIn blocks server-side fetches, ToS concerns). Deferred intentionally, not forgotten.
5. **Google OAuth** — add alongside email/password login. Supabase supports this, just needs OAuth app configured in Google Console.
6. **Dark/light mode toggle** — separate from the 4-theme switcher. Deferred to after other features are complete.
7. **CSV import** — bulk import from LinkedIn's data export. One-time import, not live sync.

## Important gotchas
- **Prisma 7 breaking changes**: never put `url` in `schema.prisma` datasource block. Always use `prisma.config.ts`. PrismaClient always needs `{ adapter }` passed to constructor. After any schema change, run `npx prisma generate` on every machine separately (generated client is local to each machine's node_modules).
- **Two machines**: development happens on both Windows and MacBook. They share the same Supabase database. Migrations only need to run once (against the shared DB), but `npx prisma generate` must run on each machine after schema changes. Each machine needs its own `.env` file (gitignored).
- **`proxy.ts` not `middleware.ts`**: Next.js renamed this convention. The exported function must be named `proxy`, not `middleware`.
- **Special characters in DB password**: must be percent-encoded in connection strings (e.g. `+` → `%2B`). Easiest fix: use a password with only letters and numbers.
- **DeepSeek API**: pay-as-you-go, requires credits loaded before first call. Returns JSON array of skill strings. System prompt explicitly instructs "return ONLY valid JSON array, no markdown, no explanation." Parse with try/catch since models occasionally misbehave.
- **Connection strings**: use `DATABASE_URL` (pooled, port 6543) for the running app via the PrismaPg adapter. Use `DIRECT_URL` (session pooler, port 5432) in `prisma.config.ts` for migrations.
EOF
Saída

# Job Tracker — Project Context for Claude Code

## What this is
A personal web app for tracking job applications. Built from scratch as a learning project to develop full-stack SWE skills. The goal is to save jobs applied to (title, company, recruiter, description), automatically extract required skills/technologies from the description using an LLM API, and display them as tags on each job card.

## Tech stack
- **Framework**: Next.js 16 (App Router, TypeScript, Tailwind CSS)
- **Database**: Supabase (hosted Postgres, free tier)
- **ORM**: Prisma 7 — important: Prisma 7 has breaking changes vs v5/v6. Connection URLs live in `prisma.config.ts`, NOT in `schema.prisma`. PrismaClient requires a driver adapter (`@prisma/adapter-pg`) passed explicitly in the constructor.
- **Auth**: Supabase Auth (email/password). Uses `@supabase/ssr` package. Two separate clients: `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (server components/API routes).
- **LLM**: DeepSeek API (`deepseek-chat` model) for skill extraction. Called once per job save, result stored in DB, never re-called for the same job.
- **Styling**: Tailwind + custom CSS token system for theming (see Theming section below)

## Project structure
```
app/
├── api/jobs/route.ts        # POST (create job + extract skills), PATCH (update status/title/notes), DELETE (delete job + cascade)
├── jobs/
│   ├── page.tsx             # Jobs list (server component, queries DB directly)
│   ├── new/page.tsx         # Add job form (client component)
│   ├── [id]/page.tsx        # Job detail page (server component)
│   ├── [id]/EditJobForm.tsx # Edit job inline form (client component)
│   ├── Header.tsx           # Header with email, theme switcher, sign out (client component)
│   ├── StatusSelect.tsx     # Status dropdown per job card (client component)
│   └── DeleteButton.tsx     # Delete with confirmation (client component)
├── login/page.tsx           # Login/signup page (client component)
├── layout.tsx               # Root layout — wraps everything in ThemeProvider
├── globals.css              # Global styles
└── themes.css               # CSS custom properties per theme (see Theming)
lib/
├── prisma.ts                # Shared PrismaClient instance (singleton pattern for dev hot-reload)
├── extractSkills.ts         # DeepSeek API call — takes description string, returns string[] of skill names
├── ThemeProvider.tsx        # React Context for theme switching (client component)
└── supabase/
    ├── client.ts            # Browser Supabase client
    └── server.ts            # Server Supabase client (reads/writes cookies)
prisma/
├── schema.prisma            # DB schema
├── config.ts                # Prisma 7 config (connection URLs live here, not schema.prisma)
└── migrations/              # Migration history — commit these
proxy.ts                     # Route protection (replaces middleware.ts in this Next.js version)
```

## Database schema
```prisma
enum ApplicationStatus {
  APPLIED
  INTERVIEWING
  OFFER
  REJECTED
  WITHDRAWN
}

model Company {
  id        String   @id @default(cuid())
  name      String   @unique
  jobs      Job[]
  createdAt DateTime @default(now())
}

model Skill {
  id        String     @id @default(cuid())
  name      String     @unique
  jobs      JobSkill[]
  createdAt DateTime   @default(now())
}

model Job {
  id            String            @id @default(cuid())
  title         String
  description   String
  recruiterName String?
  notes         String?
  appliedAt     DateTime          @default(now())
  status        ApplicationStatus @default(APPLIED)
  userId        String
  companyId     String
  company       Company           @relation(fields: [companyId], references: [id])
  skills        JobSkill[]
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
}

model JobSkill {
  jobId   String
  skillId String
  job     Job   @relation(fields: [jobId], references: [id])
  skill   Skill @relation(fields: [skillId], references: [id])
  @@id([jobId, skillId])
}
```

## Key architectural decisions (with reasoning)
- **Skills as a first-class entity** (own table, many-to-many with Job) — not a comma-separated string field. This enables future features like filtering by skill, and clean Obsidian graph export where each skill is a node linked to every job that requires it.
- **Company as a first-class entity** — same reason. Cascade delete: when a job is deleted, if its company has no remaining jobs, the company row is also deleted.
- **Orphaned skills are intentionally kept** — skills persist even if no jobs reference them. Revisit if this becomes clutter.
- **LLM extraction happens in the same POST request** as job creation (not background). Means ~2-5s delay on save, but simpler architecture for now.
- **`extractSkills()` in `lib/extractSkills.ts` is intentionally isolated** behind one function so the LLM provider can be swapped (DeepSeek → Anthropic → OpenAI) without touching the rest of the app.
- **No `SAVED` status** — the act of adding a job to this app means you already applied. Status starts at `APPLIED`.
- **Soft delete was rejected** — hard delete only. When a job is deleted: JobSkill rows first, then Job row, then Company if orphaned.
- **`proxy.ts` instead of `middleware.ts`** — Next.js deprecated the middleware filename convention in this version.

## Theming system
The app has a token-based theme switcher with 4 themes: LinkedIn, Instagram, Twitter, Notion.

**How it works:**
1. `app/themes.css` defines CSS custom properties per theme using `:root[data-theme="linkedin"]` attribute selectors
2. `lib/ThemeProvider.tsx` holds the active theme in React state, uses `useEffect` to set `data-theme` on `document.documentElement`, and exposes `{ theme, setTheme }` via React Context
3. `app/layout.tsx` wraps everything in `<ThemeProvider>`
4. Components use `style={{ color: "var(--text-primary)" }}` instead of hardcoded Tailwind color classes
5. The theme switcher dropdown lives in `app/jobs/Header.tsx`

**Available tokens:**
- `--bg-page` — page background
- `--bg-card` — card/surface background
- `--text-primary` — main text color
- `--text-secondary` — muted/supporting text
- `--accent` — accent color (links, buttons, company name)
- `--accent-bg` — light accent background (status badges etc.)
- `--radius` — border radius for cards/buttons
- `--card-border` — full border shorthand for cards
- `--tag-radius` — border radius for skill tags
- `--tag-bg` — skill tag background
- `--tag-text` — skill tag text color

**Adding a new theme:** add a `:root[data-theme="newtheme"]` block to `themes.css`, add `"newtheme"` to the `Theme` union type in `ThemeProvider.tsx`, add an `<option>` to the dropdown in `Header.tsx`. No other changes needed.

**Twitter theme note:** Twitter uses `--layout-mode: list` (dividers, no card boxes) vs the other themes which use grid/card layout. This structural difference requires a conditional branch in the JSX, not just CSS token values — components need to check `theme === "twitter"` for layout-level differences.

## What's fully done
- [x] Next.js scaffolding + GitHub repo
- [x] Supabase project + Prisma 7 schema + migrations
- [x] POST /api/jobs — creates job, company (upsert), extracts skills via DeepSeek, saves JobSkill rows
- [x] PATCH /api/jobs — updates status, title, recruiterName, notes (same endpoint, fields are optional)
- [x] DELETE /api/jobs — hard deletes job, JobSkill rows, orphaned company
- [x] Jobs list page with responsive grid (1/2/3 cols)
- [x] Add job form
- [x] Job detail page with full description, skills, status, delete
- [x] Inline edit form on detail page (title, recruiter, notes)
- [x] Status update dropdown with color coding per status
- [x] Delete with two-step confirmation
- [x] Auth (Supabase email/password, protected routes via proxy.ts, jobs scoped to userId)
- [x] Header with email display, sign out, theme switcher
- [x] Theme system with 4 themes (LinkedIn, Instagram, Twitter, Notion)
- [x] Theme propagation to: job cards, page backgrounds, headings, buttons, inputs, login page, detail page

## What's in progress
- [ ] Theme propagation remaining: `EditJobForm.tsx` still uses hardcoded Tailwind color classes — needs same token-swap pattern as other components
- [ ] Twitter theme layout mode — currently only token values differ, the list/divider structural difference hasn't been implemented yet

## What's planned (in rough priority order)
1. **Company logo feature** — use a logo API (e.g. `logo.clearbit.com/{domain}`) to fetch and display company logos on job cards. Needs a `companyDomain` field added to Company model (new migration), a way for user to input the domain when saving a job, and logo display on cards and detail page.
2. **Edit job as separate page** (`/jobs/[id]/edit`) — currently edit form is inline at bottom of detail page. Move to its own route for cleaner UX.
3. **Obsidian markdown export** — export all jobs as `.md` files (one per job) with `[[skill name]]` wikilinks, plus one `.md` per skill. This creates a graph in Obsidian where skills are shared nodes across job notes. Needs a GET /api/export route that generates a zip file.
4. **LinkedIn job scraping** — attempt to auto-fill job details from a LinkedIn URL. Known to be hard (LinkedIn blocks server-side fetches, ToS concerns). Deferred intentionally, not forgotten.
5. **Google OAuth** — add alongside email/password login. Supabase supports this, just needs OAuth app configured in Google Console.
6. **Dark/light mode toggle** — separate from the 4-theme switcher. Deferred to after other features are complete.
7. **CSV import** — bulk import from LinkedIn's data export. One-time import, not live sync.

## Important gotchas
- **Prisma 7 breaking changes**: never put `url` in `schema.prisma` datasource block. Always use `prisma.config.ts`. PrismaClient always needs `{ adapter }` passed to constructor. After any schema change, run `npx prisma generate` on every machine separately (generated client is local to each machine's node_modules).
- **Two machines**: development happens on both Windows and MacBook. They share the same Supabase database. Migrations only need to run once (against the shared DB), but `npx prisma generate` must run on each machine after schema changes. Each machine needs its own `.env` file (gitignored).
- **`proxy.ts` not `middleware.ts`**: Next.js renamed this convention. The exported function must be named `proxy`, not `middleware`.
- **Special characters in DB password**: must be percent-encoded in connection strings (e.g. `+` → `%2B`). Easiest fix: use a password with only letters and numbers.
- **DeepSeek API**: pay-as-you-go, requires credits loaded before first call. Returns JSON array of skill strings. System prompt explicitly instructs "return ONLY valid JSON array, no markdown, no explanation." Parse with try/catch since models occasionally misbehave.
- **Connection strings**: use `DATABASE_URL` (pooled, port 6543) for the running app via the PrismaPg adapter. Use `DIRECT_URL` (session pooler, port 5432) in `prisma.config.ts` for migrations.
