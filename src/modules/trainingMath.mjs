/**
 * Pure training calculations. Stored loads are always kilograms.
 * Estimated 1RM uses the Epley formula only for sets of 1–10 reps.
 */
export function sessionVolume(session) {
  return (session.exercises ?? []).reduce(
    (total, exercise) => total + (exercise.sets ?? []).reduce((sum, set) => sum + set.reps * set.load, 0),
    0
  );
}

export function countSessionsInRange(sessions, startDate, endDate) {
  return sessions.filter((session) => session.date >= startDate && session.date <= endDate).length;
}

export function estimateOneRepMax(load, reps) {
  if (!Number.isFinite(load) || !Number.isFinite(reps) || load <= 0 || reps < 1 || reps > 10) return null;
  return load * (1 + reps / 30);
}

export function getPersonalRecords(sessions) {
  const records = new Map();
  for (const session of sessions) {
    for (const exercise of session.exercises ?? []) {
      const record = records.get(exercise.name) ?? {
        exercise: exercise.name,
        heaviestLoad: null,
        heaviestLoadDate: null,
        mostReps: null,
        mostRepsDate: null,
        estimatedOneRepMax: null,
        estimatedOneRepMaxDate: null,
      };
      for (const set of exercise.sets ?? []) {
        if (set.load > 0 && (record.heaviestLoad === null || set.load > record.heaviestLoad)) {
          record.heaviestLoad = set.load;
          record.heaviestLoadDate = session.date;
        }
        if (set.reps > 0 && (record.mostReps === null || set.reps > record.mostReps)) {
          record.mostReps = set.reps;
          record.mostRepsDate = session.date;
        }
        const estimate = estimateOneRepMax(set.load, set.reps);
        if (estimate !== null && (record.estimatedOneRepMax === null || estimate > record.estimatedOneRepMax)) {
          record.estimatedOneRepMax = estimate;
          record.estimatedOneRepMaxDate = session.date;
        }
      }
      records.set(exercise.name, record);
    }
  }
  return [...records.values()].sort((a, b) => (b.heaviestLoad ?? 0) - (a.heaviestLoad ?? 0));
}

export function getExerciseProgression(sessions, exerciseName) {
  return sessions
    .filter((session) => (session.exercises ?? []).some((exercise) => exercise.name === exerciseName))
    .map((session) => {
      const exercise = session.exercises.find((item) => item.name === exerciseName);
      const sets = exercise?.sets ?? [];
      return {
        date: session.date,
        bestLoad: sets.reduce((best, set) => Math.max(best, set.load), 0),
        volume: sets.reduce((sum, set) => sum + set.reps * set.load, 0),
        setCount: sets.length,
      };
    })
    .filter((point) => point.setCount > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getWeekBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const format = (value) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  return { start: format(start), end: format(end) };
}
