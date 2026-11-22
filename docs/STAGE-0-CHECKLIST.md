# Stage 0 Implementation Checklist

## Product and governance
- [ ] Review product specification.
- [ ] Review architecture decisions.
- [ ] Confirm local-first single-user deployment.
- [ ] Complete licence and community policy review.

## Security and privacy
- [ ] Review threat model.
- [ ] Verify databases, exports, backups, and secrets are ignored by Git.
- [ ] Confirm API loopback binding.
- [ ] Define export, deletion, backup, and restore behaviour.

## Technical proof of concept
- [ ] Create React + TypeScript + Vite app.
- [ ] Create Fastify API with a health endpoint.
- [ ] Connect local SQLite database.
- [ ] Verify frontend-to-API communication.
- [ ] Build a small interactive 3D scene.
- [ ] Measure memory, load time, and rendering performance.

## Quality automation
- [ ] Configure formatter and linter.
- [ ] Add Vitest unit tests.
- [ ] Add Playwright smoke test.
- [ ] Configure GitHub Actions.
- [ ] Enable dependency and secret scanning.

## Publication readiness
- [ ] Confirm no personal data or secrets are tracked.
- [ ] Review third-party asset licences.
- [ ] Review contribution and security reporting process.
- [ ] Confirm CI checks pass.
