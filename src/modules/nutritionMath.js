export function scalePer100g(values, grams) {
  if (!Number.isFinite(grams) || grams <= 0 || grams > 5000) {
    throw new RangeError("Grams must be greater than 0 and no more than 5000.");
  }
  const factor = grams / 100;
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      if (!Number.isFinite(value) || value < 0) {
        throw new RangeError(`Nutrient "${key}" must be a finite non-negative number.`);
      }
      return [key, Number((value * factor).toFixed(key === "calories" ? 0 : 1))];
    }),
  );
}

export function sumEntriesForDate(entries, date) {
  return entries.filter((entry) => entry.date === date).reduce(
    (sum, entry) => ({
      calories: sum.calories + entry.calories,
      protein: sum.protein + entry.protein,
      carbs: sum.carbs + entry.carbs,
      fat: sum.fat + entry.fat,
      fibre: sum.fibre + (entry.fibre ?? 0),
      fibreUnknown: sum.fibreUnknown + (entry.fibre == null ? 1 : 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, fibreUnknown: 0 },
  );
}

export function migrateLegacyEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.filter((item) =>
    item && typeof item.id === "string" && typeof item.date === "string" &&
    typeof item.food === "string" &&
    ["calories", "protein", "carbs", "fat"].every((key) =>
      Number.isFinite(item[key]) && item[key] >= 0
    )
  ).map((item) => ({
    ...item,
    meal: "Meal",
    grams: 0,
    fibre: null,
    source: "Legacy manual entry",
    sourceUrl: "",
    note: "Original manually entered values preserved; serving weight and source were not recorded.",
  }));
}
