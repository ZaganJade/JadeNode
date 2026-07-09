# JadeNode

**Cloud infrastructure marketplace for VPS and server services.**

JadeNode is a full-stack platform where customers discover, order, pay for, and
manage server/VPS resources from first-party and verified third-party providers.
Built as a monorepo with a Next.js frontend and a modular Laravel 12 API backend.

> Operated by **ZaganJade** — final project (UAS) for Workshop Desain UI, Semester 4.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Monorepo Layout](#monorepo-layout)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Documentation](#documentation)
- [License](#license)

---

## Overview

JadeNode connects **providers** (sellers of server/VPS resources) with
**customers** (buyers) through a single marketplace. The platform handles the
full lifecycle: product discovery → cart & checkout → payment → deployment &
resource management → billing & invoices → support.

The codebase is organized as a monorepo containing a Next.js web application and
a Laravel API with domain-based modules.

---

## Tech Stack

| Layer         | Technology                                                         |
| ------------- | ----------------------------------------------------------------- |
| Frontend      | Next.js 15, React 19, TypeScript, Tailwind CSS v4                 |
| Backend       | Laravel 12, PHP 8.3+                                              |
| Database      | PostgreSQL                                                        |
| Cache / Queue | Redis                                                             |
| Payments      | Midtrans Snap                                                     |
| Auth          | Laravel Sanctum (cookie sessions), email verification             |
| Email         | Resend (production), Mailpit (local)                              |
| Storage       | Cloudflare R2 (production), MinIO (local)                         |
| Tooling       | pnpm workspaces, Docker Compose, Biome                            |

---

## Monorepo Layout

```text
Frontend/              # Next.js 15 web app (@jadenode/web)
  app/                 # App Router — route groups: (public) (auth) (customer) (admin)
  components/          # Shared UI, layout, landing, cart, docs, admin
  features/            # Feature-sliced modules (marketplace, checkout, profile, …)
  lib/                 # API client, auth helpers, utilities
  public/              # Static assets (article SVGs, product images)

backend/               # Laravel 12 API
  app/Modules/         # Domain modules (see below)
  app/Http/            # Requests, Resources, Middleware, Controllers
  database/            # Migrations, seeders, factories
  routes/api.php       # API route definitions (/v1/*)
  tests/               # Feature and unit tests

packages/shared/       # Shared types, constants, API client
infra/
  docker/              # Docker Compose for local services (Postgres, Redis, …)
  scripts/             # setup.sh, dev.sh helper scripts
docs/                  # PRD, architecture, API specs, setup & deployment guides
bmad/                  # BMAD project configuration
```

### Backend Domain Modules

`Admin` · `Auth` · `Marketplace` · `Order` · `Deployment` · `Billing` ·
`Provider` · `Article` · `Support` · `Audit` · `Notification` · `Monitoring` ·
`Shared`

---

## Features

### Customer-facing

- **Marketplace** — browse VPS/server listings by category, view product detail & similar items
- **Cart & Checkout** — single or multi-item checkout with Midtrans Snap payments
- **Deployments** — manage purchased resources (start/stop/restart actions, SSH keys, credentials)
- **Orders, Invoices & Transactions** — full order history and payment tracking
- **Support Tickets** — open and reply to support tickets
- **Beta Access** — gated checkout during the private beta period
- **Profile & Settings** — account management with email verification

### Admin dashboard

- Dashboard stats, user management (CRUD + suspend/restore), provider & listing management
- Payment list with Midtrans sync, provisioning tasks, resource actions
- Support ticket handling, audit logs, article (blog) management

### Public

- Marketing landing pages (services, pricing, lifecycle)
- Article/blog listing and detail
- Interactive API documentation page

---

## Prerequisites

- **Git**
- **Node.js** ≥ 20 LTS
- **pnpm**
- **PHP** 8.3 or 8.4
- **Composer**
- **Docker** Desktop or Docker Engine (for local Postgres, Redis, Mailpit, MinIO)

Verify your versions:

```bash
node --version      # >= 20.x
pnpm --version
php --version       # 8.3+ or 8.4+
composer --version
docker --version
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ZaganJade/JadeNode.git
cd JadeNode
```

### 2. Start local infrastructure (Postgres, Redis, Mailpit, MinIO)

```bash
cd infra/docker
cp .env.example .env
docker compose -f docker-compose.local.yml up -d
cd ../..
```

### 3. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env — set DB, Redis, Midtrans, and mail credentials
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve   # http://127.0.0.1:8000
cd ..
```

### 4. Frontend setup

```bash
cd Frontend
pnpm install
pnpm dev            # http://localhost:3000
```

---

## Environment Variables

The project uses three environment files. Copy each `.env.example` to `.env` and
fill in the values.

| File                  | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `.env`                | Root monorepo vars (Docker, MinIO, Midtrans, Resend)     |
| `backend/.env.example`| Laravel config (DB, Redis, Mail, Storage, Midtrans)      |
| `Frontend/.env`       | Frontend API URL (`NEXT_PUBLIC_API_URL`)                 |

Key integrations requiring credentials:

- **Midtrans** — `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION` (use sandbox for local)
- **Resend** — `RESEND_API_KEY` for transactional email (Mailpit used locally)
- **Cloudflare R2 / MinIO** — `AWS_*` keys for object storage

---

## Available Scripts

### Frontend (`cd Frontend`)

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `pnpm dev`      | Start the Next.js dev server         |
| `pnpm build`    | Production build                     |
| `pnpm start`    | Run the production build             |
| `pnpm lint`     | Lint with Next.js / Biome            |
| `pnpm typecheck`| TypeScript type checking             |

### Backend (`cd backend`)

| Command                        | Description                          |
| ------------------------------ | ------------------------------------ |
| `php artisan serve`            | Start the Laravel dev server         |
| `php artisan migrate`          | Run database migrations              |
| `php artisan migrate --seed`   | Migrate and seed the database        |
| `php artisan test`             | Run the test suite                   |
| `php artisan route:list`       | List all registered API routes       |

---

## Documentation

Detailed project documentation lives in [`docs/`](./docs):

- **PRD** — [`docs/PRD.md`](./docs/PRD.md)
- **Architecture** — [`docs/architecture/`](./docs/architecture/)
- **API contract** — [`docs/architecture/api-contract.md`](./docs/architecture/api-contract.md)
- **Local setup guide** — [`docs/development/local-setup.md`](./docs/development/local-setup.md)
- **Deployment guide** — [`docs/production/deployment.md`](./docs/production/deployment.md)
- **Domain context** — [`CONTEXT.md`](./CONTEXT.md)
- **Design system** — [`DESIGN.md`](./DESIGN.md)

The public API base path is `/v1/`. Key entrypoints:

- `GET /v1/health` — health check
- `POST /v1/auth/login`, `POST /v1/auth/register` — authentication
- `GET /v1/marketplace/listings` — public product catalog
- `POST /v1/orders`, `POST /v1/cart/checkout` — checkout (beta-gated)
- `POST /v1/webhooks/midtrans` — payment webhook

---

## License

This project is developed for academic purposes (UAS — Workshop Desain UI,
Semester 4). All rights reserved by **ZaganJade**.
