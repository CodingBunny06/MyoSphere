# Contributing to MyoSphere

Thanks for your interest in contributing.

## Current stage

MyoSphere is in Stage 0. Large feature implementations should wait until the architecture and first technical prototype are validated.

## Workflow

1. Open or find an issue before substantial work.
2. Describe the proposed change and its scope.
3. Create a focused branch.
4. Keep changes small and testable.
5. Run relevant checks.
6. Update documentation where needed.
7. Open a pull request with context and testing notes.

## Engineering expectations

- Prefer maintainable solutions over unnecessary dependencies.
- Validate data at application boundaries.
- Keep domain logic independent from UI details.
- Add tests for new behaviour and bug fixes.
- Consider performance, especially for 3D assets.
- Do not introduce telemetry or external data transfer without explicit review.

## Privacy and security

Never commit personal data, databases, exports, credentials, tokens, or private photographs. Use synthetic fixtures.

## Third-party materials

Do not add 3D models, animations, exercise media, fonts, images, or datasets unless their licences and redistribution conditions are verified and documented.

## Pull request checklist

- [ ] Scope is focused and linked to an issue where appropriate.
- [ ] Tests added or updated.
- [ ] Documentation updated.
- [ ] No secrets or personal data included.
- [ ] Third-party licences checked.
- [ ] Accessibility and performance considered.
