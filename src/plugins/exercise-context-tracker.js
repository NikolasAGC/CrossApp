/**
 * Remove variações do nome do exercício
 */
function normalizeExerciseName(name) {
  if (!name || typeof name !== 'string') return null;

  return name
    .replace(/\(.*?\)/g, '') // remove tudo entre parênteses
    .split('+')[0]           // pega só o primeiro exercício
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Detecta se a linha define um exercício
 */
function isExerciseLine(line) {
  if (!line || typeof line !== 'string') return false;

  const text = line.trim();
  if (!text) return false;

  // ignora linhas de séries / percentuais
  if (/^\d+\s*[@x]/.test(text)) return false;
  if (/@\s*\d+%/.test(text)) return false;
  if (/^(REST|A\s+CADA)/i.test(text)) return false;

  // exige letras maiúsculas contínuas (exercício)
  return /[A-Z]{3,}/.test(text);
}

/**
 * Extrai o nome do exercício
 */
function extractExerciseName(line) {
  if (!line || typeof line !== 'string') return null;

  const cleaned = line
    .replace(/REST.*/i, '')
    .replace(/@\s*\d+%/g, '')
    .trim();

  // 🚫 NÃO aceita parênteses
  const match = cleaned.match(/\b([A-Z][A-Z\s]+)\b/);
  if (!match) return null;

  return normalizeExerciseName(match[1]);
}

/**
 * Context tracker
 */
export function trackExerciseContext(lines) {
  let currentExercise = null;

  return lines.map(raw => {
    const line = String(raw);

    if (isExerciseLine(line)) {
      const ex = extractExerciseName(line);
      if (ex) currentExercise = ex;

      return {
        line,
        contextExercise: currentExercise,
        isExerciseDefinition: true,
        isPercentLine: false
      };
    }

    return {
      line,
      contextExercise: currentExercise,
      isExerciseDefinition: false,
      isPercentLine: /@\s*\d+%/.test(line)
    };
  });
}
