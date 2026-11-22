export type FoodReference = {
  id: string;
  name: string;
  category: string;
  state: "Raw" | "Cooked" | "Ready to eat";
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  source: "USDA FoodData Central";
  sourceUrl: string;
  verification: "provisional";
  note?: string;
};

// Generic, unbranded reference foods. Values are per 100 g edible portion.
// These are provisional generic matches. Record-level FDC IDs and nutrient-by-nutrient verification are still pending.
// Do not present these values as laboratory-accurate or as verified matches for every food variant.
const USDA = "https://fdc.nal.usda.gov/food-search/";
export const foodReferences: FoodReference[] = [
  { id:"rice-white-cooked", name:"White rice, long-grain", category:"Grains", state:"Cooked", kcal:130, protein:2.69, carbs:28.17, fat:0.28, fibre:0.4, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=white+rice+cooked", note:"Cooked, plain; water absorption changes weight." },
  { id:"rice-white-raw", name:"White rice, long-grain", category:"Grains", state:"Raw", kcal:365, protein:7.13, carbs:79.95, fat:0.66, fibre:1.3, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=white+rice+raw", note:"Dry uncooked grain." },
  { id:"oats-dry", name:"Oats, rolled, dry", category:"Grains", state:"Raw", kcal:379, protein:13.15, carbs:67.7, fat:6.52, fibre:10.1, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=rolled+oats+dry" },
  { id:"whole-wheat-flour", name:"Whole-wheat flour", category:"Grains", state:"Raw", kcal:340, protein:13.2, carbs:72.0, fat:2.5, fibre:10.7, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=whole+wheat+flour" },
  { id:"egg-whole", name:"Egg, whole", category:"Protein", state:"Raw", kcal:143, protein:12.56, carbs:0.72, fat:9.51, fibre:0, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=egg+whole+raw", note:"Raw edible portion; cooking method adds no macros unless fat is used." },
  { id:"chicken-breast-roasted", name:"Chicken breast, skinless", category:"Protein", state:"Cooked", kcal:165, protein:31.02, carbs:0, fat:3.57, fibre:0, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=chicken+breast+meat+only+cooked+roasted", note:"Roasted, meat only; not fried or marinated." },
  { id:"milk-whole", name:"Cow's milk, whole", category:"Dairy", state:"Ready to eat", kcal:61, protein:3.15, carbs:4.8, fat:3.25, fibre:0, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=whole+milk" },
  { id:"yogurt-plain", name:"Yogurt, plain, whole milk", category:"Dairy", state:"Ready to eat", kcal:61, protein:3.47, carbs:4.66, fat:3.25, fibre:0, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=plain+whole+milk+yogurt" },
  { id:"banana", name:"Banana", category:"Fruit", state:"Ready to eat", kcal:89, protein:1.09, carbs:22.84, fat:0.33, fibre:2.6, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=banana+raw" },
  { id:"apple", name:"Apple, with skin", category:"Fruit", state:"Ready to eat", kcal:52, protein:0.26, carbs:13.81, fat:0.17, fibre:2.4, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=apple+with+skin+raw" },
  { id:"potato-boiled", name:"Potato, boiled", category:"Vegetables", state:"Cooked", kcal:87, protein:1.87, carbs:20.13, fat:0.1, fibre:1.8, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=potato+boiled" },
  { id:"lentils-cooked", name:"Lentils, cooked", category:"Pulses", state:"Cooked", kcal:116, protein:9.02, carbs:20.13, fat:0.38, fibre:7.9, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=lentils+cooked" },
  { id:"chickpeas-cooked", name:"Chickpeas, cooked", category:"Pulses", state:"Cooked", kcal:164, protein:8.86, carbs:27.42, fat:2.59, fibre:7.6, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=chickpeas+cooked" },
  { id:"almonds", name:"Almonds", category:"Nuts & seeds", state:"Ready to eat", kcal:579, protein:21.15, carbs:21.55, fat:49.93, fibre:12.5, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=almonds" },
  { id:"peanuts", name:"Peanuts, dry roasted", category:"Nuts & seeds", state:"Ready to eat", kcal:587, protein:24.35, carbs:21.26, fat:49.66, fibre:8.4, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=peanuts+dry+roasted" },
  { id:"tofu-firm", name:"Tofu, firm", category:"Protein", state:"Ready to eat", kcal:144, protein:17.27, carbs:2.78, fat:8.72, fibre:2.3, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=firm+tofu" },
  { id:"broccoli-boiled", name:"Broccoli, boiled", category:"Vegetables", state:"Cooked", kcal:35, protein:2.38, carbs:7.18, fat:0.41, fibre:3.3, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=broccoli+boiled" },
  { id:"oil-olive", name:"Olive oil", category:"Oils", state:"Ready to eat", kcal:884, protein:0, carbs:0, fat:100, fibre:0, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=olive+oil", note:"Weigh or measure carefully; oil contributes substantial energy." },
  { id:"sugar", name:"Table sugar", category:"Other", state:"Ready to eat", kcal:387, protein:0, carbs:100, fat:0, fibre:0, source:"USDA FoodData Central", verification:"provisional", sourceUrl:USDA+"?query=granulated+sugar" }
];
