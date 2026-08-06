# AI Code Evaluator & Automated Lab Tutor

A full-stack web application designed to improve computer science education by providing a secure online programming laboratory, automated test case evaluation (public and hidden), and AI-assisted educational tutoring without revealing full code solutions.

## Architecture Overview

```
                        +----------------------------------------+
                        |        React 18 + Vite Frontend        |
                        |      Tailwind CSS & Monaco Editor      |
                        +-------------------+--------------------+
                                            |
                                            v (REST APIs & JWT)
                        +-------------------+--------------------+
                        |       Spring Boot 3 REST Backend       |
                        |        Java 21 & SQLite Database       |
                        +---------+--------------------+---------+
                                  |                    |
                                  v                    v
                  +---------------+---+     +----------+-------------+
                  | Execution Engine  |     |  AI Educational Tutor  |
                  | (Docker / Local)  |     | (Groq / OpenRouter API)|
                  +-------------------+     +------------------------+
```

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Monaco Editor (`@monaco-editor/react`), Lucide Icons, Axios, React Router v6.
- **Backend**: Spring Boot 3.2, Java 21, Spring Security JWT, Spring Data JPA, SQLite (`aievaluator.db`), Springdoc OpenAPI Swagger (`/swagger-ui.html`), SLF4J / Logback.
- **Code Execution**: `DockerExecutionService` (`--network none`, `--read-only`, `--memory 256m`, `--cpus 0.5`, `--pids-limit 50`) with fallback to `LocalExecutionService` process sandbox.
- **AI Integration**: Groq API / OpenRouter API with structured JSON output guardrails (`{ "analysis", "hint1", "hint2", "hint3", "recommendedTopics" }`).

## Quick Start & Usage

### Preloaded Demo Accounts

1. **Student Account**:
   - Email: `student@lab.edu`
   - Password: `password123`
2. **Faculty Account**:
   - Email: `faculty@lab.edu`
   - Password: `password123`

### Key Endpoints & Documentation

- **Frontend Application**: `http://localhost:5173`
- **Swagger OpenAPI Documentation**: `http://localhost:8080/swagger-ui.html`
- **Database File**: `backend/aievaluator.db`

### Phase 2 Roadmap & Future Extensions

See [`future/README.md`](future/README.md) for Phase 2 architectural plans:
- AI Code Quality Reviewer & Complexity Analyzer
- AI AST-based Plagiarism Detector
- AI Resume & Portfolio ATS Analyzer
- AI Technical & HR Mock Interview Simulator
- AI Aptitude & Soft Skills Coach
