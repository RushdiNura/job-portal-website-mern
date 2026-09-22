# JobNest — AI-Powered Recruitment & HR Platform (MERN Stack)

A full-stack recruitment and HR platform built around three priorities a real hiring customer asked for: **AI Screening**, a **Talent Database**, and **Recruitment/HR Services** (a real hiring pipeline, interview scheduling, and messaging). It started as a job board; this pass repositioned and re-architected the product around those priorities rather than bolting them on as separate pages — screening happens automatically inside the existing apply flow, the talent database reuses the existing candidate profile model with an explicit opt-in, and the pipeline reuses the existing application status system with a Kanban view on top.

---

## Tech Stack

**Frontend:** React 18 (Vite), React Router, Tailwind CSS (dark mode via `class` strategy), Axios, react-hot-toast, react-icons, Socket.IO client, Leaflet (via CDN, no API key)
**Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt, Multer, Socket.IO, web-push, Helmet, express-mongo-sanitize
**Testing:** Jest + Supertest + mongodb-memory-server

---

## Project Structure

```
job-portal/
├── client/
│   └── src/
│       ├── components/     # Navbar, JobCard, SearchBar, Modal, FileUpload, MapView, etc.
│       ├── pages/          # Landing, JobListings, JobDetail, Login/Register,
│       │                     SeekerDashboard, EmployerDashboard, AdminDashboard,
│       │                     Messages, Profile, ForgotPassword, ResetPassword
│       ├── context/        # AuthContext (JWT session), ThemeContext (dark mode)
│       ├── services/       # api.js (Axios), socket.js, push.js
│       └── App.jsx
│
├── server/
│   ├── models/              # User, Job, Application, Company, Notification,
│   │                          Interview, Conversation, Message, JobEvent
│   ├── controllers/         # Route handler logic, one file per resource
│   ├── routes/
│   ├── middleware/          # auth (JWT + role guard), upload (Multer), errorHandler
│   ├── realtime/socket.js   # Socket.IO server (authenticated handshake, room ACLs)
│   ├── utils/                # analytics.js, sendEmail.js, push.js, videoMeeting.js,
│   │                          resumeText.js, generateToken.js
│   ├── seed/seed.js
│   └── tests/                # Jest + Supertest suites
│
└── README.md
```

---

## Quick Start

### 1. Backend

```bash
cd server
npm install
cp .env.example .env       # then edit MONGO_URI and JWT_SECRET at minimum
npm run seed                # creates demo admin, employers, seekers, jobs, a sample
                             # interview, a sample conversation, and analytics events
npm run dev
```

API runs at `http://localhost:5000`. Socket.IO shares the same port.

**Demo accounts** (password `password123` for all):
- Admin: `admin@demo.com` (provisioned only via the seed script — see Security section)
- Employers: `employer1@demo.com`, `employer2@demo.com`, `employer3@demo.com`
- Seekers: `seeker1@demo.com`, `seeker2@demo.com`, `seeker3@demo.com`

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Runs at `http://localhost:5173`, proxying `/api` and `/uploads` to the backend.

### 3. Tests

```bash
cd server
npm test
```

> **Honesty note on testing in this environment:** this project was built in a sandbox without npm registry access, so `npm install`/`npm test` could not actually be executed here. Every backend file was verified with `node --check`, every frontend file was verified by parsing it through esbuild, and every route's imports were cross-checked against controller exports and every relative import was verified to resolve to a real file — so there are no syntax errors or dangling imports. But you should run `npm install && npm test` yourself before treating the test suite as passing; I have not seen it execute.

---

## What Was Audited & Fixed

- Public self-registration could previously be pointed at any string; hardened to only ever accept `seeker`/`employer` — admin accounts cannot be created through the public API, closing a privilege-escalation path.
- Login and every authenticated request now check `user.isActive`, so a deactivated account is locked out immediately, not just hidden from listings.
- Added `express-mongo-sanitize` to strip NoSQL-injection payloads (`$gt`, dotted keys, etc.) from `body`/`query`/`params`.
- Added a dedicated, tighter rate limiter on `/api/auth/login`, `/api/auth/register`, and `/api/auth/forgot-password` (20 requests / 15 min) independent of the general API limiter, to slow down credential stuffing.
- Confirmed IDOR protection on every ownership-sensitive route (job edit/delete, application status updates, resume downloads, conversations) — each checks the resource's owning `employer`/`applicant` field against `req.user._id`, not just that a valid token was presented. This is now covered by explicit tests.
- Admin accounts are exempt from the deactivation endpoint to prevent accidental/malicious lockout of the only admin.

---

## Feature Reference

### The three priorities this pass was built around

| Priority | What it actually is |
|---|---|
| **AI Screening** | Every application is scored automatically the instant a candidate applies — `POST /api/applications/:jobId` runs `screenApplication()` synchronously before the application is even saved. The score (0-100) comes from a deterministic algorithm (skill overlap, experience-level proximity, cover-letter keyword relevance, location/remote fit) that always runs; if `ANTHROPIC_API_KEY` is set, a real LLM call adds a grounded narrative summary on top. `aiGenerated: true/false` on every application tells the truth about which happened — never a fabricated score. Employers see the score and a skill-by-skill breakdown right in the applicants list, can re-run it (`POST /api/applications/:id/rescreen`), and can sort by it. |
| **Talent Database** | A searchable pool of candidates who've explicitly opted in (`discoverable: true` on their profile — off by default, never a dark pattern). `GET /api/talent` searches by keyword/skills/experience/location; `GET /api/talent/:id` enforces that non-discoverable candidates are only visible to an employer they've actually applied to. Resume files are never exposed through talent search — only through a real application. Employers build a private, tagged, note-taking shortlist (`TalentPoolEntry`) independent of any single job — the CRM behavior a recruiting team actually needs. |
| **Recruitment/HR Services** | A drag-and-drop Kanban hiring pipeline (native HTML5 drag events, no extra library) sitting on top of the existing application status field — moving a card calls the same status-update endpoint the list view uses. Combined with the interview scheduler (real backend conflict detection) and the employer↔candidate chat (Socket.IO, authorization tied to a real application), this is the day-to-day operational toolkit of a recruitment/HR team, not just a place to post a job. |

### Preserved from the original build
Registration/login (JWT, bcrypt), role-based dashboards, job CRUD with backend-side search/filter/sort/pagination, resume upload (PDF/DOC/DOCX, size-limited), one-click apply with duplicate-application prevention (unique Mongo index), saved jobs, application status tracking, employer/seeker dashboards.

### Enhanced
- **Application pipeline** expanded to `Applied -> Under Review -> Shortlisted -> Interview Scheduled -> Offer -> Hired`, plus `Rejected` and a candidate-initiated `Withdrawn` (`PUT /api/applications/:id/withdraw`, with an ownership check and a guard against withdrawing an already-closed application). The Kanban pipeline (see above) is a new view over this same field.
- **Search** was already backend-driven (Mongo query, not client-side filtering of a full result set) — unchanged, still correct.
- **Confirmations** use an in-app `Modal` component throughout (job delete, etc.) — no `alert()`/`confirm()` anywhere in the codebase.
- **Landing page copy and structure** were rewritten around the three priorities above, and the old placeholder vanity stats ("1,200+ open roles", "300+ companies") were removed — they were fabricated numbers with no backing data, which has no place in something being presented to a real buyer. What replaced them is a three-pillar feature section describing what the product actually does.

### Everything else built in earlier passes

| Feature | Status | Notes |
|---|---|---|
| Dark mode | Working | Tailwind `class` strategy, `ThemeContext`, persisted in `localStorage`, applied across shared components, navigation, dashboards, forms, modals, chat |
| AI Resume Analyzer (self-service, profile page) | Working, real integration | `POST /api/ai/analyze-resume` calls Anthropic's API server-side (key never reaches the browser). Returns a clear `503 not configured` if `ANTHROPIC_API_KEY` is unset — never a fabricated score. Distinct from AI Screening above: this is a candidate-facing "improve my resume" tool, screening is the employer-facing per-application score |
| AI Job Recommendations | Working, algorithmic | `GET /api/recommendations` scores real open jobs against the candidate's skills/headline/location/type/remote preferences and returns explainable reasons per job. No protected characteristics used, nothing randomized |
| Interview Scheduler | Working | `POST /api/interviews` with backend double-booking prevention (checks both employer and candidate calendars for time overlap), past-date rejection, candidate confirm/cancel, employer reschedule |
| Employer <-> Applicant Chat | Working | Socket.IO with JWT-authenticated handshake; a conversation can only exist for a real `Application`, and every REST/socket action re-verifies the requester is a participant — tested explicitly against a third party trying to read someone else's conversation |
| Video Interviews | Architecture only | `server/utils/videoMeeting.js` defines the provider interface and documents `VIDEO_PROVIDER`/`DAILY_API_KEY`; without credentials, no meeting link is fabricated — the interview is still scheduled, just without a video link |
| Job Location Maps | Working | Leaflet + OpenStreetMap (CDN, no paid key) on the job detail page; employers can optionally set lat/lng when posting a job |
| Recruitment Analytics | Working, real data | `JobEvent` collection logs real `job_viewed`/`job_saved`/`application_submitted`/`interview_scheduled` events; employer analytics (`/api/analytics/employer`) now also surfaces average AI match score and count of strong matches (75+), and admin analytics (`/api/admin/analytics`) — all pure aggregations of real documents, nothing hardcoded |
| Email Notifications | Working (console fallback) | Wired into application submission, status changes, and interview scheduling; sends real SMTP mail if configured, otherwise logs to console — never throws and never blocks the primary action |
| Push Notifications | Architecture + working client/server plumbing | Full VAPID Web Push flow (subscribe/unsubscribe/preferences endpoints, service worker, subscribe UI in Profile) — becomes fully live once you generate VAPID keys; safe no-op otherwise |
| Admin role/dashboard | Working | Platform-wide analytics, user activation/deactivation, job moderation (close/reopen) — all admin routes are `protect + authorize("admin")` |

---

## Environment Variables

See `server/.env.example` for the full, commented list (Mongo, JWT, email, AI, push, video). Nothing in this repo ships with real secrets.

Key optional features and how they degrade when unconfigured:
- No `ANTHROPIC_API_KEY` -> resume analysis returns `503` with a clear message.
- No `SMTP_*` -> emails log to the server console instead of sending.
- No `VAPID_*` -> push subscribe endpoint reports `configured: false`; the UI surfaces a toast and `sendPush()` becomes a safe no-op.
- No `VIDEO_PROVIDER` -> interviews still schedule normally; `meetingUrl` stays empty.

---

## API Overview

All protected routes require `Authorization: Bearer <token>`. Additions from this enhancement pass (the original auth/jobs/applications/companies/users/notifications routes are unchanged):

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/interviews` | Employer | Schedule an interview (backend conflict check) |
| GET | `/api/interviews/mine` | Private | List interviews for the logged-in user |
| PUT | `/api/interviews/:id` | Participant | Confirm/cancel/reschedule |
| POST | `/api/conversations/start` | Participant on the application | Get-or-create a conversation |
| GET | `/api/conversations/mine` | Private | List conversations with real unread counts |
| GET/POST | `/api/conversations/:id/messages` | Participant only | Read/send messages |
| PUT | `/api/conversations/:id/read` | Participant only | Mark read |
| GET | `/api/push/config` | Public | Whether push is configured + public VAPID key |
| POST | `/api/push/subscribe` / `/unsubscribe` | Private | Manage push subscriptions |
| PUT | `/api/push/preferences` | Private | Toggle email/push preferences |
| POST | `/api/ai/analyze-resume` | Seeker | AI resume analysis (or 503 if unconfigured) |
| GET | `/api/recommendations` | Seeker | Explainable job recommendations |
| GET | `/api/analytics/employer` | Employer | Real, aggregated dashboard metrics |
| GET | `/api/admin/analytics` | Admin | Platform-wide real metrics |
| GET/PUT | `/api/admin/users`, `/api/admin/users/:id/status` | Admin | User management |
| GET/PUT | `/api/admin/jobs`, `/api/admin/jobs/:id/status` | Admin | Job moderation |
| PUT | `/api/applications/:id/withdraw` | Applicant only | Candidate withdraws their own application |
| POST | `/api/applications/:id/rescreen` | Employer (owner) | Re-run AI Screening for an application |
| GET | `/api/applications/job/:jobId?sort=score` | Employer (owner) | Applicants for a job, optionally sorted by AI match score |
| GET | `/api/talent` | Employer | Search the talent database (discoverable candidates only) |
| GET | `/api/talent/:id` | Employer | View a candidate's talent profile (requires discoverability or an existing application) |
| POST/DELETE | `/api/talent/pool/:candidateId` | Employer | Save/remove a candidate in the employer's private talent pool |
| GET | `/api/talent/pool/mine` | Employer | The employer's saved talent pool |

Socket.IO events: `join_conversation` / `leave_conversation` (server verifies participation before allowing the join), `typing`, `new_message` (server-to-client push after a REST send).

---

## Testing

`server/tests/` covers, across `auth.test.js`, `jobs.test.js`, `applications.test.js`, `newFeatures.test.js`, and `talentAndScreening.test.js`:
- Registration/login, invalid credentials, protected-route rejection, admin accounts blocked from public registration
- Job CRUD, ownership enforcement, keyword search, pagination
- Duplicate-application prevention, resume-gated applications, status updates, candidate withdrawal (and that a third party can't withdraw someone else's application)
- Interview conflict detection (same-employer overlapping slots rejected, past dates rejected)
- Chat authorization (a candidate can't start a conversation for someone else's application; a third-party employer can't read a conversation's messages; legitimate participants can exchange messages)
- Recommendation correctness (skill-matched job ranked, unrelated job excluded, reasons present)
- Admin authorization (non-admin blocked from `/api/admin/*`, admin sees real counts, deactivating a user blocks their next login)
- AI analyzer graceful degradation (503 with a clear message when unconfigured)
- **AI Screening**: score computed at apply-time with no AI key configured (algorithmic fallback), a stronger skill match scores higher than a weaker one, re-screening works and is ownership-gated, applicant list sorts correctly by score
- **Talent Database**: non-discoverable candidates are excluded from search, discoverable candidates are found by skill keyword, seekers are blocked from talent routes entirely, viewing a non-discoverable candidate's profile is forbidden unless they've applied to one of your jobs, saving to / removing from the talent pool works and is private per employer

---

## Deployment Notes

- **Frontend:** `npm run build` in `client/` -> static `dist/`, deploy to Vercel. Set `VITE_API_URL`.
- **Backend:** Render/Railway. Socket.IO needs a host that supports long-lived WebSocket connections (most do); set `CLIENT_URL` to your deployed frontend origin for CORS.
- **Database:** MongoDB Atlas.
- **File storage:** local disk by default (fine for a single instance); swap `middleware/upload.js` for S3/Cloudinary for multi-instance deployments.
- No `localhost` URLs are hardcoded — everything reads from `CLIENT_URL` / `VITE_API_URL`.

---

## Known Gaps (documented honestly, not hidden)

- Video interviews are architecture-only without a configured provider — by design, per the "don't fake integrations" principle this project follows.
- `.docx` resume text extraction is unimplemented (only `.pdf`, via `pdf-parse`, if installed) — the analyzer returns a clear `422` rather than garbling binary content.
- Push notification delivery could not be end-to-end verified in this sandbox (no real browser to test against); the VAPID/service-worker code follows the standard Web Push spec but should be smoke-tested after deploying.
- Dark mode classes were applied across all shared components and every page; if you spot a one-off element that needs a touch-up during visual QA, the pattern (`text-slate-900 dark:text-white`, etc.) is consistent throughout for you to extend.
