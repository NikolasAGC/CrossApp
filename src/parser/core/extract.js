import { normalizeExerciseName } from './normalize.js';

export function extractPercent(line) {
  const match = line.match(/@\s*(\d+)%/);
  return match ? Number(match[1]) : null;
}

export function extractExercise(line) {
  const match = line.match(/\b([A-Z][A-Z\s+]+)\b/);
  if (!match) return null;

  return normalizeExerciseName(match[1]);
}
