# JobNest — Job Portal Website (MERN Stack)

A full-stack job portal connecting job seekers with employers. Built with MongoDB, Express, React (Vite), and Node.js, styled with Tailwind CSS.

Job seekers can search and apply for jobs, upload resumes, and track applications. Employers can post jobs, review applicants, download resumes, and update application statuses.

---

## Tech Stack

**Frontend:** React 18 (Vite), React Router, Tailwind CSS, Axios, react-hot-toast, react-icons
**Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt, Multer (file uploads)
**Testing:** Jest + Supertest + mongodb-memory-server (backend API tests)

---

## Project Structure

```
job-portal/
├── client/                 # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/     # Navbar, JobCard, SearchBar, Modal, FileUpload, etc.
│   │   ├── pages/          # Landing, JobListings, JobDetail, Login, Register,
│   │   │                     SeekerDashboard, EmployerDashboard, Profile, etc.
│   │   ├── context/        # AuthContext (JWT session state)
│   │   ├── services/       # api.js (Axios instance)
│   │   └── App.jsx         # Route definitions
│   └── package.json
│
├── server/                 # Node.js + Express + MongoDB backend
│   ├── config/db.js        # MongoDB connection
│   ├── models/             # User, Job, Application, Company, Notification
│   ├── controllers/        # Route handler logic
│   ├── routes/              # Express routers
│   ├── middleware/         # auth (JWT), upload (Multer), errorHandler
│   ├── seed/seed.js         # Sample data seeder
│   ├── tests/               # Jest + Supertest API test suites
│   └── server.js
│
└── README.md
```

---

## Prerequisites

- Node.js 18+ and npm
- MongoDB running locally (`mongodb://127.0.0.1:27017`) **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

---

## Setup Instructions

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` and set at minimum:
- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string

Then seed sample data (creates demo employers, seekers, companies, and jobs):

```bash
npm run seed
```

Start the API server:

```bash
npm run dev        # with nodemon (auto-restart)
# or
npm start
```

The API runs at `http://localhost:5000`. Health check: `GET /api/health`.

**Demo accounts** (all use password `password123`):
- Employers: `employer1@demo.com`, `employer2@demo.com`, `employer3@demo.com`
- Seekers: `seeker1@demo.com`, `seeker2@demo.com`, `seeker3@demo.com`

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173` and proxies `/api` and `/uploads` requests to the backend automatically (see `vite.config.js`).

### 3. Run backend tests

```bash
cd server
npm test
```

Tests spin up an in-memory MongoDB instance (`mongodb-memory-server`) — no real database connection is needed to run them. They cover registration/login, role-based access control, job CRUD and search/pagination, duplicate-application prevention, resume-gated applications, and application status updates.

> **Note:** This project was built in an offline sandbox without npm registry access, so dependencies could not be installed or executed there. All backend and frontend source files were validated with `node --check` (backend) and `esbuild` parsing (frontend JSX) to catch syntax errors before packaging. Run `npm install && npm test` locally to execute the full test suite.

---

## Environment Variables

### `server/.env`
| Variable | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Frontend origin, for CORS and email links |
| `MAX_RESUME_SIZE_MB` | Max resume upload size (default 5) |
| `SMTP_*`, `EMAIL_FROM` | Optional — enables real password-reset emails. Without these, emails are logged to the server console instead. |

### `client/.env`
| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL for API calls (default `/api`, proxied to the backend in dev) |

---

## Core Features

**Authentication & Roles**
- Register as Job Seeker or Employer, JWT-based login, password reset via email token, protected/role-gated routes on both client and server.

**Job Listings**
- Full CRUD for employers, keyword/location/type/experience/remote filters, salary-range filtering, sort by newest/oldest/salary, pagination.

**Applications**
- One-click apply with resume upload (PDF/DOC/DOCX, 5MB limit) or reuse the resume on file, cover letter, duplicate-application prevention (unique index on job+applicant), status pipeline (`Applied → Under Review → Interview Scheduled → Selected/Rejected`).

**Dashboards**
- **Seeker:** applied jobs with live status, saved jobs, profile & resume management.
- **Employer:** post/edit/delete jobs, view all applicants across jobs, download resumes (authenticated), update application status inline.

**Notifications (data model + API)**
- New-applicant and status-change notifications are created server-side and retrievable via `/api/notifications`; the UI includes a notification bell as an extension point.

---

## API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require `Authorization: Bearer <token>`.

### Auth — `/auth`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register (`name, email, password, role, companyName?`) |
| POST | `/login` | Public | Log in (`email, password`) |
| GET | `/me` | Private | Get current user |
| POST | `/forgot-password` | Public | Request password reset email |
| POST | `/reset-password/:token` | Public | Reset password with token |

### Jobs — `/jobs`
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List jobs — query: `keyword, location, type, experience, remote, salaryMin, salaryMax, category, sort, page, limit` |
| GET | `/:id` | Public | Get job details (increments view count) |
| POST | `/` | Employer | Create job |
| PUT | `/:id` | Employer (owner) | Update job |
| DELETE | `/:id` | Employer (owner) | Delete job (and its applications) |
| GET | `/employer/mine` | Employer | Jobs posted by the logged-in employer |
| POST | `/:id/save` | Seeker | Toggle save/unsave |
| GET | `/saved/mine` | Seeker | Get saved jobs |

### Applications — `/applications`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/:jobId` | Seeker | Apply (multipart: `resume` file + `coverLetter`) |
| GET | `/mine` | Seeker | My applications |
| GET | `/job/:jobId` | Employer (owner) | Applicants for one job |
| GET | `/employer/all` | Employer | Applicants across all my jobs |
| PUT | `/:id/status` | Employer (owner) | Update status |
| GET | `/:id/resume` | Employer (owner) | Download applicant's resume |

### Companies — `/companies`
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/mine` | Employer | Get my company profile |
| PUT | `/mine` | Employer | Update my company profile |
| GET | `/:id` | Public | Get a company's public profile |

### Users — `/users`
| Method | Route | Access | Description |
|---|---|---|---|
| PUT | `/me` | Private | Update profile fields |
| POST | `/me/resume` | Private | Upload/replace resume on profile |
| PUT | `/me/password` | Private | Change password |

### Notifications — `/notifications`
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Private | List my notifications |
| PUT | `/:id/read` | Private | Mark one as read |
| PUT | `/read-all` | Private | Mark all as read |

---

## Deployment Notes

- **Frontend:** `npm run build` in `client/` produces a static `dist/` folder deployable to Vercel, Netlify, etc. Set `VITE_API_URL` to your deployed API's URL.
- **Backend:** Deploy to Render, Railway, or similar. Set all `.env` variables in your host's dashboard, and use MongoDB Atlas for the database.
- **File storage:** Resumes are stored on local disk (`server/uploads/resumes`) by default, which works for a single-instance deployment. For production/multi-instance deployments, swap the storage in `middleware/upload.js` for Cloudinary or Amazon S3 (add `USE_CLOUDINARY`/S3 credentials to `.env` as needed).

---

## Known Limitations / Next Steps

- Email delivery falls back to console logging unless `SMTP_*` variables are set.
- File storage is local-disk by default; cloud storage requires the swap noted above.
- Notification bell UI is scaffolded but not yet wired to the `/notifications` API — the backend is ready to connect.
- No automated frontend component tests are included (backend API tests only); consider adding React Testing Library for UI coverage.
