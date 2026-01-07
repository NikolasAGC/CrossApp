export function normalizeLine(line) {
  if (!line || typeof line !== 'string') return '';

  return line
    .toUpperCase()
    .replace(/\(.*?\)/g, '')     // remove (qualquer coisa)
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeExerciseName(name) {
  if (!name) return null;

  return name
    .split('+')[0]               // pega só o primeiro exercício
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
