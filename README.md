# JadeNode

JadeNode is a cloud infrastructure marketplace for VPS and server services, operated by ZaganJade.

This repository is organized as a monorepo for the MVP Foundation milestone.

## Monorepo Layout

```text
apps/
  web/                  # Next.js frontend application
backend/                # Laravel 12 API and business logic
packages/
  shared/
    api-client/          # Generated or typed API client from OpenAPI
    types/               # Shared TypeScript types
    constants/           # Shared constants used by frontend/tooling
infra/
  docker/                # Docker Compose and container configuration
  scripts/               # Local/dev/prod helper scripts
docs/                   # PRD, architecture, API docs, sprint plans, stories
bmad/                   # BMAD project configuration
```

## Current BMAD Status

- Current milestone: **MVP Foundation**
- Workflow status: `docs/bmm-workflow-status.yaml`
- Sprint plan: `docs/sprint-plan-mvp-foundation.md`
- Story backlog: `docs/stories-mvp-foundation.md`
- Current implementation story: `docs/stories/STORY-FND-001.md`

## Key Documents

- Domain context: `CONTEXT.md`
- PRD: `docs/PRD.md`
- Scope resolution: `docs/PRD-scope-resolution.md`
- Architecture overview: `docs/architecture/overview.md`
- Backend architecture: `docs/architecture/backend-modules.md`
- Frontend architecture: `docs/architecture/frontend-architecture.md`
- API contract: `docs/architecture/api-contract.md`
- OpenAPI starter: `docs/api/openapi.yaml`
- Local setup guide: `docs/development/local-setup.md`
- Production deployment guide: `docs/production/deployment.md`

## Technology Direction

- Frontend: Next.js + React + TypeScript
- Backend: Laravel 12
- Database: PostgreSQL
- Queue/cache: Redis
- Payments: Midtrans Snap for MVP Foundation direct invoice payments
- Email: Resend in production, Mailpit locally
- Object storage: Cloudflare R2 in production, MinIO locally

## Development Note

This story only establishes the repository structure. Framework scaffolding starts in later stories:

- `STORY-FND-003` — Laravel 12 API backend
- `STORY-FND-004` — Next.js web app
