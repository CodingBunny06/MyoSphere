import test from "node:test";
import assert from "node:assert/strict";
import {
  sessionVolume,
  countSessionsInRange,
  estimateOneRepMax,
  getPersonalRecords,
  getExerciseProgression,
  getWeekBounds,
} from "../src/modules/trainingMath.mjs";

const sessions = [
  { id: "a", date: "2026-11-23", name: "Push", exercises: [{ name: "Bench press", sets: [
    { id: "1", reps: 10, load: 60 }, { id: "2", reps: 8, load: 65 },
  ] }] },
  { id: "b", date: "2026-11-25", name: "Push", exercises: [{ name: "Bench press", sets: [
    { id: "3", reps: 6, load: 70 }, { id: "4", reps: 12, load: 50 },
  ] }] },
  { id: "c", date: "2026-11-16", name: "Pull", exercises: [{ name: "Row", sets: [
    { id: "5", reps: 10, load: 40 },
  ] }] },
];

test("session volume sums reps multiplied by load across all exercises", () => {
  assert.equal(sessionVolume(sessions[0]), 1120);
  assert.equal(sessionVolume({ exercises: [] }), 0);
});

test("weekly session count includes both date boundaries", () => {
  assert.equal(countSessionsInRange(sessions, "2026-11-23", "2026-11-29"), 2);
  assert.equal(countSessionsInRange(sessions, "2026-11-24", "2026-11-24"), 0);
});

test("Epley estimate is limited to positive loads and 1–10 reps", () => {
  assert.equal(estimateOneRepMax(60, 10), 80);
  assert.equal(estimateOneRepMax(70, 6), 84);
  assert.equal(estimateOneRepMax(50, 12), null);
  assert.equal(estimateOneRepMax(0, 5), null);
});

test("personal records track heaviest load, most reps and estimated 1RM", () => {
  const [bench, row] = getPersonalRecords(sessions);
  assert.equal(bench.exercise, "Bench press");
  assert.equal(bench.heaviestLoad, 70);
  assert.equal(bench.mostReps, 12);
  assert.equal(bench.estimatedOneRepMax, 84);
  assert.equal(row.exercise, "Row");
});

test("exercise progression returns chronological per-session best load and volume", () => {
  const points = getExerciseProgression(sessions, "Bench press");
  assert.deepEqual(points.map((point) => point.date), ["2026-11-23", "2026-11-25"]);
  assert.equal(points[0].bestLoad, 65);
  assert.equal(points[1].volume, 1020);
  assert.equal(getExerciseProgression(sessions, "Missing").length, 0);
});

test("week bounds use Monday through Sunday in local calendar time", () => {
  assert.deepEqual(getWeekBounds(new Date(2026, 10, 25)), { start: "2026-11-23", end: "2026-11-29" });
});
