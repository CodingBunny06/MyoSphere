import test from "node:test";
import assert from "node:assert/strict";
import { migrateLegacyEntries, scalePer100g, sumEntriesForDate } from "../src/modules/nutritionMath.js";

test("scales reference nutrients from 100 g to a weighed portion", () => {
  assert.deepEqual(
    scalePer100g({ calories: 130, protein: 2.69, carbs: 28.17, fat: 0.28, fibre: 0.4 }, 150),
    { calories: 195, protein: 4, carbs: 42.3, fat: 0.4, fibre: 0.6 },
  );
});

test("rejects invalid portion weights and invalid nutrient values", () => {
  for (const grams of [0, -1, 5001, Number.NaN, Infinity]) {
    assert.throws(() => scalePer100g({ calories: 100, protein: 1, carbs: 1, fat: 1, fibre: 1 }, grams), RangeError);
  }
  assert.throws(() => scalePer100g({ calories: -1, protein: 1, carbs: 1, fat: 1, fibre: 1 }, 100), RangeError);
});

test("sums only entries for the selected date and treats missing fibre as zero", () => {
  const entries = [
    { date: "2026-11-22", calories: 200, protein: 10, carbs: 20, fat: 5, fibre: 3 },
    { date: "2026-11-22", calories: 100, protein: 4, carbs: 12, fat: 2 },
    { date: "2026-11-21", calories: 900, protein: 50, carbs: 80, fat: 30, fibre: 9 },
  ];
  assert.deepEqual(sumEntriesForDate(entries, "2026-11-22"), {
    calories: 300, protein: 14, carbs: 32, fat: 7, fibre: 3,
  });
});

test("migrates valid legacy entries without fabricating serving weight or source", () => {
  const migrated = migrateLegacyEntries([
    { id: "old-1", date: "2026-11-22", food: "Manual lunch", calories: 500, protein: 20, carbs: 60, fat: 15 },
    { id: "bad", date: "2026-11-22", food: "Broken", calories: -5, protein: 0, carbs: 0, fat: 0 },
  ]);
  assert.equal(migrated.length, 1);
  assert.equal(migrated[0].grams, 0);
  assert.equal(migrated[0].source, "Legacy manual entry");
  assert.equal(migrated[0].calories, 500);
});
