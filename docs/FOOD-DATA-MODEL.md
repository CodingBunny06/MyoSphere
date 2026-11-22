# Food data model and normalization rules

This document describes the normalized record contract implemented in `src/modules/foodDataModel.ts`. It is an importer foundation, not a claim that the full external catalogue is already imported.

## Record identity and provenance

USDA records use a source-qualified identifier: `usda:fdc:<FDC_ID>`. Keep the FDC identifier, source data type, record publication date, retrieval timestamp and source URL with every normalized food. Do not use a food name as a stable identifier.

## Nutrient mapping

The current normalizer maps FoodData Central nutrient IDs:

| Nutrient | FDC nutrient ID | Stored unit |
|---|---:|---|
| Energy | 1008 | kcal |
| Energy fallback | 1062 | kJ, converted to kcal |
| Protein | 1003 | g |
| Carbohydrate, by difference | 1005 | g |
| Total lipid (fat) | 1004 | g |
| Fibre, total dietary | 1079 | g |

Energy uses the kcal field when present. The kJ fallback divides by 4.184. Do not add the two energy fields together.

## Basis and quality

- Foundation Foods and SR Legacy records are tagged `analytical` and use a per-100 g basis.
- FNDDS and other non-branded survey/reference records are tagged `reference-derived`; the current normalizer retains their per-100 g nutrient basis.
- Branded Foods are tagged `label-derived`; the FDC nutrient amounts are standardized to a per-100 g basis. The serving-size metadata is retained separately and can support a serving display.
- Missing nutrient values remain `null`. They must never be silently converted to zero.
- Scaling is allowed only for records explicitly marked `per-100g`. The helper returns `null` for unknown or per-serving bases until serving-size conversion is deliberately implemented.

The data type classification is intentionally conservative. Before publishing a batch, inspect the original FDC record and confirm that the source type and nutrient basis are appropriate for the food being represented.

## Current scope and limitations

- The module normalizes a supplied FDC food-detail payload; it does not call the USDA API, download datasets, or import a catalogue.
- It does not infer a match from a food name.
- It does not yet calculate a branded product's label serving amount from its serving-size metadata; nutrient values themselves remain per 100 g.
- It does not combine recipe ingredients or estimate cooked yields.
- Alternate names, Indian language names, cuisine tags and portions remain future catalogue metadata.
- Existing 19 starter foods remain provisional until matched to exact FDC records and checked nutrient-by-nutrient.

## Required next validation

Before importing a batch, add fixtures from real FDC responses for Foundation Foods, FNDDS and Branded Foods, then test nutrient IDs, missing nutrients, kcal/kJ fallback, basis preservation and source metadata. The batch importer should retain the original source payload or a reproducible source snapshot alongside its generated output.
