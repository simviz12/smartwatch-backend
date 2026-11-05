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

## Autenticación (inicio de sesión)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/v1/auth/register` | `{ name, email, password }` → crea la cuenta y devuelve `{ token, user }` |
| `POST` | `/v1/auth/login` | `{ email, password }` → `{ token, user }` |
| `GET` | `/v1/auth/me` | Usuario actual. Cabecera `Authorization: Bearer <token>` |

- Contraseñas guardadas con **bcrypt** (nunca en texto plano); el token es un **JWT** válido 30 días.
- Correo y contraseña incorrectos devuelven el mismo error, para no revelar qué cuentas existen.
- Si defines `DEMO_EMAIL` y `DEMO_PASSWORD`, al arrancar se crea esa cuenta demo (útil para revisores).
- Documentación interactiva en `/docs` (Swagger).

---

## Despliegue en Render (gratis)

El archivo [`render.yaml`](render.yaml) crea la base de datos PostgreSQL y el servicio web automáticamente.

1. Sube este repositorio a GitHub (rama `main`).
2. Entra a [render.com](https://render.com) e inicia sesión con GitHub.
3. **New › Blueprint** y elige el repositorio `smartwatch-backend`.
4. Render pedirá un valor para **`DEMO_PASSWORD`**: escribe la contraseña de la cuenta demo (mínimo 8 caracteres).
5. Pulsa **Apply**. Render crea `pulso-db` y `pulso-api`, compila, aplica las migraciones y arranca.
6. Cuando termine, copia la URL del servicio (por ejemplo `https://pulso-api.onrender.com`) y comprueba:
   - `https://<tu-url>/health` → `{"status":"ok", "database":"up", …}`
   - `https://<tu-url>/docs` → Swagger.
7. En la app del celular, pon esa URL en `local.properties` (`PULSO_API_URL=https://<tu-url>`) o como *secret* `PULSO_API_URL` del repositorio del frontend, y vuelve a generar el APK.

**Cuenta para el profesor:** `profesor@pulso.app` con la contraseña que pusiste en `DEMO_PASSWORD`. También puede crear su propia cuenta desde la app.

> Plan gratuito: el servicio se duerme tras ~15 min sin uso y tarda ~1 minuto en despertar con la primera petición (la app muestra un aviso mientras tanto). La base de datos gratuita de Render caduca a los 30 días; después hay que crear una nueva o pasar a un plan de pago.

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
