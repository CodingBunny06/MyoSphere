/**
 * Source-aware FoodData Central normalization.
 *
 * This module intentionally preserves unknown nutrients as null and retains
 * record-level provenance. It does not guess a food match or convert branded
 * serving values into per-100 g values without an explicit serving size.
 */

export type FoodSourceQuality =
  | "analytical"
  | "label-derived"
  | "community-reported"
  | "recipe-calculated"
  | "user-entered"
  | "provisional"
  | "reference-derived";

export type NutrientBasis = "per-100g" | "per-serving" | "unknown";

export type NormalizedNutrients = {
  energyKcal: number | null;
  proteinG: number | null;
  carbohydrateG: number | null;
  fatG: number | null;
  fibreG: number | null;
};

export type SourceProvenance = {
  provider: "USDA FoodData Central" | "Open Food Facts" | "MyoSphere";
  sourceRecordId: string;
  sourceDataType?: string;
  sourcePublicationDate?: string;
  retrievedAt: string;
  sourceUrl: string;
  quality: FoodSourceQuality;
};

export type NormalizedFoodRecord = {
  id: string;
  name: string;
  basis: NutrientBasis;
  nutrients: NormalizedNutrients;
  provenance: SourceProvenance;
};

type FdcNutrient = {
  nutrient?: { id?: number; number?: string; name?: string; unitName?: string };
  nutrientId?: number;
  nutrientNumber?: string;
  name?: string;
  unitName?: string;
  amount?: number;
  value?: number;
};

export type FdcFoodPayload = {
  fdcId: number | string;
  description: string;
  dataType?: string;
  publicationDate?: string;
  foodNutrients?: FdcNutrient[];
  servingSize?: number;
  servingSizeUnit?: string;
};

const FDC_NUTRIENT_IDS = {
  energyKcal: 1008,
  energyKj: 1062,
  proteinG: 1003,
  carbohydrateG: 1005,
  fatG: 1004,
  fibreG: 1079,
} as const;

function nutrientId(item: FdcNutrient): number | null {
  const id = item.nutrient?.id ?? item.nutrientId;
  return typeof id === "number" ? id : null;
}

function nutrientAmount(item: FdcNutrient): number | null {
  const amount = item.amount ?? item.value;
  return typeof amount === "number" && Number.isFinite(amount) ? amount : null;
}

function findNutrient(items: FdcNutrient[], id: number): number | null {
  const match = items.find((item) => nutrientId(item) === id);
  return match ? nutrientAmount(match) : null;
}

/**
 * Normalize a USDA FDC food-detail payload.
 * Foundation/FNDDS/SR nutrient amounts are retained on their documented
 * 100 g basis. Branded Foods are kept on their label serving basis.
 */
export function normalizeFdcFood(
  payload: FdcFoodPayload,
  retrievedAt: string,
): NormalizedFoodRecord {
  const nutrients = payload.foodNutrients ?? [];
  const dataType = payload.dataType ?? "Unknown";
  const normalizedType = dataType.toLowerCase();
  const isBranded = normalizedType.includes("branded");
  const quality: FoodSourceQuality = isBranded
    ? "label-derived"
    : normalizedType.includes("foundation") || normalizedType.includes("sr legacy")
      ? "analytical"
      : "reference-derived";
  const kcal = findNutrient(nutrients, FDC_NUTRIENT_IDS.energyKcal);
  const kj = findNutrient(nutrients, FDC_NUTRIENT_IDS.energyKj);

  return {
    id: `usda:fdc:${payload.fdcId}`,
    name: payload.description.trim(),
    basis: isBranded ? "per-serving" : payload.dataType ? "per-100g" : "unknown",
    nutrients: {
      energyKcal: kcal ?? (kj === null ? null : Number((kj / 4.184).toFixed(2))),
      proteinG: findNutrient(nutrients, FDC_NUTRIENT_IDS.proteinG),
      carbohydrateG: findNutrient(nutrients, FDC_NUTRIENT_IDS.carbohydrateG),
      fatG: findNutrient(nutrients, FDC_NUTRIENT_IDS.fatG),
      fibreG: findNutrient(nutrients, FDC_NUTRIENT_IDS.fibreG),
    },
    provenance: {
      provider: "USDA FoodData Central",
      sourceRecordId: String(payload.fdcId),
      sourceDataType: dataType,
      sourcePublicationDate: payload.publicationDate,
      retrievedAt,
      sourceUrl: `https://fdc.nal.usda.gov/food-details/${payload.fdcId}/nutrients`,
      quality,
    },
  };
}

/** Scale nutrients only when the record's basis is known. */
export function scaleFoodNutrients(
  nutrients: NormalizedNutrients,
  grams: number,
  basis: NutrientBasis,
): NormalizedNutrients | null {
  if (!Number.isFinite(grams) || grams <= 0 || basis !== "per-100g") return null;
  const factor = grams / 100;
  const scale = (value: number | null) =>
    value === null ? null : Number((value * factor).toFixed(2));
  return {
    energyKcal: scale(nutrients.energyKcal),
    proteinG: scale(nutrients.proteinG),
    carbohydrateG: scale(nutrients.carbohydrateG),
    fatG: scale(nutrients.fatG),
    fibreG: scale(nutrients.fibreG),
  };
}
