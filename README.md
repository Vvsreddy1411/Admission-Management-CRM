# Admission Management & CRM

Admission Management & CRM is a full-stack app for managing institutions, campuses, departments, programs, academic years, quotas, applicants, and admission capacity settings.

## GitHub Repository

Repository: `https://github.com/Vvsreddy1411/Admission-Management-CRM`

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB

## Prerequisites

- Node.js 18+ (recommended: Node.js 20 LTS)
- npm 9+
- A MongoDB connection string

## 1) Clone and Install

```bash
git clone https://github.com/Vvsreddy1411/Admission-Management-CRM.git
cd Admission-Management-CRM
npm install
```

## 2) Configure Environment Variables

Create `backend/.env` with the following values:

```env
MONGODB_URI=your_mongodb_connection_string
DB_NAME=campus_connect
PORT=4000
```

## 3) Run the Project (Frontend + Backend)

```bash
npm run dev
```

Default URLs:

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`

## Available Scripts

- `npm run dev` - Runs backend and frontend together
- `npm run dev:backend` - Runs Express backend only
- `npm run dev:frontend` - Runs Vite frontend only
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run test` - Run test suite once
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint

## Notes

- Frontend requests are proxied from Vite (`/api`) to `http://localhost:4000`.
- Make sure MongoDB is reachable before starting the backend.
