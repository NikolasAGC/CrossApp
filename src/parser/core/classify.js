export function classifyLine(line) {
  if (!line) return 'EMPTY';

  if (/@\s*\d+%/.test(line)) return 'PERCENT';

  if (/REST|DESCANSO|A CADA/i.test(line)) return 'REST';

  if (/[A-Z]{3,}/.test(line)) return 'EXERCISE';

  return 'TEXT';
}
