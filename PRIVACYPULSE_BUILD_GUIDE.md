# PrivacyPulse — Build Guide for Antigravity + Claude

**Goal:** Build a secure, responsive personal digital-privacy dashboard in 21 days.  
**Level:** Intermediate.  
**Recommended stack:** React + Vite + TypeScript, FastAPI, SQLAlchemy, Supabase Auth + PostgreSQL.  
**AI tools:** Antigravity and Claude. Use one canonical repository and avoid having both agents edit the same files at once.

## How to use this guide

1. Create a repository folder named `privacypulse`.
2. Save this file as `PRIVACYPULSE_BUILD_GUIDE.md` in the root.
3. Open the folder in Antigravity.
4. Add this file to Claude's context when asking for reviews or implementation help.
5. Ask the agent to plan before editing, then implement one milestone at a time.
6. Run tests, inspect diffs, and commit each working milestone.

Never paste real credentials into prompts. AI-generated code must be reviewed, especially authentication, authorization, SQL, and deployment configuration.

## 1. Product scope

PrivacyPulse helps a user keep track of:
- Digital accounts and self-reported security settings.
- Privacy/security checklist items.
- A transparent rule-based checklist score.
- Account review reminders.
- A private incident journal.
- A basic report export.

### MVP acceptance criteria

A user can sign up, log in, manage their own digital-account records, complete checklist items, view an explainable score, create/complete reminders, log incidents, export a summary, use the app on mobile, and log out.

### Explicit non-goals

- Never store passwords, recovery codes, session tokens, or authentication secrets.
- No automatic login to third-party services.
- No claim that the app detects every breach or guarantees security.
- No billing, teams, or complex AI agents in the first release.
- No score presented as a professional security audit.

## 2. Recommended stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS |
| Routing | React Router |
| Server state | TanStack Query |
| Forms/validation | React Hook Form + Zod |
| Charts/icons | Recharts + Lucide React |
| Authentication | Supabase Auth |
| Backend | Python + FastAPI + Pydantic |
| Database access | SQLAlchemy + psycopg |
| Migrations | Alembic |
| Database | Supabase PostgreSQL |
| Backend tests | Pytest + HTTPX |
| Frontend tests | Vitest + React Testing Library |
| End-to-end | Playwright |
| Hosting | Vercel/Cloudflare Pages, Render, Supabase |

## 3. Architecture

```text
Browser
  -> React + TypeScript
       -> Supabase Auth for sign-in/session
       -> sends access token with API requests
  -> FastAPI REST API
       -> verifies JWT signature and claims
       -> derives user ID from verified token
       -> validates inputs and authorizes every record operation
  -> Supabase PostgreSQL
       -> digital_accounts
       -> checklist_items
       -> reminders
       -> incidents
       -> user_preferences
```

### Security rules

1. React signs users in through Supabase Auth.
2. Send `Authorization: Bearer <access_token>` to protected API routes.
3. FastAPI must verify the JWT signature, expiry, issuer, and appropriate claims using the project's supported signing-key/JWKS configuration. Never merely decode and trust a token.
4. Derive the user ID from verified claims. Do not trust a user ID from the request body.
5. Scope every database read, update, and delete to the authenticated user.
6. Enable and test PostgreSQL RLS on user-owned tables.
7. If the backend uses a privileged database credential that bypasses RLS, implement and test equivalent authorization in every API operation. Do not assume RLS protects privileged queries.
8. Never expose a service-role key, database password, or JWT secret in the frontend.
9. Validate that a reminder's account belongs to the same user; a foreign key alone does not enforce matching owners.

## 4. Folder structure

```text
privacypulse/
├── PRIVACYPULSE_BUILD_GUIDE.md
├── README.md
├── .gitignore
├── frontend/
│   ├── src/
│   │   ├── api/                 # API client and typed endpoints
│   │   ├── components/          # shared, layout, dashboard components
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── accounts/
│   │   │   ├── checklist/
│   │   │   ├── reminders/
│   │   │   └── incidents/
│   │   ├── hooks/
│   │   ├── lib/supabase.ts
│   │   ├── pages/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/routes/           # health, accounts, checklist, reminders,
│   │   │                         # incidents, dashboard, reports
│   │   ├── core/                 # config, security/JWT verification
│   │   ├── db/session.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/risk_scoring.py
│   │   └── main.py
│   ├── tests/
│   ├── alembic/
│   ├── .env.example
│   └── requirements.txt
└── database/schema.sql
```

Create modules when their features are implemented; avoid empty placeholder files.

## 5. Database schema

Run this initial schema in Supabase SQL Editor. Use versioned migrations for later changes.

```sql
create extension if not exists pgcrypto;

create table public.digital_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_name text not null,
  category text not null default 'other'
    check (category in ('social','finance','shopping','work','entertainment','other')),
  mfa_enabled boolean not null default false,
  recovery_reviewed boolean not null default false,
  last_reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'general',
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.digital_accounts(id) on delete set null,
  title text not null,
  due_at timestamptz not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  severity text not null default 'medium'
    check (severity in ('low','medium','high')),
  occurred_at timestamptz,
  status text not null default 'open'
    check (status in ('open','investigating','resolved')),
  created_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now()
);

create index digital_accounts_user_idx on public.digital_accounts(user_id);
create index checklist_user_idx on public.checklist_items(user_id);
create index reminders_user_due_idx on public.reminders(user_id, due_at);
create index incidents_user_created_idx on public.incidents(user_id, created_at desc);

alter table public.digital_accounts enable row level security;
alter table public.checklist_items enable row level security;
alter table public.reminders enable row level security;
alter table public.incidents enable row level security;
alter table public.user_preferences enable row level security;

create policy "Owners manage digital accounts"
on public.digital_accounts for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Owners manage checklist"
on public.checklist_items for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Owners manage reminders"
on public.reminders for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Owners manage incidents"
on public.incidents for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Owners manage preferences"
on public.user_preferences for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
```

Additional safeguards: restrict table privileges to what's needed; validate reminder/account ownership in backend logic or enforce it with a database constraint/trigger; test RLS with two users through the actual database access path; do not store credentials in notes.

## 6. API routes

All routes except `GET /health` require authentication. Prefix application routes with `/api/v1`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | API health |
| GET | `/api/v1/dashboard` | Summary and score |
| GET, POST | `/api/v1/accounts` | List/create accounts |
| GET, PATCH, DELETE | `/api/v1/accounts/{id}` | Read/update/delete account |
| GET, POST | `/api/v1/checklist` | List/create checklist items |
| PATCH, DELETE | `/api/v1/checklist/{id}` | Update/delete checklist item |
| GET, POST | `/api/v1/reminders` | List/create reminders |
| PATCH, DELETE | `/api/v1/reminders/{id}` | Update/delete reminder |
| GET, POST | `/api/v1/incidents` | List/create incidents |
| PATCH, DELETE | `/api/v1/incidents/{id}` | Update/delete incident |
| GET | `/api/v1/reports/summary` | Summary for export |

Use Pydantic schemas, appropriate HTTP status codes, pagination when needed, input length limits, and safe error responses. Never return stack traces or credentials. Prefer a non-disclosing 404 when a resource belongs to another user.

Example create-account request:

```http
POST /api/v1/accounts
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "service_name": "Example Social App",
  "category": "social",
  "mfa_enabled": true,
  "recovery_reviewed": false
}
```

The server generates the record ID and derives ownership from the verified token.

## 7. Transparent scoring

This score measures self-reported checklist completion, not whether an account is objectively safe.

- MFA enabled: 40 points.
- Recovery settings reviewed: 30 points.
- Account reviewed in the last 90 days: 30 points.

```python
from datetime import datetime, timedelta, timezone

def account_security_score(account) -> int:
    score = 40 if account.mfa_enabled else 0
    score += 30 if account.recovery_reviewed else 0

    reviewed_at = account.last_reviewed_at
    if reviewed_at is not None:
        if reviewed_at.tzinfo is None:
            reviewed_at = reviewed_at.replace(tzinfo=timezone.utc)
        if reviewed_at >= datetime.now(timezone.utc) - timedelta(days=90):
            score += 30

    return score
```

Dashboard score is the rounded average of the user's account scores. If there are no accounts, show “Add your first account” instead of a misleading score. Show score components and the label “Self-reported checklist score.”

## 8. Environment variables

`frontend/.env.example`:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

`backend/.env.example`:

```dotenv
APP_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_JWKS_URL=https://YOUR_PROJECT.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_ISSUER=https://YOUR_PROJECT.supabase.co/auth/v1
DATABASE_URL=YOUR_SERVER_SIDE_POSTGRES_CONNECTION_STRING
```

Use real values only in ignored `.env.local` / `.env` files or the hosting dashboard. `VITE_` variables are public client-side values; never put database passwords, service-role keys, JWT signing secrets, or private API keys in them. Configure JWT verification according to the actual Supabase project's signing-key setup.

## 9. Local setup commands

Prerequisites: Git, Node.js LTS, Python 3.11+, and a Supabase account.

### Frontend (PowerShell)

```powershell
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install @supabase/supabase-js react-router-dom @tanstack/react-query
npm install recharts lucide-react zod react-hook-form @hookform/resolvers
npm install -D tailwindcss @tailwindcss/vite
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm run dev
```

Configure Tailwind using the current official Vite instructions for the installed version.

### Backend (new terminal, from repository root)

```powershell
mkdir backend
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install fastapi "uvicorn[standard]" sqlalchemy "psycopg[binary]" alembic
pip install pydantic-settings PyJWT cryptography httpx
pip install pytest pytest-asyncio
pip freeze > requirements.txt
```

Create `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PrivacyPulse API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.get("/health")
def health():
    return {"status": "ok", "app": "PrivacyPulse"}
```

Start API from `backend`:

```powershell
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs`. This is only the initial health-check API; implement authentication before private routes.

### Supabase setup

1. Create a Supabase project.
2. Run `database/schema.sql` in SQL Editor.
3. Configure email authentication and redirect URLs.
4. Add the project URL and publishable key to the frontend env file.
5. Configure backend database connection and JWT verification.
6. Test RLS and cross-user isolation with two test users.
7. Use synthetic records during development.

## 10. UI pages

1. Landing page.
2. Sign up and login.
3. Dashboard with score, account count, open reminders, recent incidents, and next actions.
4. Digital Accounts: search/filter, create/edit/delete, category, MFA, recovery review, last-reviewed date.
5. Privacy Checklist: categories, completion state and timestamps.
6. Reminders: due dates, overdue filter, complete/reopen.
7. Incident Journal: title, description, severity, status, date and filters.
8. Reports: summary and CSV export.
9. Settings: display name and timezone.

Design: professional cybersecurity SaaS aesthetic, navy/neutral base, restrained emerald or teal accent, strong contrast, accessible forms, responsive navigation, loading/error/empty states, keyboard focus, and confirmation for destructive actions. Avoid fake live-threat alerts and exaggerated “100% secure” claims.

## 11. 21-day roadmap

### Week 1 — Foundation and accounts
- **Days 1–2:** Repository, React app, FastAPI health route, Supabase project, frontend-to-API call.
- **Days 3–4:** Supabase Auth, login/signup/logout, protected routes, schema, RLS, JWT verification.
- **Days 5–7:** Account CRUD, validation, owner-scoped queries, authorization tests.

**Exit criterion:** A user can sign in and manage only their own account records.

### Week 2 — Product features
- **Days 8–10:** Checklist, scoring logic, dashboard cards/charts.
- **Days 11–13:** Reminders, incident journal, filters, date handling.
- **Days 14–15:** Report summary, CSV export, responsive design, error states.

**Exit criterion:** Main features work end to end with persistent user-owned data.

### Week 3 — Quality and deployment
- **Days 16–17:** Backend tests, frontend tests, two-user authorization tests.
- **Day 18:** E2E test of login, account creation, checklist, reminder and logout.
- **Days 19–20:** Deploy frontend/backend; configure env vars, CORS and Auth redirects; smoke-test production.
- **Day 21:** README, screenshots, architecture diagram, 60–90 second demo, release tag.

**Exit criterion:** Live demo, documented setup, tested authorization.

## 12. Testing checklist

### Backend
- [ ] `/health` returns 200.
- [ ] Missing, invalid, expired, malformed and wrong-issuer tokens are rejected.
- [ ] CRUD works for the authenticated user.
- [ ] User A cannot read/update/delete User B's data.
- [ ] Reminder cannot reference another user's account.
- [ ] Invalid enum values and oversized inputs are rejected.
- [ ] Errors do not reveal stack traces or secrets.
- [ ] Scores remain between 0 and 100.
- [ ] Dates are timezone-aware.

### Frontend
- [ ] Login, logout and session refresh work.
- [ ] Forms validate and show helpful errors.
- [ ] Loading, empty and failure states work.
- [ ] Lists refresh after mutations.
- [ ] Empty account list has a helpful message.
- [ ] Mobile layout works.
- [ ] No secret is present in the client bundle.

### Security
- [ ] RLS is enabled on user-owned tables.
- [ ] RLS is tested using the actual connection path.
- [ ] Privileged credentials stay server-side.
- [ ] User ID comes from verified token claims.
- [ ] No password/recovery code is stored.
- [ ] `.env` files are ignored by Git.
- [ ] Production CORS allows only the intended frontend origin.

Example health test:

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

Once the protected route exists, add a test that `/api/v1/accounts` without a token returns `401`.

## 13. Free deployment

Free plans and limits change; verify current terms before relying on them.

### Frontend: Vercel or Cloudflare Pages
1. Push repository to GitHub.
2. Import repository into host.
3. Set project root to `frontend`.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Set `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`.
7. Add the production frontend URL to Supabase Auth redirect settings.

### Backend: Render free web service
1. Create Web Service from GitHub.
2. Root directory: `backend`.
3. Build command: `pip install -r requirements.txt`.
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Add backend environment variables in hosting dashboard.
6. Set `FRONTEND_ORIGIN` to the deployed frontend origin.
7. Test `/health`, login and authenticated requests.

Free web services may sleep after inactivity and make the first request slow. Treat this as a learning/demo deployment, not a production uptime guarantee.

### Database: Supabase
1. Keep PostgreSQL/Auth in Supabase.
2. Use the server-side connection method appropriate for the backend host.
3. Test schema, RLS and user isolation.
4. Review free-tier inactivity, database/storage limits and backup policies.
5. Keep demo/test data separate from any real data.

### `.gitignore`

```gitignore
.env
.env.*
!.env.example
.venv/
__pycache__/
*.pyc
.pytest_cache/
.coverage
node_modules/
dist/
coverage/
.DS_Store
```

Git setup:

```powershell
git init
git add .
git commit -m "Initial PrivacyPulse project setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/privacypulse.git
git push -u origin main
```

Replace `YOUR_USERNAME`. If a secret is committed, rotate it immediately; deleting it in a later commit does not remove it from history.

## 14. Antigravity + Claude workflow

Do not ask an agent to generate the entire application in one go. Keep a single repository, commit each milestone, and have one tool implement while the other reviews.

### Prompt 1 — Plan before coding

> Read `PRIVACYPULSE_BUILD_GUIDE.md` completely. Do not modify files yet. Summarize requirements, identify security-sensitive decisions, and propose milestones. Use React + Vite + TypeScript, FastAPI, SQLAlchemy, Supabase Auth and PostgreSQL. Do not add unnecessary services. The first milestone should only create the project skeleton, health endpoint, and frontend-to-backend connectivity. Wait for approval.

### Prompt 2 — Implement one milestone

> Implement only the next milestone in `PRIVACYPULSE_BUILD_GUIDE.md`. Inspect existing code first and preserve working code. List files you intend to change before editing. Follow the guide's folder structure, typing, validation, error-handling and security rules. Do not hard-code credentials. Run relevant tests and builds; report the exact commands and actual results. Do not claim tests passed unless you ran them. Stop before the next milestone.

### Prompt 3 — Security review in Claude

> Review the current PrivacyPulse changes against `PRIVACYPULSE_BUILD_GUIDE.md`. Focus on JWT verification, user-level authorization, SQL injection, RLS assumptions, secrets exposure, validation, error handling and missing tests. Do not rewrite everything. Report findings by severity, with file paths and concrete fixes. Propose the smallest safe patch for the highest-priority issues.

### Prompt 4 — Apply fixes

> Apply only the confirmed fixes from the review. Do not weaken authentication or remove tests to make the build pass. Run affected tests and the full build. Summarize changed files and actual results. Do not begin another feature until fixes are verified.

### Prompt 5 — Deployment review

> Prepare PrivacyPulse for deployment using the hosting steps in `PRIVACYPULSE_BUILD_GUIDE.md`. Inspect environment variables, CORS, API URLs, Supabase Auth redirects, backend start command, database configuration, migrations and production error handling. Do not print secrets. Flag anything that cannot be verified locally. Do not claim deployment succeeded unless it has actually been completed and tested.

### Rules for coding agents
- Work in small commits and inspect diffs.
- Never accept a claimed test result without evidence.
- Do not disable RLS or auth to bypass an error.
- Never expose secrets in source, prompts, screenshots or logs.
- Ask the agent to explain unfamiliar security decisions.
- Prefer a small working feature over a huge incomplete code dump.

## 15. Master project prompt

Use this to start planning, not to request a one-shot code dump:

> You are a senior full-stack engineer and security-conscious coding mentor. Help me build PrivacyPulse according to `PRIVACYPULSE_BUILD_GUIDE.md`. I am an intermediate developer and have three weeks.
>
> Use React + Vite + TypeScript, Tailwind CSS, FastAPI, SQLAlchemy, Alembic, Supabase Auth and Supabase PostgreSQL. Use deterministic checklist scoring; no AI API is required.
>
> Follow the architecture, schema, routes, roadmap, tests and deployment guidance in the guide. Prioritize correctness, security, accessibility and responsive design. Never store passwords or recovery codes. Verify JWTs properly, derive identity from verified claims, scope all operations to the current user, and test cross-user isolation.
>
> Start by inspecting the repository and proposing the first milestone. Do not edit files until I approve. Then implement incrementally, run tests, report actual results, and wait for approval between milestones. Never expose secrets or claim a test/deployment succeeded without evidence.

## 16. Definition of done

- [ ] MVP features work locally.
- [ ] Key flows have automated tests.
- [ ] Two-user isolation tests pass.
- [ ] UI works on desktop and mobile.
- [ ] Environment variables are correctly configured.
- [ ] Frontend/backend are deployed and smoke-tested.
- [ ] README has setup instructions, architecture and screenshots.
- [ ] Demo data is synthetic.
- [ ] Score is clearly described as self-reported and informational.
- [ ] No secrets or sensitive data are committed.

**Recommended first action:** Ask Antigravity to implement only the skeleton and health endpoint. Verify React can call FastAPI before moving on to authentication and database features.
