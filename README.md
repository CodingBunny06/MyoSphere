# MyoSphere

**An open-source, local-first fitness platform.**

MyoSphere brings workout tracking, nutrition, body progress, interactive 3D anatomy, exercise visualization, and optional AI-powered insights into one platform.

> **Development status:** Early prototype. The responsive dashboard, manual workout/nutrition/progress logging, theme preferences, and a GLB-based anatomy viewer are implemented. The detailed anatomy model is a separately supplied asset and must be installed locally. The app is not production-ready.

## Current prototype

- Responsive React + TypeScript + Vite dashboard.
- Responsive Overview, Training, Nutrition, Progress, Studio, and Settings sections.
- Mobile-first layout with a mobile navigation bar.
- PWA manifest foundation for a future iPhone Home Screen install.
- Private-by-default product direction.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
git clone https://github.com/CodingBunny06/MyoSphere.git
cd MyoSphere
npm install
npm run dev
```

Open the local URL printed by Vite.

To preview on an iPhone connected to the same Wi-Fi:
1. Find your Mac's local IP address in System Settings → Wi-Fi → Details.
2. Keep the Vite development server running.
3. Open `http://YOUR-MAC-IP:5173` in iPhone Safari.

This is a development preview only. Do not expose the development server to an untrusted network.

Build and type-check:

```bash
npm run build
```

## Mobile direction

MyoSphere is being developed as a responsive web app first, with a PWA-ready manifest. Native iOS packaging with Capacitor is planned after the web experience and local data layer are stable.

## Anatomy model setup\n\nThe Studio loads `public/models/myosphere_muscles_bp3d.glb`. The model is not committed to this repository yet. Extract the supplied model archive and copy the GLB into that exact path. Read [the anatomy attribution and asset limitations](docs/ANATOMY-ATTRIBUTION.md) before redistributing it. The asset is CC BY 4.0; the application code remains AGPL-3.0.\n\n## In development / planned next

- **Workout Hub:** exercise media, personal records, progression charts, muscle-volume analysis, and reusable workout templates.
- **Nutrition Hub:** food search, meal logging, calories, macros, and hydration.
- **Body Progress:** private progress photos, check-ins, measurements, and comparisons.
- **3D Anatomy:** interactive muscular anatomy with selectable muscle groups.
- **Exercise Studio:** rotatable 3D exercise demonstrations with playback controls.
- **AI Fitness Intelligence:** optional insights based on data the user explicitly authorizes.
- **Profiles:** future public/private accounts with per-content visibility controls.

## Principles

- Local-first and self-hosted by default.
- Private fitness data stays out of the public source repository.
- No external AI data sharing without explicit user consent.
- Clearly distinguish measured data, estimates, and visual approximations.
- Testable, accessible, maintainable software.
- Third-party assets and datasets require verified licences.

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
