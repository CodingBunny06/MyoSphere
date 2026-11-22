export type OpenFoodProduct = {
  barcode: string;
  name: string;
  brand: string;
  quantity: string;
  servingSize: string;
  imageUrl: string;
  kcalPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  fibrePer100g: number | null;
  allergens: string;
  sourceUrl: string;
  completeness: number | null;
};

type OffResponse = {
  status?: number;
  status_verbose?: string;
  product?: {
    product_name?: string;
    brands?: string;
    quantity?: string;
    serving_size?: string;
    image_front_url?: string;
    image_url?: string;
    allergens?: string;
    completeness?: number;
    nutriments?: Record<string, unknown>;
  };
};

function numeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function nutrient(nutrients: Record<string, unknown>, key: string): number | null {
  return numeric(nutrients[key]);
}

/** Read-only barcode lookup. Product data is community-contributed and may be incomplete. */
export async function lookupOpenFoodFacts(barcodeInput: string): Promise<OpenFoodProduct> {
  const barcode = barcodeInput.replace(/[\s-]/g, "");
  if (!/^\d{8,14}$/.test(barcode)) throw new Error("Enter a valid 8–14 digit barcode.");
  const fields = "code,product_name,brands,quantity,serving_size,image_front_url,image_url,allergens,completeness,nutriments";
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${fields}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Product lookup failed (HTTP ${response.status}). Try again or enter the food manually.`);
  const data = await response.json() as OffResponse;
  if (data.status !== 1 || !data.product) throw new Error("Product not found in Open Food Facts. You can add it manually instead.");
  const p = data.product;
  const n = p.nutriments ?? {};
  // Only accept per-100 g energy fields. A generic "_value" may describe a
  // serving and must not be silently treated as a per-100 g amount.
  let kcal = nutrient(n, "energy-kcal_100g");
  if (kcal === null) {
    const kj = nutrient(n, "energy-kj_100g") ?? nutrient(n, "energy_100g");
    kcal = kj === null ? null : Number((kj / 4.184).toFixed(1));
  }
  return {
    barcode,
    name: p.product_name?.trim() || "Unnamed packaged food",
    brand: p.brands?.trim() || "Brand not listed",
    quantity: p.quantity || "",
    servingSize: p.serving_size || "",
    imageUrl: p.image_front_url || p.image_url || "",
    kcalPer100g: kcal,
    proteinPer100g: nutrient(n, "proteins_100g"),
    carbsPer100g: nutrient(n, "carbohydrates_100g"),
    fatPer100g: nutrient(n, "fat_100g"),
    fibrePer100g: nutrient(n, "fiber_100g") ?? nutrient(n, "fibre_100g"),
    allergens: p.allergens || "",
    completeness: numeric(p.completeness),
    sourceUrl: `https://world.openfoodfacts.org/product/${barcode}`,
  };
}
