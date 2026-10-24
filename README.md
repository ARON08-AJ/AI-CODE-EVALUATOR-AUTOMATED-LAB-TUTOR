# AutoLab v1.0 — Smart College Programming Laboratory & Automated Evaluation System

> **A modern, institutional-grade online programming laboratory, automated code evaluation judge, and pedagogical AI debugging tutor built for higher-education computer science curricula.**

---

## 📌 Executive Overview

**AutoLab v1.0** transforms traditional computer science laboratory sessions into an automated, self-guided, and data-driven learning environment. It eliminates the manual bottlenecks of lab management by providing browser-based coding, instant compilation and automated test evaluation against public and hidden test vectors, progressive pedagogical AI tutoring, and comprehensive oversight dashboards for faculty and university administrators.

### Core Problems Solved
1. **Zero-Setup Programming Environment**: Students write, compile, and run C, C++, Java, and Python directly in a browser-based Monaco editor without configuring local compilers or runtime dependencies.
2. **Instant, Standardized Evaluation**: Automated execution against faculty-defined public and hidden test cases with immediate industry-standard verdicts (`ACCEPTED`, `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, `OUTPUT_LIMIT_EXCEEDED`, `RUNTIME_ERROR`, `COMPILE_ERROR`).
3. **Progressive AI Debugging Tutor**: When student code fails, an integrated GenAI tutor (powered by Groq Cloud inference) provides multi-level conceptual clues and algorithmic guidance **without ever disclosing the complete solution or leaking private test vectors**.
4. **Faculty Workflow Automation**: Streamlines assignment creation, automated deadline countdowns, bulk Excel import/export of labs and test cases, and student progress tracking.
5. **Institutional Security & Integrity**: Role-Based Access Control (RBAC), Argon2id cryptographic password security, API rate limiting, and process isolation.

---

## 🏗️ System Architecture

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT LAYER                                       |
|  React 19 (TypeScript) + Vite SPA + Tailwind CSS + Lucide Icons + Monaco Editor       |
|  - Student Portal: Labs, Code Editor, Diff Compare, Leaderboard, Announcements        |
|  - Faculty Portal: Lab Authoring, Bulk Excel I/O, Assignment Distribution, Analytics   |
|  - Admin Portal: Department Oversight, User Lifecycle, System Activity Audit Stream    |
+---------------------------------------------------------------------------------------+
                                           │
                                           │ REST JSON / JWT / HTTPS
                                           ▼
+---------------------------------------------------------------------------------------+
|                                    BACKEND LAYER                                      |
|  Node.js + Express.js + TypeScript                                                    |
|  - Auth & Credential Controller (Argon2id + JWT + RegNo Slice Auth)                   |
|  - Lab & Topic Controller (Curriculum Organization & Assignment Distribution)         |
|  - Sandboxed Process Runner (C, C++, Java, Python Child Process Sandboxing)          |
|  - Test Case Evaluation & Submission Aggregator                                       |
|  - AI Pedagogical Hint Service (Groq API Client + Zod Schema Validation)              |
+---------------------------------------------------------------------------------------+
                    │                                                │
                    │ Prisma ORM (Type-Safe Client)                  │ JSON API
                    ▼                                                ▼
+---------------------------------------+        +--------------------------------------+
|            DATABASE LAYER             |        |       AI INFERENCE CLOUD API         |
|  SQLite (dev.db) / PostgreSQL         |        |  Groq High-Speed Inference API       |
|  10 Core Relational Tables            |        |  (Qwen 2.5 Coder / Llama 3)          |
+---------------------------------------+        +--------------------------------------+
```

---

## 💻 Tech Stack & Dependencies

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite, React Router v6 |
| **Styling & UI** | Tailwind CSS, Lucide React Icons, Dynamic Light/Dark Theme Engine |
| **Code Editor Engine** | Monaco Editor (`@monaco-editor/react`) with syntax highlighting & keyboard shortcuts |
| **Backend Framework** | Node.js (v18+ / v20+), Express.js (v5), TypeScript |
| **Database & ORM** | Prisma ORM v5, SQLite (Local Dev) / PostgreSQL (Production) |
| **Authentication & Security** | Argon2id cryptographic hashing, JSON Web Tokens (JWT), Helmet.js, Express Rate Limit |
| **Execution Sandbox** | Controlled child-process compilation & execution (`gcc`, `g++`, `javac`, `python3`) |
| **AI Inference** | Groq API (`qwen/qwen-2.5-coder-32b`, `llama3-8b-8192`) with strict system prompt guardrails |
| **File Processing** | Multer (Memory Storage), XLSX (Excel Problem/Test-case parser) |

---

## 👥 Role-Based Capabilities (RBAC)

AutoLab strictly enforces 3 distinct roles: `STUDENT`, `FACULTY`, and `ADMIN`.

### 1. Student Portal (`/student/*`)
- **Dashboard (`/student/dashboard`)**: Visual summary of assigned labs, completion percentage, recent submission statuses, and quick navigation.
- **Topics & Labs (`/student/topics`, `/student/topics/:id`)**: Hierarchical navigation through curriculum topics (Arrays, Trees, Graphs, Dynamic Programming) to specific coding problems.
- **Monaco Code Editor (`/student/labs/:id/editor`)**:
  - Full-screen coding IDE with language selector (Python, C, C++, Java).
  - Pre-populated starter code and Markdown problem specification sidebar.
  - Interactive "Run Code" execution against custom stdin inputs.
  - Final "Submit Code" execution against full faculty test suites.
- **3-Level Progressive AI Hints**:
  - **Level 1 (Conceptual Clue)**: Identifies the high-level divergence between expected vs. actual logic.
  - **Level 2 (Targeted Guidance)**: Pinpoints specific loop boundaries, edge conditions, or data structure misconfigurations.
  - **Level 3 (Algorithmic Walkthrough)**: Outlines step-by-step logic corrections without writing the solution for the student.
- **Submissions & Diff Compare (`/student/submissions`, `/student/submissions/:id/compare`)**: Side-by-side Monaco diff comparison between historical attempts.
- **Live Leaderboard (`/student/leaderboard`)**: Real-time rank calculation based on verified `ACCEPTED` lab solutions.
- **Announcements (`/student/announcements`)**: Departmental notices and assignment updates published by faculty.

### 2. Faculty Portal (`/faculty/*`)
- **Dashboard & Analytics (`/faculty/dashboard`, `/faculty/analytics`)**: Real-time class progression metrics, submission pass rates, and performance distribution.
- **Lab & Problem Management (`/faculty/labs`, `/faculty/labs/create`, `/faculty/labs/:id/edit`)**:
  - Author problem statements, difficulty levels (`EASY`, `MEDIUM`, `HARD`), time/memory limits, and starter templates.
  - Configure public (visible sample tests) and hidden (grading evaluation) test cases.
- **Bulk Excel Import & Export (`/faculty/labs`, `/faculty/labs/test-cases`)**:
  - Import complete problem sets from `.xlsx` with automatic topic linking.
  - Import hundreds of test cases per problem key via spreadsheets.
  - Export test cases and problems for departmental records.
- **Assignment Distribution (`/faculty/labs/:id/assignments`)**: Assign labs to specific student batches with strict or soft deadlines.
- **Student Grading & Submissions Review (`/faculty/students/:id`, `/faculty/submissions/:id`)**: Inspect individual student code, execution timings, memory metrics, and test-by-test pass/fail breakdowns.
- **Announcements Publisher (`/faculty/announcements`)**: Broadcast announcements to enrolled students.

### 3. Administrator Portal (`/admin/*`)
- **Executive Dashboard (`/admin/dashboard`)**: Institutional metrics (total faculty, enrolled students, labs assigned, code executions).
- **Faculty Management**: Create faculty accounts, update departments, and activate/deactivate privileges with immediate session invalidation.
- **Student Directory (`/admin/students`)**: Manage university registration numbers, academic years, sections, and credential resets.
- **Live Activity Audit Stream**: Real-time chronological feed of evaluated code submissions and account events.

---

## 📂 Project Structure & Code Organization

```
college-programming-lab/
├── client/                               # Frontend Single-Page Application (React 19 + Vite)
│   ├── src/
│   │   ├── components/                   # Reusable UI components (AppBackButton, ThemeToggle, etc.)
│   │   ├── contexts/                     # AuthContext (JWT, user state, login/logout handlers)
│   │   ├── pages/
│   │   │   ├── admin/                    # Admin dashboard, faculty directory, student oversight
│   │   │   ├── faculty/                  # Lab creation, student grading, analytics, bulk import
│   │   │   ├── student/                  # Code editor, dashboard, submissions, leaderboard
│   │   │   ├── HomePage.tsx              # Public landing page with live system health check
│   │   │   └── LoginPage.tsx             # Universal authentication portal
│   │   ├── utils/                        # Axios HTTP client with JWT interceptor
│   │   ├── App.tsx                       # React Router configuration & ProtectedRoute definitions
│   │   └── main.tsx                      # Vite React root mounting
│   ├── package.json
│   └── vite.config.ts
│
├── server/                               # Backend RESTful API Server (Node.js + Express)
│   ├── prisma/
│   │   ├── dev.db                        # SQLite database (Git-ignored)
│   │   ├── schema.prisma                 # Declarative database schema and relations
│   │   └── seed.ts                       # Database seeding script with default accounts & 120+ labs
│   ├── src/
│   │   ├── controllers/                  # Express route controllers
│   │   │   ├── admin.controller.ts       # Faculty & student administration, activity feed
│   │   │   ├── auth.controller.ts        # Argon2id authentication & register-number slice login
│   │   │   ├── faculty.controller.ts     # Faculty student grading & bulk enrollment
│   │   │   ├── faculty.lab.controller.ts # Lab authoring, test case management, Excel I/O
│   │   │   ├── student.lab.controller.ts # Sandboxed code run & automated submission judge
│   │   │   └── student.hint.controller.ts# 3-level progressive GenAI hint generator
│   │   ├── middleware/                   # JWT auth guard (`requireAuth`) & RBAC (`requireRole`)
│   │   ├── routes/                       # Express router modules (`student.routes`, `faculty.routes`, etc.)
│   │   ├── services/
│   │   │   ├── ai/                       # Groq LLM API provider with educational guardrails
│   │   │   └── execution/                # Multi-language sandboxed process runner (Python/C/C++/Java)
│   │   ├── app.ts                        # Express middleware, security headers, rate limiters
│   │   └── server.ts                     # HTTP server bootstrapper
│   ├── package.json
│   └── tsconfig.json
│
├── .env.example                          # Environment variable template
├── .gitignore                            # Comprehensive ignore list (prevents secrets/db leaks)
├── package.json                          # Root package with concurrently dev scripts
└── README.md                             # This architectural documentation
```

---

## 🗄️ Database Schema (Prisma ORM)

The data model uses Prisma ORM with relational integrity and cascade rules:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                 String           @id @default(uuid())
  name               String
  email              String           @unique
  registerNumber     String?          @unique
  passwordHash       String
  role               String           // 'STUDENT' | 'FACULTY' | 'ADMIN'
  mustChangePassword Boolean          @default(false)
  department         String?
  year               Int?
  section            String?
  isActive           Boolean          @default(true)
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  createdLabs        Lab[]            @relation("FacultyCreatedLabs")
  labAssignments     LabAssignment[]
  submissions        Submission[]
  aiFeedbacks        AIFeedback[]
  announcements      Announcement[]
}

model Topic {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  orderIndex  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  labs        Lab[]
}

model Lab {
  id              String           @id @default(uuid())
  title           String
  description     String
  difficulty      String           // 'EASY' | 'MEDIUM' | 'HARD'
  topicId         String?
  topic           Topic?           @relation(fields: [topicId], references: [id])
  createdById     String
  createdBy       User             @relation("FacultyCreatedLabs", fields: [createdById], references: [id])
  allowedLangs    String           // JSON string array e.g. "[\"PYTHON\",\"C\",\"CPP\",\"JAVA\"]"
  starterCode     String?          // JSON object string of starter codes per language
  timeLimit       Int              @default(2000) // milliseconds
  memoryLimit     Int              @default(256)  // MB
  published       Boolean          @default(false)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  testCases       TestCase[]
  assignments     LabAssignment[]
  submissions     Submission[]
}

model TestCase {
  id             String                 @id @default(uuid())
  labId          String
  lab            Lab                    @relation(fields: [labId], references: [id], onDelete: Cascade)
  input          String
  expectedOutput String
  visibility     String                 @default("PUBLIC") // 'PUBLIC' | 'HIDDEN'
  orderIndex     Int                    @default(0)
  createdAt      DateTime               @default(now())

  testResults    SubmissionTestResult[]
}

model LabAssignment {
  id          String    @id @default(uuid())
  labId       String
  lab         Lab       @relation(fields: [labId], references: [id], onDelete: Cascade)
  studentId   String
  student     User      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  dueDate     DateTime?
  assignedAt  DateTime  @default(now())

  @@unique([labId, studentId])
}

model Submission {
  id             String                 @id @default(uuid())
  labId          String
  lab            Lab                    @relation(fields: [labId], references: [id])
  studentId      String
  student        User                   @relation(fields: [studentId], references: [id])
  code           String
  language       String                 // 'PYTHON' | 'C' | 'CPP' | 'JAVA'
  status         String                 // 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | etc.
  passedTests    Int                    @default(0)
  totalTests     Int                    @default(0)
  executionTime  Int?                   // ms
  memoryUsed     Int?                   // KB
  createdAt      DateTime               @default(now())

  testResults    SubmissionTestResult[]
  aiFeedbacks    AIFeedback[]
}

model SubmissionTestResult {
  id             String      @id @default(uuid())
  submissionId   String
  submission     Submission  @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  testCaseId     String
  testCase       TestCase    @relation(fields: [testCaseId], references: [id])
  status         String      // 'PASSED' | 'FAILED' | 'TIMEOUT' | 'ERROR'
  actualOutput   String?
  executionTime  Int?
  memoryUsed     Int?
  errorMessage   String?
}

model AIFeedback {
  id             String      @id @default(uuid())
  submissionId   String
  submission     Submission  @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  studentId      String
  student        User        @relation(fields: [studentId], references: [id])
  hintLevel      Int         @default(1) // 1 = Conceptual, 2 = Targeted, 3 = Solution Guidance
  feedbackJson   String      // Structured JSON from LLM
  createdAt      DateTime    @default(now())
}

model Announcement {
  id          String   @id @default(uuid())
  title       String
  content     String
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  published   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 🔒 Security, Sandboxing & AI Guardrails

### 1. Code Execution Sandboxing
- Code execution runs inside isolated, dynamically allocated temporary directories (`/tmp/autolab_<uuid>`).
- Subprocesses are executed using restricted `child_process.spawn` parameters:
  - **Hard Execution Timeout**: Default 2000–5000ms. If exceeded, the process group is sent `SIGKILL` and returns `TIME_LIMIT_EXCEEDED`.
  - **Output Buffer Cap**: Max 256KB. Prevents infinite output loops from exhausting server memory (`OUTPUT_LIMIT_EXCEEDED`).
  - **Automatic Cleanup**: Scratch directories and compiled binaries are immediately purged via `fs.rm(tempDir, { recursive: true, force: true })` in a `finally` block.

### 2. Pedagogical AI Tutor Guardrails
The Groq LLM integration enforces strict institutional constraints in `GroqProvider`:
1. **No Complete Answers**: Never provides the finished code or rewrites the student's solution.
2. **No Hidden Test Case Leakage**: Hidden test inputs and expected outputs are never included in the prompt context.
3. **Structured JSON Output**: All responses are validated against a strict Zod schema (`errorType`, `explanation`, `hint`, `concepts`, `nextSteps`).
4. **Adaptive Hint Levels**: Delivers hints proportional to student struggle (Level 1 = High-level concept clue, Level 2 = Bug identification, Level 3 = Algorithmic pseudo-logic).

### 3. Authentication & Credential Convention
- User passwords are encrypted with **Argon2id** (memory-hard, resistant to GPU attacks).
- **College Register Number Convention**: Students can log in using either their full register number (`8115U23CS001`) or email, with either their password (`password123`) or their automatic register number slice (`23CS001`).

---

## 🚀 Installation & Local Development

### Prerequisites
- **Node.js**: v18.x or v20.x+
- **Compilers**:
  - Python 3 (`python3`)
  - GCC / G++ (`gcc`, `g++`)
  - OpenJDK 17+ (`javac`, `java`)
- **Git**

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/ARON08-AJ/AI-CODE-EVALUATOR-AUTOMATED-LAB-TUTOR.git
cd AI-CODE-EVALUATOR-AUTOMATED-LAB-TUTOR

# 2. Install all root, backend, and frontend dependencies
npm install
cd server && npm install
cd ../client && npm install
cd ..

# 3. Configure Environment Variables
# Copy the template in server/
cp server/.env.example server/.env
```

Edit `server/.env` with your desired configuration:
```env
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-ultra-secure-jwt-secret-key"
JWT_EXPIRES_IN="1d"
CLIENT_URL="http://localhost:5173"

MAX_BULK_STUDENTS=500
EXECUTION_TIMEOUT_MS=5000
EXECUTION_OUTPUT_LIMIT=100000
MAX_SOURCE_CODE_SIZE=100000
MAX_EXECUTION_INPUT_SIZE=100000
MAX_CONCURRENT_EXECUTIONS=5

# AI Debugging Tutor Configuration
USE_MOCK_AI="false"
GROQ_API_KEY="your_groq_api_key_here"
GROQ_MODEL="llama3-8b-8192"
```

```bash
# 4. Generate Prisma Client & Initialize Database
cd server
npx prisma generate
npx prisma db push
npm run seed     # Pre-populates default accounts and 120+ coding labs
cd ..

# 5. Launch Unified Development Environment
npm run dev
```

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000/api`
- **Health Check**: `http://localhost:3000/api/health`

---

## 🔑 Default System Test Accounts

The seed script creates the following pre-configured user accounts:

| Role | Username / Identifier | Default Password | Notes |
|---|---|---|---|
| **System Administrator** | `admin@college.edu` | `admin123` / `password123` | Institutional oversight, faculty provisioning |
| **Faculty Instructor 1** | `faculty@example.com` | `password123` | Dr. Jane Smith (`FAC001`) |
| **Faculty Instructor 2** | `faculty2@example.com` | `password123` | Dr. Robert Wilson (`FAC002`) |
| **Student 1** | `8115U23CS001` or `8115u23cs001@student.example.com` | `23CS001` or `password123` | Alice Johnson (CSE Year 2) |
| **Student 2** | `8115U23CS002` or `8115u23cs002@student.example.com` | `23CS002` or `password123` | Bob Williams (CSE Year 2) |
| **Student 3** | `8115U23CS003` or `8115u23cs003@student.example.com` | `23CS003` or `password123` | Aron Jonath AN (CSE Year 2) |
| **Student 4** | `8115U23CS004` or `8115u23cs004@student.example.com` | `23CS004` or `password123` | Charlie Davis (CSE Year 2) |
| **Student 5** | `8115U23CS005` or `8115u23cs005@student.example.com` | `23CS005` or `password123` | David Miller (CSE Year 2) |

---

## 🛠️ Verification & Build Commands

Both frontend and backend are continuously validated for strict TypeScript adherence:

```bash
# Verify Backend TypeScript compilation
cd server && npx tsc --noEmit

# Verify Frontend Production Build & Bundling
cd client && npm run build
```

---

## 🤖 Context for AI Coding Agents

When working on this repository with autonomous AI coding agents (Antigravity, Cursor, Claude, Copilot):

1. **Architecture Preservations**:
   - Do **NOT** rewrite existing database tables with destructive `prisma migrate reset` commands.
   - Always run non-destructive build checks (`tsc --noEmit` and `npm run build`) before concluding any task.
2. **Execution Sandbox**:
   - The execution engine resides in `server/src/services/execution/`. All process spawns must enforce timeouts and output buffer limits.
3. **AI Guardrails**:
   - The AI tutoring logic in `server/src/services/ai/groq.provider.ts` must maintain strict anti-solution leakage rules. Never allow the LLM to output replacement code blocks to students.
4. **Credential Handling**:
   - Always verify passwords via `argon2.verify()`. Preserve the register number slice fallback in `auth.controller.ts`.
5. **Secrets & Git**:
   - Never commit `.env` files or API keys. Always keep `.gitignore` strictly preventing `*.db`, `node_modules`, and secret files from entering version control.

---

## 📄 License

Academic and institutional project developed for college programming laboratory management. All rights reserved.
