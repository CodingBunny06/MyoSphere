import { useEffect, useMemo, useState, type FormEvent } from "react";
import "./gym-page.css";

type Exercise = { name: string; muscle: string; equipment: string };
type SetRecord = { id: string; reps: number; load: number; rpe?: number };
type SessionExercise = { name: string; sets: SetRecord[] };
type WorkoutSession = { id: string; date: string; name: string; startedAt: string; durationMinutes: number; exercises: SessionExercise[] };
type PlanDay = { day: string; focus: string; exercises: string[] };

const STORAGE_KEY = "myosphere-gym-sessions-v1";
const PLAN_KEY = "myosphere-gym-plan-v1";
const exercises: Exercise[] = [
  { name: "Barbell bench press", muscle: "Chest", equipment: "Barbell" },
  { name: "Incline dumbbell press", muscle: "Chest", equipment: "Dumbbells" },
  { name: "Cable fly", muscle: "Chest", equipment: "Cable" },
  { name: "Push-up", muscle: "Chest", equipment: "Bodyweight" },
  { name: "Lat pulldown", muscle: "Back", equipment: "Cable" },
  { name: "Seated cable row", muscle: "Back", equipment: "Cable" },
  { name: "One-arm dumbbell row", muscle: "Back", equipment: "Dumbbells" },
  { name: "Pull-up", muscle: "Back", equipment: "Bodyweight" },
  { name: "Overhead press", muscle: "Shoulders", equipment: "Barbell" },
  { name: "Lateral raise", muscle: "Shoulders", equipment: "Dumbbells" },
  { name: "Reverse fly", muscle: "Shoulders", equipment: "Dumbbells" },
  { name: "Barbell curl", muscle: "Arms", equipment: "Barbell" },
  { name: "Hammer curl", muscle: "Arms", equipment: "Dumbbells" },
  { name: "Triceps pushdown", muscle: "Arms", equipment: "Cable" },
  { name: "Barbell squat", muscle: "Legs", equipment: "Barbell" },
  { name: "Romanian deadlift", muscle: "Legs", equipment: "Barbell" },
  { name: "Leg extension", muscle: "Legs", equipment: "Machine" },
  { name: "Leg curl", muscle: "Legs", equipment: "Machine" },
  { name: "Standing calf raise", muscle: "Legs", equipment: "Machine" },
  { name: "Plank", muscle: "Core", equipment: "Bodyweight" },
];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const defaultPlan: PlanDay[] = [
  { day: "Monday", focus: "Push", exercises: ["Barbell bench press", "Incline dumbbell press", "Overhead press", "Lateral raise", "Triceps pushdown"] },
  { day: "Tuesday", focus: "Pull", exercises: ["Lat pulldown", "Seated cable row", "One-arm dumbbell row", "Barbell curl", "Hammer curl"] },
  { day: "Wednesday", focus: "Legs", exercises: ["Barbell squat", "Romanian deadlift", "Leg extension", "Leg curl", "Standing calf raise"] },
  { day: "Thursday", focus: "Rest", exercises: [] },
  { day: "Friday", focus: "Shoulders + arms", exercises: ["Overhead press", "Lateral raise", "Reverse fly", "Barbell curl", "Triceps pushdown"] },
  { day: "Saturday", focus: "Chest + back", exercises: ["Barbell bench press", "Incline dumbbell press", "Lat pulldown", "Seated cable row"] },
  { day: "Sunday", focus: "Rest", exercises: [] },
];
const today = () => { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
function loadInitialSessions(): WorkoutSession[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    try { return JSON.parse(saved) as WorkoutSession[]; } catch { return []; }
  }
  const legacy = readStore<Array<{ id?: string; date: string; exercise: string; sets: number; reps: number; load: number }>>("myosphere-training-v1", []);
  const grouped = new Map<string, WorkoutSession>();
  legacy.forEach((entry) => {
    const session = grouped.get(entry.date) ?? { id: `legacy-${entry.date}`, date: entry.date, name: "Imported workout", startedAt: new Date(entry.date + "T12:00:00").toISOString(), durationMinutes: 0, exercises: [] };
    const existing = session.exercises.find((item) => item.name === entry.exercise);
    const migratedSets = Array.from({ length: Math.max(0, entry.sets) }, () => ({ id: makeId(), reps: entry.reps, load: entry.load }));
    if (existing) existing.sets.push(...migratedSets);
    else session.exercises.push({ name: entry.exercise, sets: migratedSets });
    grouped.set(entry.date, session);
  });
  return [...grouped.values()].sort((a, b) => b.date.localeCompare(a.date));
}
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
function readStore<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function saveStore<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)); }
function sessionVolume(session: WorkoutSession) {
  return session.exercises.reduce((total, exercise) => total + exercise.sets.reduce((sum, set) => sum + set.reps * set.load, 0), 0);
}
type Tab = "Overview" | "Plan" | "Start" | "Stats" | "Exercises";

export default function GymPage() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [sessions, setSessions] = useState<WorkoutSession[]>(loadInitialSessions);
  const [plan, setPlan] = useState<PlanDay[]>(() => readStore(PLAN_KEY, defaultPlan));
  const [activeDay, setActiveDay] = useState(days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [sessionName, setSessionName] = useState("");
  const [selectedExercise, setSelectedExercise] = useState(exercises[0].name);
  const [reps, setReps] = useState("10");
  const [load, setLoad] = useState("0");
  const [rpe, setRpe] = useState("");
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("All");
  const [unit, setUnit] = useState<"kg" | "lb">("kg");

  useEffect(() => saveStore(STORAGE_KEY, sessions), [sessions]);
  useEffect(() => saveStore(PLAN_KEY, plan), [plan]);

  const totalVolume = useMemo(() => sessions.reduce((sum, session) => sum + sessionVolume(session), 0), [sessions]);
  const weekSessions = sessions.filter((session) => {
    const d = new Date(session.date + "T00:00:00");
    const now = new Date();
    const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0, 0, 0, 0);
    return d >= monday;
  });
  const totalSets = sessions.reduce((sum, session) => sum + session.exercises.reduce((n, item) => n + item.sets.length, 0), 0);
  const displayLoad = (value: number) => unit === "lb" ? value * 2.2046226218 : value;
  const displayVolume = displayLoad(totalVolume);
  const bestLoads = useMemo(() => {
    const best = new Map<string, number>();
    sessions.forEach((session) => session.exercises.forEach((item) => item.sets.forEach((set) => best.set(item.name, Math.max(best.get(item.name) ?? 0, set.load)))));
    return [...best.entries()].sort((a, b) => b[1] - a[1]);
  }, [sessions]);
  const currentPlan = plan.find((item) => item.day === activeDay) ?? defaultPlan[0];
  const filteredExercises = exercises.filter((item) => (muscleFilter === "All" || item.muscle === muscleFilter) && item.name.toLowerCase().includes(query.toLowerCase()));

  function changeUnit(nextUnit: "kg" | "lb") {
    if (nextUnit === unit) return;
    const currentLoad = Number(load);
    if (Number.isFinite(currentLoad)) {
      setLoad((nextUnit === "lb" ? currentLoad * 2.2046226218 : currentLoad / 2.2046226218).toFixed(1));
    }
    setUnit(nextUnit);
  }

  function startSession(name?: string) {
    const planned = currentPlan;
    const label = name ?? (planned.focus && planned.focus !== "Rest" ? planned.focus : "Training session");
    setSessionName(label);
    setActiveSession({ id: makeId(), date: today(), name: label, startedAt: new Date().toISOString(), durationMinutes: 0, exercises: [] });
    setTab("Start");
  }
  function addSet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeSession || Number(reps) < 1 || Number(load) < 0) return;
    const record: SetRecord = { id: makeId(), reps: Number(reps), load: unit === "lb" ? Number(load) / 2.2046226218 : Number(load), ...(rpe ? { rpe: Number(rpe) } : {}) };
    setActiveSession((current) => {
      if (!current) return current;
      const existing = current.exercises.find((item) => item.name === selectedExercise);
      return { ...current, exercises: existing
        ? current.exercises.map((item) => item.name === selectedExercise ? { ...item, sets: [...item.sets, record] } : item)
        : [...current.exercises, { name: selectedExercise, sets: [record] }] };
    });
    setReps("10"); setRpe("");
  }
  function finishSession() {
    if (!activeSession) return;
    const durationMinutes = Math.max(1, Math.round((Date.now() - new Date(activeSession.startedAt).getTime()) / 60000));
    if (activeSession.exercises.some((item) => item.sets.length)) setSessions((current) => [{ ...activeSession, durationMinutes }, ...current]);
    setActiveSession(null); setTab("Overview");
  }
  function updatePlanFocus(value: string) {
    setPlan((current) => current.map((item) => item.day === activeDay ? { ...item, focus: value } : item));
  }
  function addPlanExercise(name: string) {
    setPlan((current) => current.map((item) => item.day === activeDay && !item.exercises.includes(name) ? { ...item, exercises: [...item.exercises, name] } : item));
  }
  function removePlanExercise(name: string) {
    setPlan((current) => current.map((item) => item.day === activeDay ? { ...item, exercises: item.exercises.filter((value) => value !== name) } : item));
  }

  return <section className="gym-page">
    <header className="gym-heading">
      <div><span className="gym-eyebrow">MYOSPHERE / TRAINING</span><h1>Build your <em>strength.</em></h1><p>Your training, organised around consistency and measurable progress.</p></div>
      <div className="gym-unit"><span>LOAD UNIT</span><button className={unit === "kg" ? "selected" : ""} onClick={() => changeUnit("kg")}>KG</button><button className={unit === "lb" ? "selected" : ""} onClick={() => changeUnit("lb")}>LB</button></div>
    </header>
    <nav className="gym-tabs" aria-label="Gym sections">{(["Overview", "Plan", "Start", "Stats", "Exercises"] as Tab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</nav>

    {tab === "Overview" && <div className="gym-content">
      <div className="gym-welcome"><div><span className="gym-eyebrow">YOUR TRAINING SPACE</span><h2>Show up. <em>Get stronger.</em></h2><p>{weekSessions.length} sessions logged this week. Every session counts.</p><button className="gym-primary" onClick={() => startSession()}>Start a workout <span>↗</span></button></div><div className="gym-welcome-mark">M<span>✳</span></div></div>
      <div className="gym-kpis">
        <article><span>THIS WEEK</span><strong>{weekSessions.length}</strong><small>workout sessions</small></article>
        <article><span>TOTAL SETS</span><strong>{totalSets}</strong><small>logged working sets</small></article>
        <article><span>TOTAL VOLUME</span><strong>{Math.round(displayVolume).toLocaleString()}</strong><small>{unit} × reps · logged load volume</small></article>
      </div>
      <div className="gym-two-col">
        <section className="gym-panel"><div className="gym-panel-title"><div><span className="gym-eyebrow">YOUR PROGRAM</span><h3>Today's plan</h3></div><button onClick={() => setTab("Plan")}>Edit plan ↗</button></div><div className="gym-today-plan"><span>{currentPlan.day.toUpperCase()}</span><strong>{currentPlan.focus || "Rest / recovery"}</strong><small>{currentPlan.exercises.length} planned movements</small></div>{currentPlan.exercises.slice(0, 4).map((name) => <div className="gym-list-row" key={name}>{name}<span>↗</span></div>)}<button className="gym-inline-link" onClick={() => startSession(currentPlan.focus)}>Start today's plan →</button></section>
        <section className="gym-panel"><div className="gym-panel-title"><div><span className="gym-eyebrow">RECENT ACTIVITY</span><h3>Latest sessions</h3></div><button onClick={() => setTab("Stats")}>View stats ↗</button></div>{sessions.length ? sessions.slice(0, 4).map((session) => <div className="gym-history-row" key={session.id}><div><strong>{session.name}</strong><small>{session.date} · {session.exercises.length} exercises</small></div><b>{Math.round(displayLoad(sessionVolume(session))).toLocaleString()} {unit}</b></div>) : <div className="gym-empty"><strong>No sessions yet</strong><p>Start your first workout to build your training history.</p></div>}</section>
      </div>
    </div>}

    {tab === "Plan" && <div className="gym-content"><div className="gym-section-intro"><span className="gym-eyebrow">WEEKLY PROGRAMMING</span><h2>Your training <em>split.</em></h2><p>Choose a day, edit its focus and add movements. Your plan is saved on this device.</p></div>
      <div className="gym-day-picker">{plan.map((item) => <button key={item.day} className={activeDay === item.day ? "active" : ""} onClick={() => setActiveDay(item.day)}><span>{item.day.slice(0, 3).toUpperCase()}</span><strong>{item.focus || "Unset"}</strong><small>{item.exercises.length} exercises</small></button>)}</div>
      <section className="gym-panel gym-plan-editor"><label>Session focus<input value={currentPlan.focus} onChange={(event) => updatePlanFocus(event.target.value)} placeholder="e.g. Push, Pull, Legs, Rest" maxLength={40}/></label><div className="gym-panel-title"><div><span className="gym-eyebrow">{activeDay.toUpperCase()}</span><h3>Planned exercises</h3></div><span className="gym-count">{currentPlan.exercises.length} movements</span></div>{currentPlan.exercises.map((name) => <div className="gym-list-row" key={name}>{name}<button onClick={() => removePlanExercise(name)} aria-label={`Remove ${name}`}>×</button></div>)}<label>Add a movement<select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)}>{exercises.map((item) => <option key={item.name}>{item.name}</option>)}</select></label><button className="gym-secondary" onClick={() => addPlanExercise(selectedExercise)}>＋ Add to {activeDay}</button><button className="gym-primary" onClick={() => startSession(currentPlan.focus)}>Start this workout ↗</button></section>
    </div>}

    {tab === "Start" && <div className="gym-content"><div className="gym-section-intro"><span className="gym-eyebrow">LIVE WORKOUT</span><h2>{activeSession ? activeSession.name : "Ready when you are."}</h2><p>{activeSession ? "Log each working set as you go. Finish the session to save it to your history." : "Start a session to track exercises, reps and load."}</p></div>
      {!activeSession ? <section className="gym-panel gym-start-card"><label>Session name<input value={sessionName} onChange={(event) => setSessionName(event.target.value)} placeholder="e.g. Push day"/></label><button className="gym-primary" onClick={() => startSession(sessionName || "Training session")}>Start session ↗</button></section> : <><section className="gym-panel gym-session-toolbar"><div><span className="gym-eyebrow">SESSION IN PROGRESS</span><strong>{activeSession.exercises.reduce((n, item) => n + item.sets.length, 0)} working sets</strong></div><button className="gym-finish" onClick={finishSession}>Finish workout ✓</button></section><div className="gym-log-layout"><form className="gym-panel gym-set-form" onSubmit={addSet}><h3>Log a working set</h3><label>Exercise<select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)}>{exercises.map((item) => <option key={item.name}>{item.name}</option>)}</select></label><div className="gym-form-row"><label>Reps<input type="number" min="1" max="100" value={reps} onChange={(event) => setReps(event.target.value)} required/></label><label>Load ({unit})<input type="number" min="0" max="1000" step="0.5" value={load} onChange={(event) => setLoad(event.target.value)} required/></label></div><label>RPE (optional)<select value={rpe} onChange={(event) => setRpe(event.target.value)}><option value="">Not recorded</option>{Array.from({length: 10}, (_, i) => String(i + 1)).map((value) => <option key={value} value={value}>{value}</option>)}</select></label><button className="gym-primary" type="submit">＋ Add set</button></form><section className="gym-panel gym-live-log"><h3>Session log</h3>{activeSession.exercises.length ? activeSession.exercises.map((item) => <div className="gym-live-exercise" key={item.name}><strong>{item.name}</strong>{item.sets.map((set, index) => <div className="gym-set-row" key={set.id}><span>Set {index + 1}</span><b>{set.reps} reps × {displayLoad(set.load).toFixed(1)} {unit}</b><small>{set.rpe ? `RPE ${set.rpe}` : "RPE —"}</small></div>)}</div>) : <div className="gym-empty"><strong>Nothing logged yet</strong><p>Add your first working set to start the session log.</p></div>}</section></div></>}
    </div>}

    {tab === "Stats" && <div className="gym-content"><div className="gym-section-intro"><span className="gym-eyebrow">TRAINING ANALYTICS</span><h2>Progress you can <em>measure.</em></h2><p>Session history and simple performance records calculated from the sets you log.</p></div><div className="gym-kpis"><article><span>SESSIONS</span><strong>{sessions.length}</strong><small>all-time completed workouts</small></article><article><span>WORKING SETS</span><strong>{totalSets}</strong><small>all-time recorded sets</small></article><article><span>VOLUME</span><strong>{Math.round(displayVolume).toLocaleString()}</strong><small>{unit} × reps · cumulative</small></article></div><section className="gym-panel"><div className="gym-panel-title"><div><span className="gym-eyebrow">PERSONAL RECORDS</span><h3>Heaviest logged load</h3></div><span className="gym-count">{bestLoads.length} exercises</span></div>{bestLoads.length ? bestLoads.map(([name, value]) => <div className="gym-history-row" key={name}><div><strong>{name}</strong><small>Highest single-set load recorded</small></div><b>{displayLoad(value).toFixed(1)} {unit}</b></div>) : <div className="gym-empty"><strong>No records yet</strong><p>Complete a workout to start building your personal records.</p></div>}</section><section className="gym-panel"><div className="gym-panel-title"><div><span className="gym-eyebrow">SESSION HISTORY</span><h3>Completed workouts</h3></div><span className="gym-count">{sessions.length} total</span></div>{sessions.length ? sessions.map((session) => <div className="gym-history-row" key={session.id}><div><strong>{session.name}</strong><small>{session.date} · {session.durationMinutes} min · {session.exercises.reduce((n, item) => n + item.sets.length, 0)} sets</small></div><b>{Math.round(displayLoad(sessionVolume(session))).toLocaleString()} {unit}</b></div>) : <div className="gym-empty"><strong>Your history starts with one session</strong><p>Completed workouts will appear here.</p></div>}</section></div>}

    {tab === "Exercises" && <div className="gym-content"><div className="gym-section-intro"><span className="gym-eyebrow">MOVEMENT DATABASE</span><h2>Find your <em>next movement.</em></h2><p>Browse the starter exercise catalogue by muscle group or name.</p></div><input className="gym-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercises…"/><div className="gym-filters">{["All", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core"].map((muscle) => <button key={muscle} className={muscleFilter === muscle ? "active" : ""} onClick={() => setMuscleFilter(muscle)}>{muscle}</button>)}</div><div className="gym-exercise-grid">{filteredExercises.map((item) => <article className="gym-exercise-card" key={item.name}><span>{item.muscle.toUpperCase()}</span><strong>{item.name}</strong><small>{item.equipment}</small><button onClick={() => { setSelectedExercise(item.name); setTab(activeSession ? "Start" : "Plan"); }}>Use exercise ↗</button></article>)}</div></div>}
    <p className="gym-disclaimer">Training records are stored locally in this browser. Load values are recorded in the selected unit; switch units only for display. Personal records show the heaviest logged single-set load, not a verified one-rep maximum.</p>
  </section>;
}
