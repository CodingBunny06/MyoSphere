# Nutrition database expansion strategy

## Goal

Expand Nutrition Hub beyond the small provisional starter list to cover Indian, South Asian, continental and packaged foods without presenting unverified community entries as scientifically accurate.

## What MyFitnessPal actually uses

MyFitnessPal's current help documentation says its food database combines foods added by MyFitnessPal with foods submitted by members. Members can add, share and edit entries. Its checkmark indicates an entry reviewed or added by MyFitnessPal and considered complete/accurate by its process; the company does not guarantee every entry is error-free. MyFitnessPal's terms explicitly warn that user-generated nutrition data may not have been reviewed by qualified experts and prohibit scraping or using its content for another product.

MyoSphere must not scrape, copy, export or reproduce MyFitnessPal's database, member submissions, or proprietary content. The useful design lesson is breadth plus visible provenance—not copying its dataset.

## Approved source roles

### 1. USDA FoodData Central — generic ingredients and selected mixed dishes

- Licence: CC0 1.0 public domain.
- Use Foundation Foods for analytically derived commodity/minimally processed food values.
- Use FNDDS for foods and beverages reported in dietary surveys, including prepared/mixed-dish style entries and portion-weight context.
- Use Branded Foods for label-derived packaged product records.
- Use SR Legacy only as historical reference where a newer suitable record is unavailable.
- Store exact FDC ID, data type, description, nutrient IDs/units, data release/version, retrieval date and source URL for each imported record.
- Do not merge raw, cooked, drained, roasted, fried or reconstituted variants into one generic entry.

### 2. Open Food Facts — packaged products and barcode lookup

- Database licence: Open Database License (ODbL); individual contents use the Database Contents License; product images have separate terms.
- Suitable for branded packaged foods, including products sold in India and international markets, where records exist.
- Treat it as community-contributed label data, not laboratory-verified composition.
- Require a custom User-Agent, respect API rate limits, request only needed fields, and follow attribution/share-alike obligations.
- Prefer barcode/product lookup in the first integration. Current official docs recommend API v3 for product reads; full-text search is not available in v3 and the older keyword-search route is marked legacy/not recommended. Do not build a search-as-you-type integration against the legacy endpoint.
- Do not copy product images unless their separate licence is reviewed.

### 3. Indian Food Composition Tables 2017 (ICMR-NIN)

- This is a relevant Indian analytical reference for raw ingredients and regional foods.
- Its publication explicitly says electronic storage/reproduction for creating a product requires prior written permission from NIN.
- Do not import or bundle its tables until written permission is obtained. A citation alone does not grant this permission.

## Food coverage plan

Build a wider catalogue in verified batches:

1. **Indian staples and ingredients:** rice varieties, atta/whole-wheat flour, dals and pulses, millets, poha, rava/sooji, besan, dairy, paneer, eggs, fish, chicken, vegetables, fruits, nuts, oils and spices.
2. **Indian preparations:** idli, dosa, sambar, dal, khichdi, roti/chapati, paratha, poha, upma, rajma, chole, biryani, pulao, curries and common snacks. Prefer exact FDC prepared-food records when a true match exists. Otherwise model a recipe from weighed ingredients and cooking oil, with explicit recipe/portion assumptions; do not publish a generic dish value as universal.
3. **Continental and global foods:** breads, pasta, noodles, oats/cereals, soups, salads, sandwiches, pizza, sauces, baked foods, potatoes, meat/fish preparations and common desserts. Use FDC/FNDDS exact records where possible.
4. **Packaged foods:** Indian and international brands via Open Food Facts barcode lookup and/or USDA Branded Foods. Show brand, package serving, per-100-g values where supplied, barcode, source, and data-quality warnings.

## Data quality and UI requirements

Every imported food must retain:
- Stable source-qualified identifier (e.g. `usda:fdc:12345`, `off:890...`).
- Canonical food name, local/alternate names and language where available.
- Food category, cuisine/region tags, preparation state and edible portion basis.
- Energy and nutrient values with units and source nutrient IDs.
- Source, source record ID, source release/version, retrieval date and source link.
- Quality status: `analytical`, `label-derived`, `community-reported`, `recipe-calculated`, or `user-entered`.
- Portion/serving metadata and whether values are per 100 g, per serving or per package.

Search results must not imply that every result is equally reliable. Rank exact source-backed matches above approximate text matches. Display the quality/source badge beside each result. Missing fibre or micronutrients must remain unknown, not silently become a measured zero. For packaged foods, label-derived values can differ from laboratory composition and may be rounded by the manufacturer.

## Implementation sequence

- Keep the existing 19 starter records marked provisional until matched to exact source records and nutrient IDs.
- Add a source-aware normalized food model and importer/tests before growing the catalogue.
- Import a first verified USDA batch covering common ingredients and suitable FNDDS mixed dishes.
- Add Open Food Facts barcode lookup as a separate packaged-food source with clear community-data warnings.
- Add Indian prepared dishes from exact licensed records or transparent ingredient-based recipes.
- Seek written NIN permission before incorporating IFCT 2017 data.
- Keep imports reproducible and source notices in the repository; do not check in user diaries or personal nutrition data.

## Primary references

- MyFitnessPal food-data explanation: https://support.myfitnesspal.com/hc/en-us/articles/360032271252-Where-does-MyFitnessPal-get-its-food-data
- MyFitnessPal check-mark explanation: https://support.myfitnesspal.com/hc/en-us/articles/360032273292-Check-Marked-items
- MyFitnessPal Terms of Service: https://www.myfitnesspal.com/terms-of-service
- USDA FoodData Central data types: https://fdc.nal.usda.gov/data-documentation/
- USDA FoodData Central downloads: https://fdc.nal.usda.gov/download-datasets/
- USDA FoodData Central licensing: https://fdc.nal.usda.gov/
- Open Food Facts API and licence guidance: https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/
- Open Food Facts product API: https://openfoodfacts.github.io/openfoodfacts-server/api/
- ICMR-NIN Indian Food Composition Tables 2017: https://www.nin.res.in/ebooks/IFCT2017.pdf

## Implementation status

The first source-aware normalization layer now exists in `src/modules/foodDataModel.ts`, with its contract documented in [Food Data Model](FOOD-DATA-MODEL.md). It preserves source-qualified FDC IDs, source data type, publication date, retrieval timestamp, nutrient IDs and unknown values. It distinguishes analytical, reference-derived and label-derived records, and refuses to scale records unless their nutrient basis is explicitly per 100 g. This is importer infrastructure only: no new USDA catalogue batch has been imported, and the existing starter foods remain provisional.


## Barcode lookup implementation

The Nutrition Hub now has a camera barcode scanner (ZXing) and manual EAN/UPC entry. A scanned code is looked up read-only through the Open Food Facts product-by-barcode endpoint. The UI displays the product name, brand, package size, serving-size label, allergens when supplied, image, source record link, and per-100 g nutrition values when available.

Open Food Facts is community-contributed. Treat its values as label/community-derived rather than laboratory-verified. Missing core energy/macronutrient fields block one-tap diary insertion; users are directed to enter values from the package label instead of silently substituting zero. Missing fibre remains explicitly shown as unavailable in the lookup preview. The Open Food Facts database is ODbL-licensed; retain attribution and review share-alike obligations before distributing a combined database. Product images and other media may have separate terms.

The browser camera requires permission and a secure context (HTTPS or localhost). Manual barcode entry remains available when camera access is unsupported or denied. Product lookup is an online feature; the local diary itself remains browser-local.
