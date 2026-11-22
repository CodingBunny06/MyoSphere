# Initial Data Model

Conceptual model for discussion; not a final schema.

## Entities

- UserProfile: local profile settings and preferences.
- BodyMeasurement: measurement type, value, unit, timestamp, and source.
- Exercise: name, instructions, equipment, movement category, and muscle-group references.
- WorkoutTemplate: reusable workout structure.
- WorkoutSession: date, duration, notes, and completion state.
- SetRecord: exercise, sequence, repetitions, load, and optional effort rating.
- FoodItem: source, name, serving unit, nutrient values, and attribution metadata.
- Recipe: ingredients and serving yield.
- MealEntry: food or recipe, quantity, meal time, and nutrient snapshot.
- HydrationEntry: amount and timestamp.
- PersonalRecord: exercise, metric, value, date, and calculation method.
- ProgressCheckIn: date, optional notes, weight, measurement references, and user-selected tags.
- ProgressPhoto: private file reference, date, pose/orientation, optional check-in reference, and metadata policy.

## Principles

- Store units explicitly and normalize values consistently.
- Preserve source and timestamp for user measurements.
- Distinguish user-entered, imported, calculated, and estimated values.
- Avoid storing unnecessary personal information.
- Use synthetic sample records in the repository.
- Plan data export and deletion from the beginning.
- Do not assume body measurements reveal underlying anatomical structure.

## Progress photo storage

Photo binaries must be stored outside the repository in the local application data directory. Store only opaque file references and metadata in SQLite. Do not store image bytes in the database by default. Enforce file-type and size validation, use generated filenames rather than user-provided paths, and prevent path traversal. Photos remain private and local; no remote upload or public sharing in the initial release.

## Persistence

SQLite is the initial target. Schema migrations must be versioned. Database files and real user records must never be committed.
