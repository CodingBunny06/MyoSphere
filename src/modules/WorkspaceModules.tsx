import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import "./workspace-modules.css";
import { NutritionPage as NutritionPageView } from "./NutritionPage";
import ProgressPhotoJournal from "./ProgressPhotoJournal";

type TrainingEntry = { id: string; date: string; exercise: string; sets: number; reps: number; load: number };
type FoodEntry = { id: string; date: string; food: string; calories: number; protein: number; carbs: number; fat: number };
type ProgressEntry = { id: string; date: string; weight: number; note: string };

function readLocal<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function useLocalData<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readLocal(key, initial));
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}

const today = () => { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: ReactNode; description: string }) {
  return <div className="module-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>;
}

type RoutineDay = { day: string; focus: string; exercises: string[] };
const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const exerciseLibrary = [
  { name: "Barbell bench press", group: "Chest", equipment: "Barbell" },
  { name: "Incline dumbbell press", group: "Chest", equipment: "Dumbbells" },
  { name: "Cable fly", group: "Chest", equipment: "Cable" },
  { name: "Push-up", group: "Chest", equipment: "Bodyweight" },
  { name: "Lat pulldown", group: "Back", equipment: "Cable" },
  { name: "Seated cable row", group: "Back", equipment: "Cable" },
  { name: "One-arm dumbbell row", group: "Back", equipment: "Dumbbells" },
  { name: "Pull-up", group: "Back", equipment: "Bodyweight" },
  { name: "Overhead press", group: "Shoulders", equipment: "Barbell" },
  { name: "Lateral raise", group: "Shoulders", equipment: "Dumbbells" },
  { name: "Reverse fly", group: "Shoulders", equipment: "Dumbbells" },
  { name: "Barbell curl", group: "Arms", equipment: "Barbell" },
  { name: "Hammer curl", group: "Arms", equipment: "Dumbbells" },
  { name: "Triceps pushdown", group: "Arms", equipment: "Cable" },
  { name: "Overhead triceps extension", group: "Arms", equipment: "Cable" },
  { name: "Barbell squat", group: "Legs", equipment: "Barbell" },
  { name: "Romanian deadlift", group: "Legs", equipment: "Barbell" },
  { name: "Leg extension", group: "Legs", equipment: "Machine" },
  { name: "Leg curl", group: "Legs", equipment: "Machine" },
  { name: "Standing calf raise", group: "Legs", equipment: "Machine" },
  { name: "Plank", group: "Core", equipment: "Bodyweight" },
  { name: "Cable crunch", group: "Core", equipment: "Cable" },
];
const defaultRoutine = (): RoutineDay[] => weekDays.map((day) => ({ day, focus: "", exercises: [] }));

export function TrainingPage() {
  const [entries, setEntries] = useLocalData<TrainingEntry[]>("myosphere-training-v1", []);
  const [routine, setRoutine] = useLocalData<RoutineDay[]>("myosphere-routine-v1", defaultRoutine());
  const [date, setDate] = useState(today());
  const [exercise, setExercise] = useState(exerciseLibrary[0].name);
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [load, setLoad] = useState("0");
  const [activeDay, setActiveDay] = useState("Monday");
  const [focusDraft, setFocusDraft] = useState("");
  const [exerciseDraft, setExerciseDraft] = useState(exerciseLibrary[0].name);
  const [groupFilter, setGroupFilter] = useState("All");
  const totalVolume = useMemo(() => entries.reduce((sum, item) => sum + item.sets * item.reps * item.load, 0), [entries]);
  const currentDay = routine.find((item) => item.day === activeDay) ?? defaultRoutine()[0];
  const todayEntries = entries.filter((entry) => entry.date === date);
  const addEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!exercise.trim() || Number(sets) < 1 || Number(reps) < 1 || Number(load) < 0) return;
    setEntries((current) => [{ id: makeId(), date, exercise: exercise.trim(), sets: Number(sets), reps: Number(reps), load: Number(load) }, ...current]);
  };
  const saveFocus = () => setRoutine((current) => current.map((item) => item.day === activeDay ? { ...item, focus: focusDraft.trim() } : item));
  const addRoutineExercise = () => {
    if (!exerciseDraft) return;
    setRoutine((current) => current.map((item) => item.day === activeDay && !item.exercises.includes(exerciseDraft) ? { ...item, exercises: [...item.exercises, exerciseDraft] } : item));
  };
  const removeRoutineExercise = (name: string) => setRoutine((current) => current.map((item) => item.day === activeDay ? { ...item, exercises: item.exercises.filter((value) => value !== name) } : item));
  const filteredExercises = exerciseLibrary.filter((item) => groupFilter === "All" || item.group === groupFilter);
  return <section className="module-page">
    <PageHeading eyebrow="MYOSPHERE / TRAINING HUB" title={<>Train with <em>intent.</em></>} description="Build a weekly routine, choose movements from the exercise library and record your working sets." />
    <div className="module-stat-grid">
      <article className="module-stat"><span>LOGGED SET ENTRIES</span><strong>{entries.length}</strong><small>Across all sessions</small></article>
      <article className="module-stat"><span>RECORDED VOLUME</span><strong>{Math.round(totalVolume).toLocaleString()}</strong><small>Load × reps × sets · kg</small></article>
      <article className="module-stat"><span>EXERCISES IN LIBRARY</span><strong>{exerciseLibrary.length}</strong><small>Starter movement catalogue</small></article>
    </div>

    <section className="module-panel routine-panel">
      <div className="module-panel-title"><div><span className="eyebrow">WEEKLY PROGRAMMING</span><h2>Your training split</h2></div><span className="module-count">EDITABLE · SAVED LOCALLY</span></div>
      <div className="routine-week">{routine.map((item) => <button key={item.day} className={activeDay === item.day ? "routine-day active" : "routine-day"} onClick={() => { setActiveDay(item.day); setFocusDraft(item.focus); }}><span>{item.day.slice(0, 3).toUpperCase()}</span><strong>{item.focus || "Rest / unset"}</strong><small>{item.exercises.length} movements</small></button>)}</div>
      <div className="routine-editor">
        <div className="routine-editor-heading"><div><span className="eyebrow">{activeDay.toUpperCase()}</span><h3>Plan this day</h3></div><span className="module-count">{currentDay.exercises.length} planned</span></div>
        <div className="routine-edit-row">
          <label>Session focus<input value={focusDraft} onChange={(event) => setFocusDraft(event.target.value)} placeholder="e.g. Push, Pull, Full body, Rest" maxLength={40} /></label>
          <button className="module-secondary" type="button" onClick={saveFocus}>Save focus</button>
        </div>
        <div className="routine-edit-row">
          <label>Add exercise<select value={exerciseDraft} onChange={(event) => setExerciseDraft(event.target.value)}>{exerciseLibrary.map((item) => <option key={item.name} value={item.name}>{item.name} · {item.group}</option>)}</select></label>
          <button className="module-secondary" type="button" onClick={addRoutineExercise}>＋ Add</button>
        </div>
        <div className="routine-exercise-list">{currentDay.exercises.length ? currentDay.exercises.map((name) => <div className="routine-exercise" key={name}><span>{name}</span><button type="button" aria-label={`Remove ${name} from ${activeDay}`} onClick={() => removeRoutineExercise(name)}>×</button></div>) : <p className="routine-empty">No movements planned. Add exercises to build this session.</p>}</div>
      </div>
    </section>

    <div className="module-columns training-workspace">
      <form className="module-panel module-form" onSubmit={addEntry}>
        <div className="module-panel-title"><div><span className="eyebrow">SESSION LOGGER</span><h2>Record working sets</h2></div><span className="module-plus">＋</span></div>
        <label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
        <label>Exercise<select value={exercise} onChange={(event) => setExercise(event.target.value)}>{exerciseLibrary.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
        <div className="module-input-row">
          <label>Sets<input type="number" min="1" max="30" value={sets} onChange={(event) => setSets(event.target.value)} required /></label>
          <label>Reps<input type="number" min="1" max="100" value={reps} onChange={(event) => setReps(event.target.value)} required /></label>
          <label>Load (kg)<input type="number" min="0" max="1000" step="0.5" value={load} onChange={(event) => setLoad(event.target.value)} required /></label>
        </div>
        <button className="module-submit" type="submit">Save training entry <span>↗</span></button>
      </form>
      <section className="module-panel module-history">
        <div className="module-panel-title"><div><span className="eyebrow">YOUR ACTIVITY</span><h2>Training history</h2></div><span className="module-count">{todayEntries.length} today</span></div>
        {entries.length ? <div className="module-entry-list">{entries.slice(0, 30).map((entry) => <article className="module-entry" key={entry.id}><div><strong>{entry.exercise}</strong><small>{entry.date} · {entry.sets} sets × {entry.reps} reps</small></div><b>{entry.load} kg</b><button aria-label={`Delete ${entry.exercise} entry`} onClick={() => setEntries((current) => current.filter((item) => item.id !== entry.id))}>×</button></article>)}</div> : <div className="module-empty"><span>↗</span><strong>Your training history starts here.</strong><p>Log your first working sets to see them here.</p></div>}
      </section>
    </div>

    <section className="module-panel exercise-library-panel">
      <div className="module-panel-title"><div><span className="eyebrow">MOVEMENT DATABASE</span><h2>Exercise library</h2></div><span className="module-count">{filteredExercises.length} movements</span></div>
      <div className="exercise-filters">{["All", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core"].map((group) => <button type="button" key={group} className={groupFilter === group ? "exercise-filter active" : "exercise-filter"} onClick={() => setGroupFilter(group)}>{group}</button>)}</div>
      <div className="exercise-grid">{filteredExercises.map((item) => <article className="exercise-card" key={item.name}><span>{item.group.toUpperCase()}</span><strong>{item.name}</strong><small>{item.equipment}</small><button type="button" onClick={() => { setExercise(item.name); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Use in logger ↗</button></article>)}</div>
    </section>
    <p className="module-privacy">Routine and training entries are saved locally in this browser. The exercise catalogue is a starter set, not a complete coaching prescription.</p>
  </section>;
}

export function LegacyNutritionPage() {
  const [entries, setEntries] = useLocalData<FoodEntry[]>("myosphere-nutrition-v1", []);
  const [date, setDate] = useState(today());
  const [food, setFood] = useState("");
  const [calories, setCalories] = useState("0");
  const [protein, setProtein] = useState("0");
  const [carbs, setCarbs] = useState("0");
  const [fat, setFat] = useState("0");
  const daily = useMemo(() => entries.filter((item) => item.date === date).reduce((sum, item) => ({ calories: sum.calories + item.calories, protein: sum.protein + item.protein, carbs: sum.carbs + item.carbs, fat: sum.fat + item.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [entries, date]);
  const addEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!food.trim() || [calories, protein, carbs, fat].some((value) => !Number.isFinite(Number(value)) || Number(value) < 0)) return;
    setEntries((current) => [{ id: makeId(), date, food: food.trim(), calories: Number(calories), protein: Number(protein), carbs: Number(carbs), fat: Number(fat) }, ...current]);
    setFood("");
  };
  return <section className="module-page">
    <PageHeading eyebrow="MYOSPHERE / FOOD DIARY" title={<>Fuel your <em>progress.</em></>} description="Log meals and keep a simple view of your daily energy and macronutrients." />
    <div className="module-date-control"><label htmlFor="nutrition-date">DAY</label><input id="nutrition-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
    <div className="nutrition-summary">
      <article className="nutrition-calories"><span>DAILY ENERGY</span><strong>{daily.calories.toLocaleString()} <small>kcal</small></strong><p>Calories logged for {date}</p></article>
      <article><span>PROTEIN</span><strong>{daily.protein} <small>g</small></strong><div className="macro-track"><i style={{ width: `${Math.min(daily.protein, 200) / 2}%` }} /></div></article>
      <article><span>CARBS</span><strong>{daily.carbs} <small>g</small></strong><div className="macro-track carbs"><i style={{ width: `${Math.min(daily.carbs, 300) / 3}%` }} /></div></article>
      <article><span>FAT</span><strong>{daily.fat} <small>g</small></strong><div className="macro-track fat"><i style={{ width: `${Math.min(daily.fat, 120) / 1.2}%` }} /></div></article>
    </div>
    <div className="module-columns">
      <form className="module-panel module-form" onSubmit={addEntry}>
        <div className="module-panel-title"><div><span className="eyebrow">MEAL ENTRY</span><h2>Add food</h2></div><span className="module-plus">＋</span></div>
        <label>Food / meal<input value={food} onChange={(event) => setFood(event.target.value)} placeholder="e.g. Paneer bhurji" required maxLength={80} /></label>
        <div className="module-input-row">
          <label>Calories<input type="number" min="0" max="20000" value={calories} onChange={(event) => setCalories(event.target.value)} /></label>
          <label>Protein (g)<input type="number" min="0" max="1000" step="0.1" value={protein} onChange={(event) => setProtein(event.target.value)} /></label>
        </div>
        <div className="module-input-row">
          <label>Carbs (g)<input type="number" min="0" max="1000" step="0.1" value={carbs} onChange={(event) => setCarbs(event.target.value)} /></label>
          <label>Fat (g)<input type="number" min="0" max="1000" step="0.1" value={fat} onChange={(event) => setFat(event.target.value)} /></label>
        </div>
        <button className="module-submit" type="submit">Save food entry <span>↗</span></button>
      </form>
      <section className="module-panel module-history">
        <div className="module-panel-title"><div><span className="eyebrow">FOOD DIARY</span><h2>Entries for this day</h2></div><span className="module-count">{entries.filter((item) => item.date === date).length} items</span></div>
        {entries.some((item) => item.date === date) ? <div className="module-entry-list">{entries.filter((item) => item.date === date).map((entry) => <article className="module-entry" key={entry.id}><div><strong>{entry.food}</strong><small>{entry.protein}g protein · {entry.carbs}g carbs · {entry.fat}g fat</small></div><b>{entry.calories} kcal</b><button aria-label={`Delete ${entry.food} entry`} onClick={() => setEntries((current) => current.filter((item) => item.id !== entry.id))}>×</button></article>)}</div> : <div className="module-empty"><span>◒</span><strong>No food entries for this day.</strong><p>Add a meal to start your diary.</p></div>}
      </section>
    </div>
    <p className="module-privacy">Nutrition values are manually entered and are estimates. Saved locally in this browser.</p>
  </section>;
}

export function ProgressPage() {
  const [entries, setEntries] = useLocalData<ProgressEntry[]>("myosphere-progress-v1", []);
  const [date, setDate] = useState(today());
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const latest = entries[0];
  const addEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedWeight = Number(weight);
    if (!weight || !Number.isFinite(parsedWeight) || parsedWeight <= 0 || parsedWeight > 500) return;
    setEntries((current) => [{ id: makeId(), date, weight: parsedWeight, note: note.trim() }, ...current].sort((a, b) => b.date.localeCompare(a.date)));
    setWeight("");
    setNote("");
  };
  return <section className="module-page">
    <PageHeading eyebrow="MYOSPHERE / PROGRESS JOURNAL" title={<>Progress, <em>not perfection.</em></>} description="Create dated check-ins, keep notes and see how your measurements change over time." />
    <div className="progress-highlight"><div><span className="eyebrow">LATEST WEIGHT CHECK-IN</span><strong>{latest ? <>{latest.weight} <small>kg</small></> : "—"}</strong><p>{latest ? latest.date : "Your first check-in is waiting"}</p></div><span className="progress-mark">◷</span></div>
    <ProgressPhotoJournal />
    <div className="module-columns">
      <form className="module-panel module-form" onSubmit={addEntry}>
        <div className="module-panel-title"><div><span className="eyebrow">NEW CHECK-IN</span><h2>Record progress</h2></div><span className="module-plus">＋</span></div>
        <label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
        <label>Body weight (kg)<input type="number" min="1" max="500" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="e.g. 74.0" required /></label>
        <label>Note <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Energy, strength, measurements or how you feel..." rows={3} maxLength={500} /></label>
        <button className="module-submit" type="submit">Save check-in <span>↗</span></button>
      </form>
      <section className="module-panel module-history">
        <div className="module-panel-title"><div><span className="eyebrow">YOUR TIMELINE</span><h2>Progress history</h2></div><span className="module-count">{entries.length} check-ins</span></div>
        {entries.length ? <div className="module-entry-list">{entries.map((entry) => <article className="progress-entry" key={entry.id}><div className="progress-entry-date">{entry.date}</div><div className="progress-entry-main"><strong>{entry.weight} kg</strong><small>{entry.note || "No note added"}</small></div><button aria-label="Delete progress check-in" onClick={() => setEntries((current) => current.filter((item) => item.id !== entry.id))}>×</button></article>)}</div> : <div className="module-empty"><span>◷</span><strong>Your progress story starts here.</strong><p>Log a check-in to begin your timeline.</p></div>}
      </section>
    </div>
    <p className="module-privacy">Your check-ins stay in this browser. Progress photos and secure private storage will be added separately.</p>
  </section>;
}

export { NutritionPageView as NutritionPage };
