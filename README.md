# Billing Service - Quotes and Payments

Microservice responsible for quote management, payment processing via Mercado Pago, parts catalog, and service catalog.

## Architecture

| Component | Technology |
|-----------|-----------|
| Framework | NestJS (TypeScript) |
| Database | MongoDB 7 (NoSQL) |
| Payment Gateway | Mercado Pago SDK |
| Messaging | RabbitMQ 3.12 |
| Auth | JWT (global guard) |
| Containers | Docker (multi-stage) |
| Orchestration | Kubernetes |
| CI/CD | GitHub Actions |
| Quality | ESLint + SonarQube |

### Saga Pattern - Choreographed

**Justification:**
1. **Lower coupling** - No centralized orchestrator as single point of failure.
2. **Independent scalability** - Each service scales without orchestrator bottleneck.
3. **Higher resilience** - Events queued in RabbitMQ survive temporary service downtime.
4. **Simplicity** - Event-driven approach aligns with RabbitMQ infrastructure.

**Flow (Billing perspective):**
```
Receives [work-order.created] -> generates base quote
Publishes [quote.approved]    -> triggers payment processing
Publishes [payment.approved]  -> triggers Execution Service
```

**Compensation/Rollback:**
```
On [work-order.cancelled] -> cancels quote + processes refund
On [execution.failed]     -> processes refund via Mercado Pago
On payment rejection      -> publishes [payment.rejected] for OS Service
```

## Related Repositories

| Service | Repository | Database |
|---------|-----------|----------|
| OS Service (entrypoint, hosts docs) | `garage-os-service` | PostgreSQL |
| **Billing Service** (this) | `garage-billing-service` | MongoDB |
| Execution Service | `garage-execution-service` | PostgreSQL |

Architecture documentation: see `docs/` in `garage-os-service`.

## Features

- Quote CRUD with expiration validation
- Quote approval/rejection workflow
- Payment processing via Mercado Pago (PIX, Credit Card, Debit Card, Boleto)
- Payment verification and status sync
- Parts catalog with stock management
- Service catalog management
- Event publishing/consumption via RabbitMQ
- JWT authentication

## Quick Start

```bash
# 1. Start local infrastructure (MongoDB + dedicated RabbitMQ for Billing)
cd ../garage-billing-service
docker compose up -d

# 2. Clone and install
git clone <repo-url>
cd garage-billing-service
npm install

# 3. Start service (starts Billing service and its infrastructure)
docker compose up -d

# 4. Configure environment
cp .env.example .env
# Set MERCADOPAGO_ACCESS_TOKEN and MERCADOPAGO_PUBLIC_KEY

# 5. Run in development
npm run start:dev
```

### Docker Compose (full stack)

```bash
docker compose up -d
```

This starts MongoDB, RabbitMQ (dedicated to Billing) and the Billing service.

## API

### Swagger

Interactive documentation: `http://localhost:3002/api`

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /quotes | Create quote |
| GET | /quotes | List quotes |
| GET | /quotes/:id | Get quote |
| GET | /quotes/work-order/:id | Quotes by work order |
| PATCH | /quotes/:id/approve | Approve quote |
| PATCH | /quotes/:id/reject | Reject quote |
| PATCH | /quotes/:id/send | Send to customer |
| POST | /payments | Create payment |
| POST | /payments/:id/process | Process via Mercado Pago |
| GET | /payments | List payments |
| GET | /payments/:id | Get payment |
| GET | /payments/work-order/:id | Payments by work order |
| PATCH | /payments/:id/verify | Verify with Mercado Pago |
| POST | /parts | Create part |
| GET | /parts | List parts |
| GET | /parts/low-stock | Low stock alerts |
| GET | /parts/:id | Get part |
| PUT | /parts/:id | Update part |
| PUT | /parts/:id/stock | Update stock |
| DELETE | /parts/:id | Delete part |
| POST | /services | Create service |
| GET | /services | List services |
| GET | /services/:id | Get service |
| PUT | /services/:id | Update service |
| DELETE | /services/:id | Delete service |
| GET | /health | Health check (no auth) |

### Postman

Collection: `postman_collection.json`

## Testing

```bash
npm run test          # unit tests
npm run test:cov      # coverage report
npm run test:e2e      # BDD/E2E tests
```

### Coverage

Minimum threshold: **80%** (enforced in `jest.config.js` and CI pipeline).

```
All files            |    100% Stmts |   88.88% Branch |    100% Funcs |    100% Lines
Test Suites: 11 passed | Tests: 78 passed
```

### BDD Tests

```bash
npx jest --config test/jest-e2e.json test/bdd/
# 10 passing (billing flow + saga compensation)
```

## CI/CD Pipeline

`.github/workflows/ci-cd.yaml` executes:

1. `npm ci` - Install
2. `npm run lint` - ESLint
3. `npm run test:cov` - Tests + coverage
4. Coverage check (>= 80%)
5. SonarQube scan
6. Docker build + push to ECR (main only)
7. Kubernetes deployment (main only)

### Branch Protection

- `main` branch protected
- PR required with CI checks passing

## Deployment

```bash
# Docker
docker build -t garage-billing-service .
docker run -p 3002:3002 --env-file .env garage-billing-service

# Kubernetes
kubectl apply -f k8s/deployment.yaml
kubectl rollout status deployment/billing-service
```

## Environment Variables

See `.env.example` for all required variables.

## License

MIT
