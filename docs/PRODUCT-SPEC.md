# MyoSphere Product Specification

## Vision

Build an open-source, self-hosted fitness platform that unifies training, nutrition, body progress, interactive exercise education, and optional AI insights.

## Intended users

- Initial: one individual using a private local instance.
- Later: self-hosters and an open-source contributor community.
- Multi-user hosted service is outside the initial release scope.

## Core modules

### Workout Hub
Exercise catalogue, workout routines, sets, reps, loads, rest periods, training history, personal records, progression, and muscle-group volume summaries.

### Nutrition Hub
Food search, custom foods and recipes, meal logging, serving sizes, calories, macronutrients, selected micronutrients, fibre, and hydration. External food data must retain required attribution and comply with dataset and image licences.

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

## Initial non-goals

- Public multi-tenant hosting.
- Social network or public user profiles.
- Medical diagnosis or treatment.
- Automatic cloud synchronisation.
- Sending personal data to external AI services by default.
- High-detail real-time anatomical simulation before a performance prototype.
