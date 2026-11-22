# Architecture Decisions

Status: proposed baseline for Stage 0 validation.

## Deployment model

Local-first, single-user, self-hosted application.

- Web frontend served locally.
- API listens on `127.0.0.1` by default.
- SQLite stores user records outside tracked source files.
- No public server or remote account system in the first milestone.
- Remote access is out of scope until authentication, TLS, threat modelling, and explicit configuration are implemented.

## Technology baseline

- Frontend: React + TypeScript + Vite.
- UI: Tailwind CSS.
- 3D: Three.js + React Three Fiber.
- Asset interchange: glTF/GLB.
- API: Node.js + TypeScript + Fastify.
- Storage: SQLite initially, behind a repository abstraction.
- State: Zustand.
- Charts: Recharts.
- Tests: Vitest + Playwright.
- Mobile packaging: evaluate Capacitor after the web experience is stable.

## Boundaries

- Frontend communicates with the API; browser code does not access the database directly.
- Validate API input at the boundary.
- Keep domain logic separate from route handlers and UI components.
- Keep persistence behind interfaces so SQLite can later be replaced if needed.
- Lazy-load large 3D assets and scenes.
- Keep AI integrations behind an explicit opt-in service boundary.

## Security defaults

- Bind to loopback only for local development.
- Do not expose the API to a LAN or internet by default.
- Keep secrets in local ignored environment files.
- Keep databases, exports, and backups out of the repository.
- Use synthetic fixtures for tests and screenshots.
- Enable dependency auditing and secret scanning.
- Before remote deployment, add authentication, TLS, authorization, rate limiting, and appropriate origin/CSRF protections.

## Architecture decisions

### ADR-001: Local-first single-user deployment
Start with a local self-hosted instance and SQLite to reduce operational and privacy complexity. Revisit when synchronisation, multi-user access, or remote hosting becomes a concrete requirement.

### ADR-002: Shared TypeScript stack
Use TypeScript for frontend, API, and shared contracts for consistent types and tooling.

### ADR-003: 3D performance validation
Prototype with a small GLB model before committing to detailed anatomy assets. Validate memory, load time, rendering performance, and mobile feasibility.

### ADR-004: Explicit AI consent
AI features are opt-in and disclose data sent to external services. Fitness records and body measurements are sensitive personal information.
