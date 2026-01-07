import { calculateLoad, formatLoadResult } from '../core/services/loadCalculator.js';
import { extractPercent } from './percent-parser.js';
import { trackExerciseContext } from './exercise-context-tracker.js';

export function calculateWorkoutLoads(lines, prs, preferences = {}) {
  const contextualized = trackExerciseContext(lines);

  return contextualized.map(ctx => {
    const { line, contextExercise } = ctx;

    const percent = extractPercent(line);

    if (!percent) {
      return {
        originalLine: line,
        hasPercent: false,
        exercise: contextExercise || null
      };
    }

    const result = calculateLoad(
      contextExercise,
      percent,
      prs,
      preferences
    );

    return {
      originalLine: line,
      hasPercent: true,
      exercise: contextExercise,
      percent,
      calculatedText: result.success
        ? formatLoadResult(result)
        : null,
      ...result
    };
  });
}

export function hasWarnings(results) {
  return results.some(r => r.warning);
}

export function getMissingPRsFromResults(results) {
  const set = new Set();

  results.forEach(r => {
    if (r.missingPR) set.add(r.missingPR);
  });

  return [...set];
}
