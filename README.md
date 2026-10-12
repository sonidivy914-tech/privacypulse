# PrivacyPulse 🛡️

PrivacyPulse is a secure, responsive personal digital-privacy dashboard built to help individuals monitor digital account security settings, maintain a privacy checklist, schedule review reminders, log security incidents, and compute an explainable self-reported checklist score.

---

## Architecture

- **Frontend:** React + Vite + TypeScript, Tailwind CSS, TanStack Query, Lucide React
- **Backend:** Python 3.11 + FastAPI + Pydantic, SQLAlchemy, Uvicorn
- **Authentication & Database:** Supabase Auth (JWT) & Supabase PostgreSQL (with Row-Level Security)
- **Local Testing Database:** In-memory / SQLite fallback with automatic schema setup
- **Testing:** Pytest + HTTPX + TestClient (10 automated unit & security tests)

---

## Features

1. **Security Posture Score:** Deterministic, transparent rule-based scoring (MFA enabled: 40 pts, Recovery reviewed: 30 pts, Reviewed within 90 days: 30 pts; rounded average across user accounts).
2. **Digital Accounts Manager:** Track credentials security, filter by category (`social`, `finance`, `shopping`, `work`, `entertainment`, `other`), enforce MFA review intervals, and quick-audit dates.
3. **Privacy Checklist:** Track device encryption, browser extension hygiene, OAuth authorization pruning, and add custom hygiene tasks with completion timestamps.
4. **Review Reminders:** Schedule time-sensitive account audits with cross-user ownership verification (a reminder cannot link to another user's account).
5. **Incident Journal:** Log suspicious emails, breach notices, or credential compromises with severity tags (`low`, `medium`, `high`) and investigation statuses (`open`, `investigating`, `resolved`).
6. **Report Export:** Comprehensive audit summary snapshot and one-click CSV export.
7. **Dual-Mode Authentication:**
   - Supabase Auth with asymmetric/symmetric JWT verification.
   - Built-in Local Sandbox Mode for instant zero-configuration local development.

---

## Security Safeguards

- **Cryptographic JWT Verification:** FastAPI verifies JWT signature and expiry.
- **Strict Claims Identity:** `user_id` is derived only from verified claims (`sub`), never from client input.
- **Cross-Tenant Isolation:** All CRUD operations are scoped to the authenticated user.
- **Non-Disclosing 404s:** Resources belonging to other users return a generic 404 to avoid ID enumeration.
- **Foreign-Owner Validation:** Reminders validate that referenced `account_id` belongs to the requesting user.
- **Zero Secret Storage:** Strict rule preventing storage of passwords, recovery codes, or auth secrets.

---

## Local Setup & Quick Start

### 1. Backend (FastAPI)
```powershell
cd C:\Users\Divy\privacypulse\backend
.\.venv\Scripts\Activate.ps1
# Or run with virtualenv python directly:
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```
- Swagger API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 2. Frontend (React + Vite)
```powershell
cd C:\Users\Divy\privacypulse\frontend
npm.cmd run dev
```
- Web Application: `http://localhost:5173`

### 3. Running Automated Tests
```powershell
cd C:\Users\Divy\privacypulse\backend
.\.venv\Scripts\pytest.exe -v
```
All 10 security, isolation, and scoring tests execute in < 0.5s.
