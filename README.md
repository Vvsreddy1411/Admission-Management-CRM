# Admission Management & CRM

A minimal full-stack Admission Management system built for the EduMerge Junior Software Developer assignment.

## Demo

- Local demo: run the app locally using the steps below
- Default frontend URL: `http://localhost:8080`
- Default backend URL: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`

## Features Covered

- Master setup for:
  - Institution
  - Campus
  - Department
  - Program / Branch
  - Academic Year
  - Course Type
  - Entry Type
  - Admission Mode
- Quota configuration with intake validation
- Program-wise seat matrix with quota counters
- Optional institution-level caps
- Applicant creation with a minimal form
- Government and Management admission flows
- Seat allocation with quota validation
- Admission confirmation with immutable admission numbers
- Document and fee status tracking
- Basic dashboard with:
  - Total intake vs admitted
  - Quota-wise filled seats
  - Remaining seats
  - Pending documents list
  - Fee pending list
- Role-based access for:
  - Admin
  - Admission Officer
  - Management

## Assignment Rules Implemented

- Quota seats cannot exceed program intake
- Base quota total must match intake before seat allocation
- No seat allocation when quota is full
- Institution cap blocks allocation when full
- Admission confirmation only after fee is marked `Paid`
- Admission number is generated only once during confirmation
- Admission number format: `INST/YEAR/COURSE/PROGRAM/QUOTA/0001`

## Tech Stack

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express
- Database: MongoDB

## Prerequisites

- Node.js 18+ (Node.js 20 recommended)
- npm 9+
- MongoDB connection string

## Setup

1. Clone the repository

```bash
git clone https://github.com/Vvsreddy1411/Admission-Management-CRM.git
cd Admission-Management-CRM
```

2. Install dependencies

```bash
npm install
```

3. Create `backend/.env`

```env
MONGODB_URI=your_mongodb_connection_string
DB_NAME=campus_connect
PORT=4000
```

4. Run the app

```bash
npm run dev
```

## Login Roles

Use any display name and choose one of these roles on the login page:

- `Admin`: manage masters, quotas, caps, applicants, and admissions
- `Admission Officer`: manage applicants and admissions
- `Management`: dashboard-only view

## Suggested Demo Flow

1. Login as `Admin`
2. Review or add master setup records
3. Configure quotas so base quota total equals intake
4. Create an applicant
5. Login as `Admission Officer`
6. Allocate seat
7. Mark documents submitted / verified
8. Mark fee paid
9. Confirm admission and verify the generated admission number
10. Login as `Management` and view the dashboard

## Available Scripts

- `npm run dev` - run frontend and backend together
- `npm run dev:frontend` - run Vite frontend
- `npm run dev:backend` - run Express backend
- `npm run build` - create production build
- `npm run test` - run tests once
- `npm run lint` - run ESLint

## AI Assistance Disclosure

AI tools were used during development.

- Tool used: OpenAI Codex / ChatGPT-style assistance
- AI-assisted work:
  - requirement gap analysis against the assignment
  - refactoring and hardening backend validation
  - frontend updates for role guards and workflow alignment
  - README drafting and documentation cleanup
- Human-driven work:
  - reviewing the assignment requirements
  - validating implementation choices
  - checking project structure and feature mapping

## Notes

- This is intentionally a minimal assignment submission, not a production ERP.
- The app seeds demo data on startup if the database is empty.
- Vite proxies `/api` requests to the Express backend in local development.
