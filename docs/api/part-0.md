# API Contract Documentation — Part 0 (Backend Foundation)

## Base URL
- Local: `http://localhost:3000`
- Binding Host: `0.0.0.0`

---

## Endpoints

### 1. Health Status
- **Method:** `GET`
- **Path:** `/health`
- **Authentication:** None
- **Headers:** None required

#### Request
- No query parameters or request body.

#### Success Response (`200 OK`)
```json
{
  "status": "ok",
  "service": "pulso-api",
  "version": "0.1.0",
  "time": "2026-10-13T01:51:36.120Z",
  "database": "up"
}
```

#### Degraded Response (`200 OK`)
When the database connectivity check fails:
```json
{
  "status": "degraded",
  "service": "pulso-api",
  "version": "0.1.0",
  "time": "2026-10-13T01:51:36.120Z",
  "database": "down"
}
```

---

## Global Error Format
All unhandled or managed exceptions adhere to this strict JSON format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Cannot GET /unknown"
  }
}
```

### Standard Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BAD_REQUEST` | 400 | Validation error or malformed input |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource or route not found |
| `CONFLICT` | 409 | State conflict |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected internal failure |

---

## SSE Streams
*None in Part 0.*

---

## Interactive Documentation
Swagger UI is exposed at:
- `http://localhost:3000/docs`
- Static OpenAPI 3.0 specification file is located at the project root: `openapi.yaml`.
