import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  countSessionsInRange,
  getExerciseProgression,
  getPersonalRecords,
  getWeekBounds,
  sessionVolume,
  type TrainingSession,
  type TrainingSet,
} from "./trainingMath.mjs";
import "./gym-page.css";

type Exercise = { name: string; muscle: string; equipment: string };
type SetRecord = TrainingSet;
type WorkoutSession = TrainingSession;
type PlanDay = { day: string; focus: string; exercises: string[] };
type RoutineTemplate = { id: string; name: string; exercises: string[] };
type PlanMode = "weekly" | "rotation";
type Tab = "Overview" | "Plan" | "Start" | "Stats" | "Exercises";

const STORAGE_KEY = "myosphere-gym-sessions-v1";
const PLAN_KEY = "myosphere-gym-plan-v1";
const ACTIVE_KEY = "myosphere-gym-active-session-v1";
const UNIT_KEY = "myosphere-gym-unit-v1";
const TEMPLATES_KEY = "myosphere-gym-templates-v1";
const PLAN_MODE_KEY = "myosphere-gym-plan-mode-v1";
const ROTATION_START_KEY = "myosphere-gym-rotation-start-v1";
const LB_PER_KG = 2.2046226218;

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
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const today = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}
function saveStore<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be unavailable or full. */ }
}
function loadInitialSessions(): WorkoutSession[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    try {
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed as WorkoutSession[];
      return [];
    } catch { return []; }
  }
  const legacy = readStore<Array<{ date: string; exercise: string; sets: number; reps: number; load: number }>>("myosphere-training-v1", []);
  const grouped = new Map<string, WorkoutSession>();
  legacy.forEach((entry) => {
    if (!entry || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || !entry.exercise) return;
    const session = grouped.get(entry.date) ?? {
      id: `legacy-${entry.date}`, date: entry.date, name: "Imported workout",
      startedAt: new Date(entry.date + "T12:00:00").toISOString(), durationMinutes: 0, exercises: [],
    };
    const existing = session.exercises.find((item) => item.name === entry.exercise);
    const migratedSets = Array.from({ length: Math.min(100, Math.max(0, Number(entry.sets) || 0)) }, () => ({
      id: makeId(), reps: Number(entry.reps) || 0, load: Number(entry.load) || 0,
    }));
    if (existing) existing.sets.push(...migratedSets);
    else session.exercises.push({ name: entry.exercise, sets: migratedSets });
    grouped.set(entry.date, session);
  });
  return [...grouped.values()].sort((a, b) => b.date.localeCompare(a.date));
}
function displayDate(value: string) {
  return new Date(value + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function displayLoad(value: number, unit: "kg" | "lb") {
  return unit === "lb" ? value * LB_PER_KG : value;
}
function ProgressionChart({ points, unit }: { points: ReturnType<typeof getExerciseProgression>; unit: "kg" | "lb" }) {
  if (!points.length) return <div className="gym-empty"><strong>No history for this exercise yet</strong><p>Log this movement in a workout to build its progression chart.</p></div>;
  const values = points.map((point) => displayLoad(point.bestLoad, unit));
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = Math.max(1, high - low);
  const coords = values.map((value, index) => ({
    x: points.length === 1 ? 300 : 38 + (index / (points.length - 1)) * 524,
    y: 174 - ((value - low) / span) * 128,
  }));
  const polyline = coords.map((point) => `${point.x},${point.y}`).join(" ");
  return <div className="gym-chart-wrap">
    <div className="gym-chart-summary"><strong>{values[values.length - 1].toFixed(1)} {unit}</strong><span>latest best set load</span></div>
    <svg className="gym-progression-chart" viewBox="0 0 600 220" role="img" aria-label={`Best set load progression across ${points.length} logged sessions`}>
      {[46, 110, 174].map((y) => <line key={y} x1="38" x2="562" y1={y} y2={y} className="gym-chart-grid" />)}
      <polyline points={polyline} className="gym-chart-line" />
      {coords.map((point, index) => <circle key={points[index].date + index} cx={point.x} cy={point.y} r="5" className="gym-chart-point"><title>{points[index].date}: {values[index].toFixed(1)} {unit}</title></circle>)}
      <text x="38" y="204" className="gym-chart-label">{points[0].date.slice(5)}</text>
      <text x="562" y="204" textAnchor="end" className="gym-chart-label">{points[points.length - 1].date.slice(5)}</text>
      <text x="38" y="30" className="gym-chart-label">{high.toFixed(1)} {unit}</text>
      <text x="38" y="190" className="gym-chart-label">{low.toFixed(1)} {unit}</text>
    </svg>
    <p className="gym-chart-note">Each point is the heaviest set logged for this exercise in that session. This tracks load, not technique or readiness.</p>
  </div>;
}

export default function GymPage() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [sessions, setSessions] = useState<WorkoutSession[]>(loadInitialSessions);
  const [plan, setPlan] = useState<PlanDay[]>(() => readStore(PLAN_KEY, defaultPlan));
  const [templates, setTemplates] = useState<RoutineTemplate[]>(() => readStore<RoutineTemplate[]>(TEMPLATES_KEY, []));
  const [planMode, setPlanMode] = useState<PlanMode>(() => readStore<PlanMode>(PLAN_MODE_KEY, "weekly"));
  const [rotationStartDate, setRotationStartDate] = useState(() => readStore<string>(ROTATION_START_KEY, today()));
  const [planView, setPlanView] = useState<"schedule" | "routines">("schedule");
  const [newRoutineName, setNewRoutineName] = useState("");
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [routineDraft, setRoutineDraft] = useState<RoutineTemplate | null>(null);
  const [activeDay, setActiveDay] = useState(days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(() => readStore<WorkoutSession | null>(ACTIVE_KEY, null));
  const [sessionName, setSessionName] = useState("");
  const [selectedExercise, setSelectedExercise] = useState(exercises[0].name);
  const [reps, setReps] = useState("10");
  const [load, setLoad] = useState("0");
  const [rpe, setRpe] = useState("");
  const [rir, setRir] = useState("");
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("All");
  const [unit, setUnit] = useState<"kg" | "lb">(() => readStore<"kg" | "lb">(UNIT_KEY, "kg"));
  const [progressExercise, setProgressExercise] = useState(exercises[0].name);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionDraft, setSessionDraft] = useState<WorkoutSession | null>(null);
  const [templateName, setTemplateName] = useState("");

  useEffect(() => saveStore(STORAGE_KEY, sessions), [sessions]);
  useEffect(() => saveStore(PLAN_KEY, plan), [plan]);
  useEffect(() => saveStore(TEMPLATES_KEY, templates), [templates]);
  useEffect(() => saveStore(PLAN_MODE_KEY, planMode), [planMode]);
  useEffect(() => saveStore(ROTATION_START_KEY, rotationStartDate), [rotationStartDate]);
  useEffect(() => saveStore(UNIT_KEY, unit), [unit]);
  useEffect(() => {
    if (activeSession) saveStore(ACTIVE_KEY, activeSession);
    else {
      try { localStorage.removeItem(ACTIVE_KEY); } catch { /* Storage may be unavailable. */ }
    }
  }, [activeSession]);

  const week = getWeekBounds(new Date());
  const weekSessionCount = countSessionsInRange(sessions, week.start, week.end);
  const totalSets = sessions.reduce((sum, session) => sum + session.exercises.reduce((n, item) => n + item.sets.length, 0), 0);
  const totalVolume = useMemo(() => sessions.reduce((sum, session) => sum + sessionVolume(session), 0), [sessions]);
  const records = useMemo(() => getPersonalRecords(sessions), [sessions]);
  const progression = useMemo(() => getExerciseProgression(sessions, progressExercise), [sessions, progressExercise]);
  const rotationStart = Date.parse(rotationStartDate + "T00:00:00Z");
  const rotationDays = Number.isFinite(rotationStart) ? Math.max(0, Math.floor((Date.parse(today() + "T00:00:00Z") - rotationStart) / 86400000)) : 0;
  const rotationRoutine = templates.length ? templates[rotationDays % templates.length] : null;
  const weekStripPlan = days.map((day, index): PlanDay => {
    if (planMode !== "rotation") return plan.find((item) => item.day === day) ?? defaultPlan[index];
    if (!templates.length) return { day, focus: "No routine", exercises: [] };
    const stripDate = new Date(week.start + "T00:00:00");
    stripDate.setDate(stripDate.getDate() + index);
    const stripDateUtc = Date.UTC(stripDate.getFullYear(), stripDate.getMonth(), stripDate.getDate());
    const dayOffset = Number.isFinite(rotationStart) ? Math.max(0, Math.floor((stripDateUtc - rotationStart) / 86400000)) : 0;
    const routine = templates[dayOffset % templates.length];
    return { day, focus: routine.name, exercises: routine.exercises };
  });
  const currentPlan: PlanDay = planMode === "rotation"
    ? rotationRoutine
      ? { day: activeDay, focus: rotationRoutine.name, exercises: rotationRoutine.exercises }
      : { day: activeDay, focus: "No routine", exercises: [] }
    : plan.find((item) => item.day === activeDay) ?? defaultPlan[0];
  const filteredExercises = exercises.filter((item) => (muscleFilter === "All" || item.muscle === muscleFilter) && item.name.toLowerCase().includes(query.toLowerCase()));

  function changeUnit(nextUnit: "kg" | "lb") {
    if (nextUnit === unit) return;
    const currentLoad = Number(load);
    if (Number.isFinite(currentLoad)) setLoad((nextUnit === "lb" ? currentLoad * LB_PER_KG : currentLoad / LB_PER_KG).toFixed(1));
    setUnit(nextUnit);
  }
  function startSession(name?: string, plannedExercises = currentPlan.exercises) {
    const label = name ?? (currentPlan.focus && currentPlan.focus !== "Rest" ? currentPlan.focus : "Training session");
    const next: WorkoutSession = {
      id: makeId(), date: today(), name: label, startedAt: new Date().toISOString(), durationMinutes: 0,
      exercises: plannedExercises.map((exercise) => ({ name: exercise, sets: [] })),
    };
    setSessionName(label);
    setSelectedExercise(plannedExercises[0] ?? exercises[0].name);
    setActiveSession(next);
    setTab("Start");
  }
  function addSet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const repsValue = Number(reps);
    const loadValue = Number(load);
    if (!activeSession || !Number.isInteger(repsValue) || repsValue < 1 || repsValue > 100 || !Number.isFinite(loadValue) || loadValue < 0 || loadValue > 1000) return;
    const record: SetRecord = {
      id: makeId(), reps: repsValue, load: unit === "lb" ? loadValue / LB_PER_KG : loadValue,
      ...(rpe ? { rpe: Number(rpe) } : {}), ...(rir ? { rir: Number(rir) } : {}),
    };
    setActiveSession((current) => {
      if (!current) return current;
      const existing = current.exercises.find((item) => item.name === selectedExercise);
      return { ...current, exercises: existing
        ? current.exercises.map((item) => item.name === selectedExercise ? { ...item, sets: [...item.sets, record] } : item)
        : [...current.exercises, { name: selectedExercise, sets: [record] }] };
    });
    setReps("10"); setRpe(""); setRir("");
  }
  function removeLiveSet(exerciseName: string, setId: string) {
    setActiveSession((current) => current ? {
      ...current,
      exercises: current.exercises.map((item) => item.name === exerciseName ? { ...item, sets: item.sets.filter((set) => set.id !== setId) } : item).filter((item) => item.sets.length > 0),
    } : current);
  }
  function finishSession() {
    if (!activeSession || !activeSession.exercises.some((item) => item.sets.length)) return;
    const durationMinutes = Math.max(1, Math.round((Date.now() - new Date(activeSession.startedAt).getTime()) / 60000));
    setSessions((current) => [{ ...activeSession, date: activeSession.date || today(), durationMinutes }, ...current].sort((a, b) => b.date.localeCompare(a.date)));
    setActiveSession(null);
    setTab("Overview");
  }
  function cancelSession() {
    if (!activeSession || window.confirm("Discard this in-progress workout? Its sets will not be saved.")) {
      setActiveSession(null);
      setTab("Overview");
    }
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
  function saveTemplate() {
    const name = templateName.trim() || currentPlan.focus || `${activeDay} routine`;
    if (!currentPlan.exercises.length) return;
    setTemplates((current) => [{ id: makeId(), name, exercises: [...currentPlan.exercises] }, ...current]);
    setTemplateName("");
  }
  function applyTemplate(template: RoutineTemplate) {
    setPlan((current) => current.map((item) => item.day === activeDay ? { ...item, focus: template.name, exercises: [...template.exercises] } : item));
  }
  function createRoutine() {
    const name = newRoutineName.trim();
    if (!name) return;
    const routine = { id: makeId(), name, exercises: [] as string[] };
    setTemplates((current) => [...current, routine]);
    setRoutineDraft(routine); setEditingRoutineId(routine.id); setNewRoutineName(""); setPlanView("routines");
  }
  function updateRoutineDraft(patch: Partial<RoutineTemplate>) { setRoutineDraft((current) => current ? { ...current, ...patch } : current); }
  function saveRoutineDraft() {
    if (!routineDraft || !routineDraft.name.trim()) return;
    setTemplates((current) => current.some((item) => item.id === routineDraft.id)
      ? current.map((item) => item.id === routineDraft.id ? { ...routineDraft, name: routineDraft.name.trim() } : item)
      : [...current, { ...routineDraft, name: routineDraft.name.trim() }]);
    setRoutineDraft(null); setEditingRoutineId(null);
  }
  function deleteRoutine(id: string) {
    if (!window.confirm("Delete this routine? Existing weekly assignments and workout history will remain unchanged.")) return;
    setTemplates((current) => current.filter((item) => item.id !== id));
    if (editingRoutineId === id) { setEditingRoutineId(null); setRoutineDraft(null); }
  }
  function moveRoutine(index: number, direction: -1 | 1) {
    setTemplates((current) => { const next = [...current]; const target = index + direction; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next; });
  }
  function openSessionEditor(session: WorkoutSession) {
    setEditingSessionId(session.id);
    setSessionDraft(JSON.parse(JSON.stringify(session)) as WorkoutSession);
  }
  function updateDraftSet(exerciseName: string, setId: string, field: "reps" | "load" | "rpe" | "rir", value: string) {
    if (!sessionDraft) return;
    const numeric = value === "" ? undefined : Number(value);
    setSessionDraft({
      ...sessionDraft,
      exercises: sessionDraft.exercises.map((exercise) => exercise.name === exerciseName ? {
        ...exercise,
        sets: exercise.sets.map((set) => {
          if (set.id !== setId) return set;
          const next = { ...set } as SetRecord;
          if (field === "reps") next.reps = numeric ?? 1;
          if (field === "load") next.load = unit === "lb" ? (numeric ?? 0) / LB_PER_KG : numeric ?? 0;
          if (field === "rpe" || field === "rir") {
            if (numeric === undefined) delete next[field];
            else next[field] = numeric;
          }
          return next;
        }),
      } : exercise),
    });
  }
  function removeDraftSet(exerciseName: string, setId: string) {
    if (!sessionDraft) return;
    setSessionDraft({
      ...sessionDraft,
      exercises: sessionDraft.exercises.map((exercise) => exercise.name === exerciseName
        ? { ...exercise, sets: exercise.sets.filter((set) => set.id !== setId) }
        : exercise).filter((exercise) => exercise.sets.length > 0),
    });
  }
  function saveSessionEdit() {
    if (!sessionDraft || !sessionDraft.name.trim()) return;
    const cleaned = {
      ...sessionDraft,
      name: sessionDraft.name.trim(),
      exercises: sessionDraft.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.filter((set) => Number.isFinite(set.reps) && set.reps >= 1 && Number.isFinite(set.load) && set.load >= 0),
      })).filter((exercise) => exercise.sets.length > 0),
    };
    setSessions((current) => current.map((session) => session.id === editingSessionId ? cleaned : session).sort((a, b) => b.date.localeCompare(a.date)));
    setEditingSessionId(null);
    setSessionDraft(null);
  }
  function deleteSession(sessionId: string) {
    if (!window.confirm("Permanently delete this saved workout?")) return;
    setSessions((current) => current.filter((session) => session.id !== sessionId));
    if (editingSessionId === sessionId) { setEditingSessionId(null); setSessionDraft(null); }
  }

  return <section className="gym-page">
    <header className="gym-heading">
      <div><span className="gym-eyebrow">MYOSPHERE / TRAINING</span><h1>Training</h1><p>Your plan, your sessions, your progress — all in one place.</p></div>
      <div className="gym-unit"><span>LOAD UNIT</span><button className={unit === "kg" ? "selected" : ""} onClick={() => changeUnit("kg")}>KG</button><button className={unit === "lb" ? "selected" : ""} onClick={() => changeUnit("lb")}>LB</button></div>
    </header>
    <nav className="gym-tabs" aria-label="Gym sections">{(["Overview", "Plan", "Start", "Stats", "Exercises"] as Tab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}><span>{({ Overview: "Today", Plan: "Plan", Start: "Workout", Stats: "Progress", Exercises: "Library" } as Record<Tab, string>)[item]}</span></button>)}</nav>

    {tab === "Overview" && <div className="gym-content">
      <div className="gym-welcome"><div className="gym-welcome-copy"><span className="gym-eyebrow">TODAY · {currentPlan.day.toUpperCase()}</span><h2>{currentPlan.focus === "Rest" ? "Recovery day." : currentPlan.focus === "No routine" ? "Build your training cycle." : <>Ready for <em>{currentPlan.focus || "your workout"}?</em></>}</h2><p>{currentPlan.exercises.length ? `${currentPlan.exercises.length} exercises planned · ${weekSessionCount} workouts completed this week` : "Take a recovery day or build a session when you're ready."}</p><div className="gym-welcome-actions"><button className="gym-primary" onClick={() => currentPlan.exercises.length ? startSession(currentPlan.focus, currentPlan.exercises) : setTab("Plan")}>{currentPlan.exercises.length ? "Start today's workout" : "Build a workout"} <span>→</span></button><button className="gym-quiet-action" onClick={() => setTab("Plan")}>View weekly plan</button></div></div><div className="gym-today-count"><strong>{currentPlan.exercises.length.toString().padStart(2, "0")}</strong><span>EXERCISES</span><i>IN TODAY'S PLAN</i></div></div>
      <div className="gym-week-strip" aria-label={planMode === "rotation" ? "Weekly preview of rotating training cycle" : "Weekly training schedule"}>{weekStripPlan.map((item) => <button key={item.day} className={activeDay === item.day ? "selected" : ""} onClick={() => { setActiveDay(item.day); setPlanView("schedule"); setTab("Plan"); }}><span>{item.day.slice(0, 3)}</span><strong>{item.focus === "Rest" ? "Rest" : item.focus === "No routine" ? "—" : item.focus.split(/[ +]/)[0]}</strong><small>{item.exercises.length ? `${item.exercises.length} moves` : item.focus === "No routine" ? "No routine" : "Recovery"}</small></button>)}</div>
      <div className="gym-kpis">
        <article><span>THIS WEEK</span><strong>{weekSessionCount}</strong><small>{week.start} – {week.end}</small></article>
        <article><span>TOTAL SETS</span><strong>{totalSets}</strong><small>logged working sets</small></article>
        <article><span>TOTAL VOLUME</span><strong>{Math.round(displayLoad(totalVolume, unit)).toLocaleString()}</strong><small>{unit} × reps · cumulative logged volume</small></article>
      </div>
      <div className="gym-two-col">
        <section className="gym-panel"><div className="gym-panel-title"><div><span className="gym-eyebrow">UP NEXT</span><h3>Today's session</h3></div><button onClick={() => setTab("Plan")}>Edit plan →</button></div><div className="gym-today-plan"><span>{currentPlan.day.toUpperCase()}</span><strong>{currentPlan.focus || "Rest / recovery"}</strong><small>{currentPlan.exercises.length} planned movements</small></div>{currentPlan.exercises.slice(0, 4).map((name) => <div className="gym-list-row" key={name}>{name}<span>↗</span></div>)}<button className="gym-inline-link" onClick={() => startSession(currentPlan.focus, currentPlan.exercises)}>Start today's plan →</button></section>
        <section className="gym-panel"><div className="gym-panel-title"><div><span className="gym-eyebrow">YOUR LOG</span><h3>Recent workouts</h3></div><button onClick={() => setTab("Stats")}>All activity →</button></div>{sessions.length ? sessions.slice(0, 4).map((session) => <div className="gym-history-row" key={session.id}><div><strong>{session.name}</strong><small>{displayDate(session.date)} · {session.exercises.length} exercises</small></div><b>{Math.round(displayLoad(sessionVolume(session), unit)).toLocaleString()} {unit}</b></div>) : <div className="gym-empty"><strong>No sessions yet</strong><p>Start your first workout to build your training history.</p></div>}</section>
      </div>
      {activeSession && <section className="gym-panel gym-resume-card"><div><span className="gym-eyebrow">WORKOUT IN PROGRESS</span><strong>{activeSession.name}</strong><small>{activeSession.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)} sets saved locally · started {new Date(activeSession.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div><button className="gym-primary" onClick={() => setTab("Start")}>Resume workout ↗</button></section>}
    </div>}

    {tab === "Plan" && <div className="gym-content">
      <div className="gym-section-intro"><span className="gym-eyebrow">TRAINING PROGRAMME</span><h2>Build your <em>plan.</em></h2><p>Create reusable routines, then arrange them into a fixed weekly timetable or a rotating training cycle.</p></div>
      <div className="gym-plan-subnav" role="tablist" aria-label="Plan tools">
        <button className={planView === "schedule" ? "active" : ""} onClick={() => setPlanView("schedule")}>▦ Schedule</button>
        <button className={planView === "routines" ? "active" : ""} onClick={() => setPlanView("routines")}>＋ Routines <small>{templates.length}</small></button>
      </div>
      {planView === "routines" && <section className="gym-panel gym-plan-editor">
        <div className="gym-panel-title"><div><span className="gym-eyebrow">ROUTINE LIBRARY</span><h3>Create a workout routine</h3></div></div>
        <div className="gym-routine-create"><input aria-label="New routine name" value={newRoutineName} onChange={(event) => setNewRoutineName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") createRoutine(); }} placeholder="e.g. Upper body, Push A, Full body"/><button className="gym-primary" onClick={createRoutine} disabled={!newRoutineName.trim()}>＋ Create routine</button></div>
        {routineDraft && <div className="gym-routine-editor">
          <div className="gym-panel-title"><div><span className="gym-eyebrow">EDITING ROUTINE</span><h3>{routineDraft.name || "New routine"}</h3></div><button className="gym-text-danger" onClick={() => { setRoutineDraft(null); setEditingRoutineId(null); }}>Cancel</button></div>
          <label>Routine name<input value={routineDraft.name} onChange={(event) => updateRoutineDraft({ name: event.target.value })} maxLength={48}/></label>
          <div className="gym-panel-title"><h3>Exercises</h3><span className="gym-count">{routineDraft.exercises.length} movements</span></div>
          {routineDraft.exercises.map((name) => <div className="gym-list-row" key={name}>{name}<button onClick={() => updateRoutineDraft({ exercises: routineDraft.exercises.filter((item) => item !== name) })} aria-label={`Remove ${name}`}>×</button></div>)}
          <label>Add exercise<select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)}>{exercises.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
          <button className="gym-secondary" onClick={() => updateRoutineDraft({ exercises: routineDraft.exercises.includes(selectedExercise) ? routineDraft.exercises : [...routineDraft.exercises, selectedExercise] })}>＋ Add exercise</button>
          <button className="gym-primary" onClick={saveRoutineDraft} disabled={!routineDraft.name.trim()}>Save routine</button>
        </div>}
        <div className="gym-routine-list">{templates.length ? templates.map((routine, index) => <article className="gym-routine-card" key={routine.id}>
          <div><span className="gym-eyebrow">ROUTINE {String(index + 1).padStart(2, "0")}</span><strong>{routine.name}</strong><small>{routine.exercises.length} exercises · {routine.exercises.slice(0, 3).join(" · ")}{routine.exercises.length > 3 ? " …" : ""}</small></div>
          <div className="gym-routine-actions"><button className="gym-icon-button" onClick={() => moveRoutine(index, -1)} disabled={index === 0} aria-label="Move routine up">↑</button><button className="gym-icon-button" onClick={() => moveRoutine(index, 1)} disabled={index === templates.length - 1} aria-label="Move routine down">↓</button><button className="gym-inline-link" onClick={() => { setRoutineDraft({ ...routine, exercises: [...routine.exercises] }); setEditingRoutineId(routine.id); }}>Edit</button><button className="gym-text-danger" onClick={() => deleteRoutine(routine.id)}>Delete</button></div>
        </article>) : <div className="gym-empty"><strong>No routines created yet</strong><p>Create your first routine above, or save an existing weekly session as a routine.</p></div>}</div>
        <div className="gym-template-tools"><label>Save selected day's workout as a routine<input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder={currentPlan.focus || "Routine name"}/></label><button className="gym-secondary" onClick={saveTemplate} disabled={!currentPlan.exercises.length}>Save current day</button></div>
      </section>}
      {planView === "schedule" && <>
        <div className="gym-plan-mode">
          <button className={planMode === "weekly" ? "active" : ""} onClick={() => setPlanMode("weekly")}><strong>Weekly schedule</strong><small>Assign a routine to each weekday</small></button>
          <button className={planMode === "rotation" ? "active" : ""} onClick={() => setPlanMode("rotation")}><strong>Rotating cycle</strong><small>Repeat routines in sequence, day by day</small></button>
        </div>
        {planMode === "weekly" ? <>
          <div className="gym-day-picker">{plan.map((item) => <button key={item.day} className={activeDay === item.day ? "active" : ""} onClick={() => setActiveDay(item.day)}><span>{item.day.slice(0, 3).toUpperCase()}</span><strong>{item.focus || "Unset"}</strong><small>{item.exercises.length ? `${item.exercises.length} exercises` : "Rest day"}</small></button>)}</div>
          <section className="gym-panel gym-plan-editor">
            <div className="gym-panel-title"><div><span className="gym-eyebrow">{activeDay.toUpperCase()}</span><h3>Schedule this day</h3></div><span className="gym-count">{currentPlan.exercises.length} movements</span></div>
            <label>Assign a saved routine<select value={templates.find((item) => item.name === currentPlan.focus && item.exercises.join("|") === currentPlan.exercises.join("|"))?.id ?? ""} onChange={(event) => { const routine = templates.find((item) => item.id === event.target.value); if (routine) applyTemplate(routine); else if (event.target.value === "rest") setPlan((current) => current.map((item) => item.day === activeDay ? { ...item, focus: "Rest", exercises: [] } : item)); }}><option value="">Custom session (edit below)</option><option value="rest">Rest day</option>{templates.map((routine) => <option key={routine.id} value={routine.id}>{routine.name}</option>)}</select></label>
            <label>Session name<input value={currentPlan.focus} onChange={(event) => updatePlanFocus(event.target.value)} placeholder="e.g. Push, Pull, Legs, Rest" maxLength={40}/></label>
            <div className="gym-panel-title"><h3>Planned exercises</h3></div>
            {currentPlan.exercises.map((name) => <div className="gym-list-row" key={name}>{name}<button onClick={() => removePlanExercise(name)} aria-label={`Remove ${name}`}>×</button></div>)}
            <label>Add a movement<select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)}>{exercises.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
            <button className="gym-secondary" onClick={() => addPlanExercise(selectedExercise)}>＋ Add movement</button>
            <button className="gym-primary" onClick={() => startSession(currentPlan.focus, currentPlan.exercises)} disabled={!currentPlan.exercises.length}>Start this workout ↗</button>
          </section>
        </> : <section className="gym-panel gym-plan-editor">
          <div className="gym-panel-title"><div><span className="gym-eyebrow">ROTATION SETTINGS</span><h3>Continuous training cycle</h3></div></div>
          <p className="gym-chart-note">The cycle advances one routine per calendar day, including rest routines. It does not reset on Monday, so a 3-day or 5-day split keeps its sequence across weeks.</p>
          <label>Cycle starts on<input type="date" value={rotationStartDate} onChange={(event) => setRotationStartDate(event.target.value)}/></label>
          <div className="gym-rotation-preview"><span className="gym-eyebrow">TODAY'S ROTATION</span><strong>{rotationRoutine?.name ?? "No routines in cycle"}</strong><small>{rotationRoutine ? `${rotationRoutine.exercises.length} exercises · Day ${rotationDays + 1} of cycle` : "Create routines in the Routines tab and arrange their order."}</small></div>
          <div className="gym-template-list"><span className="gym-eyebrow">CYCLE ORDER · USE ARROWS TO REORDER</span>{templates.map((routine, index) => <div className="gym-history-row" key={routine.id}><div><strong>{index + 1}. {routine.name}</strong><small>{routine.exercises.length} exercises</small></div><div className="gym-routine-actions"><button className="gym-icon-button" onClick={() => moveRoutine(index, -1)} disabled={index === 0} aria-label="Move routine up">↑</button><button className="gym-icon-button" onClick={() => moveRoutine(index, 1)} disabled={index === templates.length - 1} aria-label="Move routine down">↓</button></div></div>)}</div>
          {!templates.length && <button className="gym-secondary" onClick={() => setPlanView("routines")}>Create routines ↗</button>}
        </section>}
      </>}
    </div>}

    {tab === "Start" && <div className="gym-content">
      <div className="gym-section-intro"><span className="gym-eyebrow">WORKOUT MODE</span><h2>{activeSession ? activeSession.name : "Start a session."}</h2><p>{activeSession ? "Log each working set as you go. Your session is saved automatically on this device." : "Choose a session to begin tracking your sets, reps and load."}</p></div>
      {!activeSession ? <section className="gym-panel gym-start-card"><label>Session name<input value={sessionName} onChange={(event) => setSessionName(event.target.value)} placeholder="e.g. Push day"/></label><button className="gym-primary" onClick={() => startSession(sessionName || "Training session", [])}>Start session ↗</button></section> : <>
        <section className="gym-panel gym-session-toolbar"><div><span className="gym-eyebrow">SESSION IN PROGRESS</span><strong>{activeSession.exercises.reduce((n, item) => n + item.sets.length, 0)} working sets · {activeSession.exercises.length} exercises</strong></div><div className="gym-session-actions"><button className="gym-finish" onClick={finishSession} disabled={!activeSession.exercises.some((item) => item.sets.length)}>Finish workout ✓</button><button className="gym-text-danger" onClick={cancelSession}>Discard</button></div></section>
        <div className="gym-log-layout">
          <form className="gym-panel gym-set-form" onSubmit={addSet}>
            <h3>Log a working set</h3>
            <label>Exercise<select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)}>{exercises.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
            <div className="gym-form-row"><label>Reps<input type="number" min="1" max="100" step="1" value={reps} onChange={(event) => setReps(event.target.value)} required/></label><label>Load ({unit})<input type="number" min="0" max="1000" step="0.5" value={load} onChange={(event) => setLoad(event.target.value)} required/></label></div>
            <div className="gym-form-row"><label>RPE · optional<select value={rpe} onChange={(event) => setRpe(event.target.value)}><option value="">Not recorded</option>{Array.from({ length: 10 }, (_, index) => String(index + 1)).map((value) => <option key={value}>{value}</option>)}</select></label><label>RIR · optional<select value={rir} onChange={(event) => setRir(event.target.value)}><option value="">Not recorded</option>{Array.from({ length: 6 }, (_, index) => String(index)).map((value) => <option key={value}>{value}</option>)}</select></label></div>
            <button className="gym-primary" type="submit">＋ Add set</button>
          </form>
          <section className="gym-panel gym-live-log"><h3>Session log</h3>{activeSession.exercises.length ? activeSession.exercises.map((item) => <div className="gym-live-exercise" key={item.name}><strong>{item.name}</strong>{item.sets.length ? item.sets.map((set, index) => <div className="gym-set-row" key={set.id}><span>Set {index + 1}</span><b>{set.reps} reps × {displayLoad(set.load, unit).toFixed(1)} {unit}</b><small>{[set.rpe ? `RPE ${set.rpe}` : "", set.rir !== undefined ? `RIR ${set.rir}` : ""].filter(Boolean).join(" · ") || "Effort —"}</small><button className="gym-icon-button" type="button" onClick={() => removeLiveSet(item.name, set.id)} aria-label={`Remove set ${index + 1}`}>×</button></div>) : <small className="gym-planned-label">Planned · no sets logged</small>}</div>) : <div className="gym-empty"><strong>Nothing logged yet</strong><p>Add your first working set to start the session log.</p></div>}</section>
        </div>
      </>}
    </div>}

    {tab === "Stats" && <div className="gym-content">
      <div className="gym-section-intro"><span className="gym-eyebrow">YOUR TRAINING DATA</span><h2>See your <em>progress.</em></h2><p>Track strength trends, personal bests and completed sessions over time.</p></div>
      <div className="gym-kpis"><article><span>SESSIONS</span><strong>{sessions.length}</strong><small>all-time completed workouts</small></article><article><span>WORKING SETS</span><strong>{totalSets}</strong><small>all-time recorded sets</small></article><article><span>VOLUME</span><strong>{Math.round(displayLoad(totalVolume, unit)).toLocaleString()}</strong><small>{unit} × reps · sum of load × reps</small></article></div>
      <section className="gym-panel"><div className="gym-panel-title"><div><span className="gym-eyebrow">EXERCISE PROGRESSION</span><h3>Best set load over time</h3></div><select className="gym-inline-select" value={progressExercise} onChange={(event) => setProgressExercise(event.target.value)}>{exercises.map((exercise) => <option key={exercise.name}>{exercise.name}</option>)}</select></div><ProgressionChart points={progression} unit={unit}/></section>
      <section className="gym-panel"><div className="gym-panel-title"><div><span className="gym-eyebrow">PERSONAL RECORDS</span><h3>Performance bests</h3></div><span className="gym-count">{records.length} exercises</span></div>
        {records.length ? records.map((record) => <div className="gym-pr-row" key={record.exercise}><div><strong>{record.exercise}</strong><small>Heaviest set · {record.heaviestLoadDate ? displayDate(record.heaviestLoadDate) : "—"}</small></div><div className="gym-pr-values"><b>{record.heaviestLoad === null ? "—" : `${displayLoad(record.heaviestLoad, unit).toFixed(1)} ${unit}`}</b><small>{record.mostReps ?? "—"} reps · est. 1RM {record.estimatedOneRepMax === null ? "—" : `${displayLoad(record.estimatedOneRepMax, unit).toFixed(1)} ${unit}`}</small></div></div>) : <div className="gym-empty"><strong>No records yet</strong><p>Complete a workout to start building your personal records.</p></div>}
        <p className="gym-chart-note">Estimated 1RM uses Epley: load × (1 + reps ÷ 30), only for sets of 1–10 reps. It is an estimate, not a tested maximum. Rep best is the highest reps logged in one set, regardless of load.</p>
      </section>
      <section className="gym-panel"><div className="gym-panel-title"><div><span className="gym-eyebrow">SESSION HISTORY</span><h3>Completed workouts</h3></div><span className="gym-count">{sessions.length} total</span></div>
        {editingSessionId && sessionDraft && <div className="gym-session-editor">
          <div className="gym-panel-title"><h3>Edit workout</h3><button className="gym-text-danger" onClick={() => { setEditingSessionId(null); setSessionDraft(null); }}>Cancel</button></div>
          <label>Session name<input value={sessionDraft.name} onChange={(event) => setSessionDraft({ ...sessionDraft, name: event.target.value })}/></label>
          <label>Workout date<input type="date" value={sessionDraft.date} onChange={(event) => setSessionDraft({ ...sessionDraft, date: event.target.value })}/></label>
          {sessionDraft.exercises.map((exercise) => <div className="gym-editor-exercise" key={exercise.name}><strong>{exercise.name}</strong>{exercise.sets.map((set, index) => <div className="gym-editor-set" key={set.id}><span>Set {index + 1}</span><label>Reps<input type="number" min="1" max="100" value={set.reps} onChange={(event) => updateDraftSet(exercise.name, set.id, "reps", event.target.value)}/></label><label>Load ({unit})<input type="number" min="0" step="0.5" value={displayLoad(set.load, unit)} onChange={(event) => updateDraftSet(exercise.name, set.id, "load", event.target.value)}/></label><label>RPE<input type="number" min="1" max="10" value={set.rpe ?? ""} onChange={(event) => updateDraftSet(exercise.name, set.id, "rpe", event.target.value)}/></label><label>RIR<input type="number" min="0" max="5" value={set.rir ?? ""} onChange={(event) => updateDraftSet(exercise.name, set.id, "rir", event.target.value)}/></label><button className="gym-icon-button" onClick={() => removeDraftSet(exercise.name, set.id)} aria-label="Remove set">×</button></div>)}</div>)}
          <button className="gym-primary" onClick={saveSessionEdit}>Save workout changes</button>
        </div>}
        {sessions.length ? sessions.map((session) => <div className="gym-history-item" key={session.id}><div className="gym-history-row"><div><strong>{session.name}</strong><small>{displayDate(session.date)} · {session.durationMinutes} min · {session.exercises.reduce((n, item) => n + item.sets.length, 0)} sets</small></div><b>{Math.round(displayLoad(sessionVolume(session), unit)).toLocaleString()} {unit}</b></div><div className="gym-history-actions"><button className="gym-inline-link" onClick={() => openSessionEditor(session)}>Edit workout</button><button className="gym-text-danger" onClick={() => deleteSession(session.id)}>Delete</button></div></div>) : <div className="gym-empty"><strong>Your history starts with one session</strong><p>Completed workouts will appear here.</p></div>}
      </section>
    </div>}

    {tab === "Exercises" && <div className="gym-content"><div className="gym-section-intro"><span className="gym-eyebrow">EXERCISE LIBRARY</span><h2>Find a <em>movement.</em></h2><p>Search the catalogue by exercise name, muscle group or equipment.</p></div><input className="gym-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercises…"/><div className="gym-filters">{["All", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core"].map((muscle) => <button key={muscle} className={muscleFilter === muscle ? "active" : ""} onClick={() => setMuscleFilter(muscle)}>{muscle}</button>)}</div><div className="gym-exercise-grid">{filteredExercises.map((item) => <article className="gym-exercise-card" key={item.name}><span>{item.muscle.toUpperCase()}</span><strong>{item.name}</strong><small>{item.equipment}</small><button onClick={() => { setSelectedExercise(item.name); setTab(activeSession ? "Start" : "Plan"); }}>Use exercise ↗</button></article>)}</div></div>}
    <p className="gym-disclaimer">Training data stays in this browser. Loads are stored internally in kilograms and converted for display; switching units does not rewrite saved sessions. Volume is the sum of reps × load. Personal records describe logged performance only; estimated 1RM is an Epley estimate for sets of 1–10 reps, not a tested maximum.</p>
  </section>;
}
