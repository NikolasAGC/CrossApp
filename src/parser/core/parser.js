/**
 * Parser - Orquestrador de parsing
 */

import { normalizeLine } from './normalize.js';
import { classifyLine } from './classify.js';
import { extractPercent, extractExercise } from './extract.js';
import { resolveExercise } from './resolve.js';

export function parseLine({ rawLine, prs, contextExercise, plugin }) {
  const normalized = normalizeLine(rawLine);
  const type = classifyLine(normalized);
  
  let percent = extractPercent(normalized);
  let extractedExercise = extractExercise(normalized);
  
  let exercise = resolveExercise({
    extracted: extractedExercise,
    context: contextExercise,
    prs
  });

  let result = {
    raw: rawLine,
    normalized,
    type,
    percent,
    exercise,
    warning: false
  };

  if (percent && !exercise) {
    result.warning = true;
    result.message = 'Percentual sem exercício';
  }

  if (plugin?.transform) {
    result = plugin.transform(result, prs);
  }

  return result;
}
