/**
 * Plugin: Exercise Context Tracker
 * Responsável por manter o contexto do exercício atual
 * NÃO calcula cargas
 * NÃO valida PRs
 */

/**
 * Normaliza nome do exercício
 * - Remove parênteses
 * - Remove exercícios compostos (pega só o primeiro)
 */
function normalizeExerciseName(name) {
  if (!name || typeof name !== 'string') return null;

  return name
    .replace(/\(.*?\)/g, '')   // remove parênteses
    .split('+')[0]             // pega só o primeiro exercício
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Verifica se linha define um exercício
 */
function isExerciseDefinition(line) {
  if (!line) return false;

  const text = line.trim();

  if (text.length === 0) return false;

  // ignora REST e percentuais
  if (/^REST/i.test(text)) return false;
  if (/@\s*\d+%/.test(text)) return false;

  // pelo menos uma palavra em CAPS
  return /[A-Z]{3,}/.test(text);
}

/**
 * Extrai exercício de uma linha
 */
function extractExerciseFromLine(line) {
  if (!line) return null;

  const match = line.match(/\b([A-Z][A-Z\s()+-]+)\b/);

  if (!match) return null;

  return normalizeExerciseName(match[0]);
}

/**
 * Mantém contexto de exercício entre linhas
 *
 * @param {string[]} lines
 * @returns {Array<{ line, contextExercise, hasPercent }>}
 */
export function trackExerciseContext(lines) {
  if (!Array.isArray(lines)) return [];

  let currentExercise = null;

  return lines.map(rawLine => {
    const line = String(rawLine);

    if (isExerciseDefinition(line)) {
      const found = extractExerciseFromLine(line);
      if (found) {
        currentExercise = found;
      }
    }

    return {
      line,
      contextExercise: currentExercise,
      hasPercent: /@\s*\d+%/.test(line)
    };
  });
}
