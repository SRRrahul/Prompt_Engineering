# GTEC Online Examination Portal

A full-stack, university-grade online examination system for GTEC's **Prompt Engineering** course.

---

## 🏗️ Project Structure

```
online-exam-c/
├── backend/          # Node.js + Express + TypeScript API
└── frontend/         # React + Vite + TypeScript UI
```

---

## ⚙️ Prerequisites

| Tool | Required Version |
|------|-----------------|
| Node.js | v18+ |
| MongoDB | v6+ (running locally) or Atlas URI |
| npm | v9+ |

---

## 🚀 Setup & Run

### 1. Clone / Navigate to project
```bash
cd "online exam c"
```

### 2. Configure Backend Environment
Edit `backend/.env` with your values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gtec_exam
JWT_SECRET=your_strong_secret_here
JWT_EXPIRES_IN=8h
LLM_API_KEY=your_gemini_api_key       # Get from https://aistudio.google.com/
LLM_MODEL=gemini-1.5-flash
ADMIN_SEED_EMAIL=admin@gtec.edu
ADMIN_SEED_PASSWORD=Admin@GTEC2024
FRONTEND_URL=http://localhost:5173
```

### 3. Install Backend Dependencies
```bash
cd backend
npm install
```

### 4. Seed the Database (creates admin + sample questions)
```bash
npm run seed
```
Expected output:
```
✅ MongoDB connected successfully
✅ Admin seeded: admin@gtec.edu / Admin@GTEC2024
✅ Seeded 8 sample questions
✅ Default exam settings created
🎓 GTEC Database seeded successfully!
```

### 5. Start the Backend
```bash
npm run dev
# API running at http://localhost:5000
```

### 6. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 7. Start the Frontend
```bash
npm run dev
# App running at http://localhost:5173
```

---

## 🔐 Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `Admin@GTEC2024` |
| Examiner | Auto-generated on registration | Auto-generated on registration |

---

## 🌐 Application Routes

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Public home page | Public |
| `/examiner/register` | Examiner registration | Public |
| `/examiner/login` | Examiner login | Public |
| `/examiner/dashboard` | Pre-exam dashboard | Examiner |
| `/examiner/exam` | Locked exam interface | Examiner |
| `/examiner/result` | Exam results + AI feedback | Examiner |
| `/admin/login` | Admin login | Public |
| `/admin/dashboard` | Admin management dashboard | Admin |

---

## 🤖 AI Grading

The system uses **Google Gemini** (`gemini-1.5-flash`) to grade exam answers.

- **With API Key**: Real AI scoring (0–10 per question) with contextual feedback
- **Without API Key**: Mock grading based on word count (app still works fully)

Get a free Gemini API key at: https://aistudio.google.com/

---

## 📊 API Endpoints

### Auth
- `POST /api/auth/examiner/register` — Register examiner, get credentials
- `POST /api/auth/examiner/login` — Login, get JWT
- `POST /api/auth/admin/login` — Admin login, get JWT

### Exam (Examiner JWT required)
- `GET /api/exam/settings` — Get current exam settings
- `POST /api/exam/start` — Start/resume exam session
- `GET /api/exam/session` — Get session state + remaining time
- `POST /api/exam/answer` — Save answer for a question
- `POST /api/exam/submit` — Submit exam (triggers AI grading)
- `POST /api/exam/violation` — Log security violation
- `GET /api/exam/result` — Get graded results

### Admin (Admin JWT required)
- `GET /api/admin/dashboard-stats` — Summary stats
- `GET/POST /api/admin/questions` — List / add questions
- `POST /api/admin/questions/bulk` — Bulk upload (CSV/JSON)
- `PUT/DELETE /api/admin/questions/:id` — Edit / delete question
- `GET /api/admin/examiners` — All registered examiners
- `GET /api/admin/results` — Leaderboard + scores
- `GET/PUT /api/admin/settings` — Read / update exam config
- `GET /api/admin/violations/:sessionId` — Violation log

---

## 🔒 Security Features

- **Server-side timer**: Start time stored in DB; remaining time computed on server
- **Server-side shuffle**: Questions shuffled per session using Fisher-Yates
- **Lockdown mode**: Fullscreen enforcement, copy/paste blocked, tab-switch detection
- **Violation logging**: Every infraction logged to DB, visible in admin dashboard
- **JWT auth**: Role-scoped tokens (admin vs examiner), short expiry
- **bcrypt passwords**: Cost factor 12

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Brown Dark | `#4E342E` |
| Brown | `#6D4C41` |
| Mint | `#98D8C8` |
| Mint Dark | `#6EC6B0` |
| Cream | `#FAF7F2` |
| Heading Font | Playfair Display (serif) |
| Body Font | Inter (sans-serif) |
