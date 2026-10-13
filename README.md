# Pulso Backend API

Pulso is a wellness backend platform featuring an emotional-support assistant powered by an LLM, developed under Clean Architecture principles using NestJS, TypeScript, PostgreSQL, and Prisma.

---

## Architecture & Module Structure

```text
src/
├── app.module.ts
├── main.ts
├── modules/
│   └── health/
│       ├── domain/
│       │   └── health.entity.ts           # Entities and HealthChecker ports
│       ├── application/
│       │   ├── get-health.use-case.ts     # Business use case logic
│       │   └── get-health.use-case.spec.ts
│       ├── infrastructure/
│       │   └── prisma-database-health-checker.ts # Adapter implementing port
│       ├── presentation/
│       │   └── health.controller.ts       # HTTP endpoint exposing GET /health
│       └── health.module.ts
└── shared/
    ├── config/                            # Runtime strict environment validation
    ├── errors/                            # Standard error formats and GlobalExceptionFilter
    ├── infrastructure/                    # Database Prisma Client
    └── logging/                           # PrivacyLogger (body & secrets stripped)
```

---

## Getting Started from Zero

### Prerequisites
- Node.js >= 20.x
- Docker & Docker Compose
- npm >= 10.x

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your database port matches your docker configuration (default: `5434` to prevent port conflicts).

### 2. Start PostgreSQL Container
```bash
docker compose up -d
```

### 3. Run Database Migrations
```bash
npm run db:migrate
```

### 4. Start the Application
In development watch mode:
```bash
npm run start:dev
```
Or build and start in production:
```bash
npm run build
npm run start:prod
```

API will be listening at: `http://localhost:3000`  
Swagger UI documentation: `http://localhost:3000/docs`

---

## Testing & Quality

- **Linting:**
  ```bash
  npm run lint
  ```
- **Unit Tests:**
  ```bash
  npm run test
  ```
- **E2E Tests:**
  ```bash
  npm run test:e2e
  ```

---

## Privacy & Safety Core Principles

- **No Body Logging:** The custom `PrivacyLogger` and `HttpLoggingMiddleware` drop all request payloads, message texts, chat contents, prompts, tokens, and secrets.
- **Strict Verification:** Automated unit and e2e tests ensure that sensitive user content never leaks to logs or stdout.

---

## GitFlow Workflow

- `main`: Production-ready code.
- `develop`: Integration branch for completed features.
- Feature branches: `feature/part-N-<name>` branched from `develop`.
- Commits follow **Conventional Commits** (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).
- Merges to `develop` require an approved PR.
