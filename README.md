# Office Chores

A local/LAN web app for managing and scheduling office chores. Shared access — no login required. Built for small teams who want a simple, visual way to assign and track recurring tasks.

## Features

- **Outlook-style month calendar** — see all chores at a glance
- **Drag to select days** — drag across multiple days to create a ranged chore
- **Recurring chores** — repeat daily with an optional end date
- **Assign chores** — color-coded by team member
- **Drag and drop** — drag a chore chip to reschedule it
- **Mark complete** — checkbox per chore, strikethrough when done
- **Team management** — add/remove members with a color picker
- **LAN accessible** — whole office can open it in a browser

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript (Vite) |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite via Node.js built-in `node:sqlite` |
| Date math | date-fns |
| Dev runner | ts-node-dev + concurrently |

---

## Project Architecture

```
office_chores_with_ai/
├── package.json                  # Root — runs both servers via concurrently
├── backend/
│   ├── data/chores.db            # SQLite database (auto-created on first run)
│   └── src/
│       ├── index.ts              # Express server (0.0.0.0:3001)
│       ├── db.ts                 # SQLite schema init
│       └── routes/
│           ├── members.ts        # /api/members
│           ├── chores.ts         # /api/chores
│           └── occurrences.ts    # /api/occurrences
└── frontend/
    └── src/
        ├── App.tsx               # Root, modal state, data fetching
        ├── api.ts                # Typed fetch wrappers
        ├── types.ts              # Member, Chore, Occurrence interfaces
        └── components/
            ├── CalendarView.tsx  # Month grid, drag-select, drag-drop
            ├── DayCell.tsx       # Day cell with chore chips
            ├── ChoreFormModal.tsx# Add / edit / delete chore
            └── MembersPanel.tsx  # Team member sidebar
```

**Database tables:** `team_members`, `chores`, `chore_occurrences`

Occurrences are generated lazily per month — recurring chores produce one row per day, one-off chores produce a single row on their `start_date`.

**API routes:**

| Method | Path | Description |
|--------|------|-------------|
| GET/POST/DELETE | `/api/members` | Manage team members |
| GET/POST/PUT/DELETE | `/api/chores` | Manage chores |
| GET | `/api/occurrences?year=&month=` | Occurrences for a month |
| PATCH | `/api/occurrences/:id/toggle` | Toggle completed |

---

## Requirements

- **Node.js 22.5+** (Node 24 recommended)
- **npm**
- No other system dependencies

---

## Getting Started

**1. Clone**
```bash
git clone <repo-url>
cd office_chores_with_ai
```

**2. Install**
```bash
npm run install:all
```

**3. Run**
```bash
npm run dev
```

- Frontend → http://localhost:5173
- Backend → http://localhost:3001

**LAN access:** open `http://<your-ip>:5173` from any machine on your network.

---

## Production Build

```bash
npm run build
cd backend && node dist/index.js
```

The backend serves the compiled frontend. Access at `http://<your-ip>:3001`.

---

## Querying the Database

```bash
node -e "
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('backend/data/chores.db');
console.table(db.prepare('SELECT * FROM chores').all());
"
```

Or open `backend/data/chores.db` in **DB Browser for SQLite** or the **SQLite Viewer** VS Code extension.
