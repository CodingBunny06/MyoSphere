# Security and Privacy Baseline

## Current deployment boundary

The initial application is intended for one local user on one machine. API services must bind to `127.0.0.1` by default. Do not expose the service on a network interface or deploy it publicly until remote-access security controls are implemented and reviewed.

## Data handling

Treat workout history, nutrition logs, body measurements, photos, and profile information as private personal data.

- Keep real records in local application storage, not the repository.
- Do not use real records in tests, fixtures, issue reports, or screenshots.
- Do not transmit data to AI or analytics providers without explicit informed consent.
- Provide export and deletion before a stable release.
- Document backup encryption and restore behaviour.

## Secrets

- Never commit API keys, tokens, passwords, private keys, or production environment files.
- Use local ignored environment files.
- Keep `.env.example` limited to non-secret placeholders.
- Rotate any credential that is accidentally exposed.

## Local machine

Use full-disk encryption where available and protect OS user access. SQLite files are not encrypted automatically; backups should be encrypted and stored securely.

## Remote deployment gate

Before remote or multi-user use, require authentication, secure session management, TLS, authorization checks, input validation, rate limiting, appropriate origin/CSRF controls, secure secret management, a threat model, and documented update, backup, recovery, and deletion procedures.

## Vulnerability reporting

Please do not publish exploitable security details in public issues. Until a private security contact is configured, contact the repository owner through GitHub's private contact mechanisms.

This is a baseline, not a security certification or guarantee. Do not use an early development build as a medical or production-grade record system.

## Future public/private profile requirements

Mandatory before multi-user profiles or social features launch:
- New accounts default to private.
- Public profile visibility does not override individual content privacy settings.
- Private profile content is visible only to approved followers, subject to blocks and content-level restrictions.
- Pending follow requests grant no access.
- Users can approve/decline requests, remove followers, block accounts, and change visibility.
- Enforce authorization server-side on every endpoint and media request; frontend-only restrictions are insufficient.
- Do not leak private content or relationships through search, counters, notifications, logs, caches, or errors.
- Provide a privacy preview and explain the consequences of changing visibility.
- Progress photos, body measurements, nutrition logs, and detailed workout records remain private unless explicitly shared.
