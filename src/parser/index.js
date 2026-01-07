import generic from './plugins/generic.plugin.js';
import crossfit from './plugins/crossfit.plugin.js';
import weightlifting from './plugins/weightlifting.plugin.js';
import bodybuilding from './plugins/bodybuilding.plugin.js';

const PLUGINS = [
  weightlifting,
  crossfit,
  bodybuilding,
  generic // fallback
];

function normalizeInput(input) {
  // ✅ string crua
  if (typeof input === 'string') {
    return input
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
  }

  // ✅ array de linhas
  if (Array.isArray(input)) {
    return input
      .map(l => {
        if (typeof l === 'string') return l.trim();
        if (l?.raw) return String(l.raw).trim();
        return String(l).trim();
      })
      .filter(Boolean);
  }

  // ✅ objeto com raw
  if (input?.raw) {
    return String(input.raw)
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
  }

  console.warn('⚠️ Parser recebeu input inesperado:', input);
  return [];
}

export function parseWorkout(input) {
  const lines = normalizeInput(input);

  return lines.map(line => {
    for (const plugin of PLUGINS) {
      if (plugin.match(line)) {
        return plugin.parse(line);
      }
    }

    return { line, exercise: null, percent: null };
  });
}
