export type NutrientValues = { calories: number; protein: number; carbs: number; fat: number; fibre: number | null };
export function scalePer100g(values: NutrientValues, grams: number): NutrientValues;
export function sumEntriesForDate<T extends { date: string; calories: number; protein: number; carbs: number; fat: number; fibre?: number }>(entries: T[], date: string): NutrientValues;
export function migrateLegacyEntries<T extends { id: string; date: string; food: string; calories: number; protein: number; carbs: number; fat: number }>(entries: T[]): Array<T & { meal: string; grams: number; fibre: null; source: string; sourceUrl: string; note: string }>;
