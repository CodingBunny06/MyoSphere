import { useMemo, useState, type FormEvent } from "react";
import { foodReferences, type FoodReference } from "./foodReferences";
import { migrateLegacyEntries, scalePer100g, sumEntriesForDate } from "./nutritionMath.js";

type MealEntry = { id:string; date:string; meal?:string; food:string; grams:number; calories:number; protein:number; carbs:number; fat:number; fibre:number|null; source:string; sourceUrl:string; note?:string };
const STORE="myosphere-nutrition-v2";
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
function readMeals():MealEntry[]{
 try{
  const current=localStorage.getItem(STORE);
  if(current)return JSON.parse(current) as MealEntry[];
  const legacy=JSON.parse(localStorage.getItem("myosphere-nutrition-v1")??"[]") as Array<{id:string;date:string;food:string;calories:number;protein:number;carbs:number;fat:number}>;
  const migrated=migrateLegacyEntries(legacy);
  if(migrated.length)localStorage.setItem(STORE,JSON.stringify(migrated));
  return migrated;
 }catch{return[]}
}
function rounded(value:number,digits=1){return Number(value.toFixed(digits))}
function FoodCard({food,onSelect}:{food:FoodReference;onSelect:(food:FoodReference)=>void}){
 return <article className="food-reference-card"><div><span>{food.category.toUpperCase()} · {food.state.toUpperCase()} · PROVISIONAL REFERENCE</span><strong>{food.name}</strong><small>{food.kcal} kcal · P {food.protein}g · C {food.carbs}g · F {food.fat}g per 100g</small></div><button type="button" onClick={()=>onSelect(food)}>Add ↗</button></article>;
}
export function NutritionPage(){
 const [entries,setEntries]=useState<MealEntry[]>(readMeals);
 const [date,setDate]=useState(today);
 const [query,setQuery]=useState("");
 const [category,setCategory]=useState("All");
 const [selected,setSelected]=useState<FoodReference|null>(null);
 const [grams,setGrams]=useState("100");
 const [meal,setMeal]=useState("Meal");
 const [notice,setNotice]=useState("");
 const [customName,setCustomName]=useState("");
 const [customKcal,setCustomKcal]=useState("");
 const [customProtein,setCustomProtein]=useState("");
 const [customCarbs,setCustomCarbs]=useState("");
 const [customFat,setCustomFat]=useState("");
 const [customGrams,setCustomGrams]=useState("100");
 const [showCustom,setShowCustom]=useState(false);
 const daily=useMemo(()=>sumEntriesForDate(entries,date),[entries,date]);
 const filtered=foodReferences.filter(f=>(category==="All"||f.category===category)&&f.name.toLowerCase().includes(query.toLowerCase()));
 const save=(entry:MealEntry)=>{const next=[entry,...entries];setEntries(next);localStorage.setItem(STORE,JSON.stringify(next));setNotice("Added to your food diary.");};
 const addReference=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(!selected)return;const amount=Number(grams);if(!Number.isFinite(amount)||amount<=0||amount>5000)return;const scaled=scalePer100g({calories:selected.kcal,protein:selected.protein,carbs:selected.carbs,fat:selected.fat,fibre:selected.fibre},amount);save({id:crypto.randomUUID(),date,meal,food:selected.name,grams:amount,...scaled,source:selected.source,sourceUrl:selected.sourceUrl,note:selected.note});setSelected(null);setGrams("100");};
 const addCustom=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const vals=[customKcal,customProtein,customCarbs,customFat,customGrams].map(Number);if(!customName.trim()||vals.some(v=>!Number.isFinite(v)||v<0)||vals[4]<=0||vals[4]>5000)return;const [k,p,c,f,g]=vals;const scaled=scalePer100g({calories:k,protein:p,carbs:c,fat:f,fibre:null},g);save({id:crypto.randomUUID(),date,meal,food:customName.trim(),grams:g,...scaled,source:"User-entered label / recipe",sourceUrl:"",note:"User-entered values per 100 g."});setCustomName("");setNotice("Custom food added. Values are user-provided estimates.");};
 const remove=(id:string)=>{const next=entries.filter(e=>e.id!==id);setEntries(next);localStorage.setItem(STORE,JSON.stringify(next));};
 return <section className="module-page">
  <div className="module-heading"><span className="eyebrow">MYOSPHERE / NUTRITION HUB</span><h1>Fuel your <em>progress.</em></h1><p>Search reference foods, set the amount you actually ate and track daily macros.</p></div>
  <div className="module-date-control"><label htmlFor="nutrition-date">DAY</label><input id="nutrition-date" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
  <div className="nutrition-summary">
   <article className="nutrition-calories"><span>DAILY ENERGY</span><strong>{Math.round(daily.calories).toLocaleString()} <small>kcal</small></strong><p>Logged for {date}</p></article>
   <article><span>PROTEIN</span><strong>{rounded(daily.protein)} <small>g</small></strong><div className="macro-track"><i style={{width:`${Math.min(daily.protein,200)/2}%`}}/></div></article>
   <article><span>CARBS</span><strong>{rounded(daily.carbs)} <small>g</small></strong><div className="macro-track carbs"><i style={{width:`${Math.min(daily.carbs,300)/3}%`}}/></div></article>
   <article><span>FAT</span><strong>{rounded(daily.fat)} <small>g</small></strong><div className="macro-track fat"><i style={{width:`${Math.min(daily.fat,120)/1.2}%`}}/></div></article>
  </div>
  <div className="nutrition-fibre-strip"><span>DIETARY FIBRE</span><strong>{daily.fibreUnknown>0?"≥ ":""}{rounded(daily.fibre)} g</strong><span>Known fibre subtotal{daily.fibreUnknown>0?` · ${daily.fibreUnknown} entr${daily.fibreUnknown===1?"y has":"ies have"} no fibre value`:""}; unavailable values are not treated as zero.</span></div>
  <section className="module-panel food-database-panel">
   <div className="module-panel-title"><div><span className="eyebrow">REFERENCE FOOD DATABASE</span><h2>Find a food</h2></div><span className="module-count">{filtered.length} matches</span></div>
   <input className="food-search" aria-label="Search foods" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search rice, oats, egg, chicken, banana…"/>
   <div className="exercise-filters">{["All","Grains","Protein","Dairy","Pulses","Fruit","Vegetables","Nuts & seeds","Oils","Other"].map(c=><button type="button" key={c} className={category===c?"exercise-filter active":"exercise-filter"} onClick={()=>setCategory(c)}>{c}</button>)}</div>
   <div className="food-reference-list">{filtered.map(f=><FoodCard key={f.id} food={f} onSelect={setSelected}/>)}</div>
   {selected&&<form className="food-portion-form" onSubmit={addReference}>
    <div><span className="eyebrow">ADD TO DIARY</span><h3>{selected.name}</h3><p>{selected.kcal} kcal per 100 g · {selected.state.toLowerCase()}</p></div>
    <label>Amount eaten (g)<input type="number" min="1" max="5000" step="1" value={grams} onChange={e=>setGrams(e.target.value)} required/></label>
    <label>Meal<select value={meal} onChange={e=>setMeal(e.target.value)}><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option><option>Meal</option></select></label>
    <button className="module-submit">Add food <span>↗</span></button>
    <p className="food-source-note">Source family: {selected.source}. Exact source-record matching and nutrient verification are still pending. {selected.note??"Generic unbranded food reference."} Values are provisional and scaled from a 100 g edible portion; preparation and brands can differ.</p>
   </form>}
  </section>
  <section className="module-panel custom-food-panel">
   <button type="button" className="custom-food-toggle" onClick={()=>setShowCustom(v=>!v)}>{showCustom?"− Hide custom food entry":"+ Add a custom food / recipe"} <span>For labels and homemade dishes</span></button>
   {showCustom&&<form className="custom-food-form" onSubmit={addCustom}>
    <p>Enter nutrition per 100 g from a package label or your weighed recipe. These values are not verified by the reference database.</p>
    <label>Food / recipe name<input value={customName} onChange={e=>setCustomName(e.target.value)} required maxLength={80} placeholder="e.g. homemade paneer bhurji"/></label>
    <div className="module-input-row"><label>Calories / 100 g<input type="number" min="0" step=".1" value={customKcal} onChange={e=>setCustomKcal(e.target.value)} required/></label><label>Protein (g)<input type="number" min="0" step=".1" value={customProtein} onChange={e=>setCustomProtein(e.target.value)} required/></label><label>Carbs (g)<input type="number" min="0" step=".1" value={customCarbs} onChange={e=>setCustomCarbs(e.target.value)} required/></label><label>Fat (g)<input type="number" min="0" step=".1" value={customFat} onChange={e=>setCustomFat(e.target.value)} required/></label><label>Amount eaten (g)<input type="number" min="1" max="5000" value={customGrams} onChange={e=>setCustomGrams(e.target.value)} required/></label></div>
    <button className="module-submit">Save custom food</button>
   </form>}
  </section>
  <section className="module-panel module-history">
   <div className="module-panel-title"><div><span className="eyebrow">FOOD DIARY</span><h2>Entries for {date}</h2></div><span className="module-count">{entries.filter(e=>e.date===date).length} items</span></div>
   {entries.some(e=>e.date===date)?<div className="module-entry-list">{entries.filter(e=>e.date===date).map(e=><article className="module-entry" key={e.id}><div><strong>{e.food}{e.grams ? ` · ${e.grams} g` : ""}</strong><small>{e.meal ? `${e.meal} · ` : ""}{e.protein}g protein · {e.carbs}g carbs · {e.fat}g fat · {e.source}</small></div><b>{e.calories} kcal</b><button aria-label={`Delete ${e.food} entry`} onClick={()=>remove(e.id)}>×</button></article>)}</div>:<div className="module-empty"><span>◒</span><strong>No food entries for this day.</strong><p>Choose a food from the reference database to start.</p></div>}
  </section>
  {notice&&<p className="photo-feedback success" role="status">{notice}</p>}
  <p className="module-privacy">Food reference values are provisional generic per-100 g estimates associated with USDA FoodData Central search references; exact record IDs and nutrient-by-nutrient verification are pending. Do not treat them as exact. Branded labels and weighed ingredients are preferable for mixed dishes. Older manual diary entries are migrated from the previous local diary version when the new diary is first opened.</p>
 </section>;
}
