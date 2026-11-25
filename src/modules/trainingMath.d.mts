export interface TrainingSet { id: string; reps: number; load: number; rpe?: number; rir?: number }
export interface TrainingSession { id: string; date: string; name: string; startedAt: string; durationMinutes: number; exercises: Array<{ name: string; sets: TrainingSet[] }> }
export interface ExerciseProgressPoint { date: string; bestLoad: number; volume: number; setCount: number }
export interface PersonalRecord { exercise: string; heaviestLoad: number | null; heaviestLoadDate: string | null; mostReps: number | null; mostRepsDate: string | null; estimatedOneRepMax: number | null; estimatedOneRepMaxDate: string | null }
export function sessionVolume(session: TrainingSession): number;
export function countSessionsInRange(sessions: TrainingSession[], startDate: string, endDate: string): number;
export function estimateOneRepMax(load: number, reps: number): number | null;
export function getPersonalRecords(sessions: TrainingSession[]): PersonalRecord[];
export function getExerciseProgression(sessions: TrainingSession[], exerciseName: string): ExerciseProgressPoint[];
export function getWeekBounds(date?: Date): { start: string; end: string };
