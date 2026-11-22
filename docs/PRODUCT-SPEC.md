# MyoSphere Product Specification

## Vision

Build an open-source, self-hosted fitness platform that unifies training, nutrition, body progress, interactive exercise education, and optional AI insights.

## Product identity and interface direction

MyoSphere should use familiar fitness-app interaction patterns while maintaining a distinct visual identity and information architecture. It may take broad usability inspiration from projects such as openGym and Planfit, but must not copy their branding, exact layouts, visual assets, illustrations, or proprietary content.

Design direction:
- Original MyoSphere visual language, navigation, typography, colour system, and component styling.
- Clear dashboard with modular cards and quick access to training, nutrition, body progress, and exercise learning.
- Mobile-first responsive layouts, with bottom navigation considered for the mobile app and a compact sidebar/top navigation for web.
- Consistent interaction patterns, accessible contrast, and uncluttered data visualisation.
- 3D anatomy and exercise studio should feel like signature MyoSphere experiences, not replicas of another product.

## Intended users

- Initial: one individual using a private local instance.
- Later: self-hosters and an open-source contributor community.
- Multi-user hosted service is outside the initial release scope.

## Core modules

### Workout Hub
Exercise catalogue, workout routines, sets, reps, loads, rest periods, training history, personal records, progression, and muscle-group volume summaries.

### Nutrition Hub
Food search, custom foods and recipes, meal logging, serving sizes, calories, macronutrients, selected micronutrients, fibre, and hydration. External food data must retain required attribution and comply with dataset and image licences.

### Body Progress and Photo Journal
A dedicated private progress area inspired by common fitness check-in workflows:
- Add dated progress photos (front, side, back, or custom pose).
- Group photos into a chronological progress timeline.
- Compare two selected dates with a side-by-side view and optional opacity overlay.
- Attach optional body measurements, weight, notes, and check-in tags.
- Let users edit, export, and permanently delete individual photos and check-ins.
- Photos are private by default. No public profile, community feed, sharing, or cloud upload in the initial release.
- Clearly explain local storage, backup behaviour, and any future sync or sharing controls before enabling them.

### 3D Anatomy
Interactive muscular anatomy with rotation, zoom, camera presets, muscle selection, and approximate progress views. A preset or measurement-based avatar is not a clinical anatomical reconstruction.

### Exercise Studio
Exercise-specific 3D animations with play, pause, replay, speed and camera controls, plus primary and secondary muscle explanations. Lightweight 2D demonstrations may remain as a fallback.

### AI Fitness Intelligence
Optional insights based only on data the user authorizes. No medical diagnosis, treatment claims, or claims to directly measure muscle activation or physiological recovery.

### Dashboard
A summary of logged training, nutrition, hydration, personal records, and clearly labelled estimates.

## Data honesty

- Label measured, user-entered, imported, estimated, and visualized values distinctly.
- Workout logs do not prove actual muscle size, muscle activation, or recovery state.
- Estimated calorie expenditure and recovery indicators must be labelled as estimates.
- Explain limitations of body visualisation and recommendations.

## Progress photo privacy requirements

Progress photographs are highly personal. In the initial self-hosted release:
- Store originals only in the user's local application data directory, never in the Git repository.
- Do not transmit photos to third-party services or AI providers.
- Do not generate public URLs or enable sharing by default.
- Provide explicit deletion and export controls.
- Warn users that ordinary local storage is not automatically encrypted; recommend full-disk encryption and encrypted backups.
- Strip unnecessary EXIF metadata from copies used for display/export where feasible, while preserving originals only if the user explicitly chooses.
- Do not infer health conditions or body composition from photographs.

## Initial non-goals

- Public multi-tenant hosting.
- Social network or public user profiles.
- Medical diagnosis or treatment.
- Automatic cloud synchronisation.
- Sending personal data to external AI services by default.
- High-detail real-time anatomical simulation before a performance prototype.
