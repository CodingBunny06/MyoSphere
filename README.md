# MyoSphere

**An open-source, self-hosted fitness platform.**

MyoSphere aims to bring workout tracking, nutrition, interactive 3D anatomy, exercise visualization, and optional AI-powered insights into one platform.

> **Development status:** Stage 0 — foundation and technical validation. Not yet suitable for production or real personal fitness records.

## Planned modules

- **Workout Hub:** routines, sets, reps, loads, training history, personal records, and progression.
- **Nutrition Hub:** food search, meal logging, calories, macros, and hydration.
- **3D Anatomy:** interactive muscular anatomy with selectable muscle groups.
- **Exercise Studio:** rotatable 3D exercise demonstrations with playback controls.
- **AI Fitness Intelligence:** optional insights based on data the user explicitly authorizes.
- **Dashboard:** a unified view of training and nutrition progress.

## Principles

- Local-first and self-hosted by default.
- Private fitness data stays out of the public source repository.
- No external AI data sharing without explicit user consent.
- Clearly distinguish measured data, estimates, and visual approximations.
- Testable, accessible, maintainable software.
- Third-party assets and datasets require verified licences.

## Planned stack

| Area | Initial choice |
|---|---|
| Web | React, TypeScript, Vite |
| UI | Tailwind CSS |
| 3D | Three.js, React Three Fiber |
| API | Node.js, TypeScript, Fastify |
| Database | SQLite |
| State | Zustand |
| Charts | Recharts |
| Tests | Vitest, Playwright |
| Mobile | Capacitor (later phase) |

Choices will be validated during Stage 0.

## Project documentation

- [Product specification](docs/PRODUCT-SPEC.md)
- [Architecture decisions](docs/ARCHITECTURE.md)
- [Data model](docs/DATA-MODEL.md)
- [Security baseline](docs/SECURITY.md)
- [Asset policy](docs/ASSET-POLICY.md)
- [Roadmap](docs/ROADMAP.md)
- [Stage 0 checklist](docs/STAGE-0-CHECKLIST.md)

## Privacy and security

Never commit real workout logs, body measurements, nutrition records, photographs, database files, exports, credentials, or API keys. Use synthetic data in examples and tests.

Read [SECURITY.md](SECURITY.md) before reporting a vulnerability.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request.

## Licence

MyoSphere is licensed under the **GNU Affero General Public License v3.0**. See [LICENSE](LICENSE).

Third-party assets and datasets may have separate licences and conditions.
