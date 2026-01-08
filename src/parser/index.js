/**
 * Parser Index - API de Parsing
 * Responsabilidade: Exportar função de parsing com plugins
 */

import generic from './plugins/generic.plugin.js';
import crossfit from './plugins/crossfit.plugin.js';
import weightlifting from './plugins/weightlifting.plugin.js';
import bodybuilding from './plugins/bodybuilding.plugin.js';

const PLUGINS = [
  weightlifting,
  crossfit,
  bodybuilding,
  generic
];

function normalizeInput(input) {
  if (typeof input === 'string') {
    return input
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
  }
  
  if (Array.isArray(input)) {
    return input
      .map(l => {
        if (typeof l === 'string') return l.trim();
        if (l?.raw) return String(l.raw).trim();
        return String(l).trim();
      })
      .filter(Boolean);
  }
  
  if (input?.raw) {
    return String(input.raw)
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
  }
  
  console.warn('⚠️ Parser recebeu input inesperado:', input);
  return [];
}

/**
 * Parseia treino usando plugins especializados
 * @param {string|Array} input - Texto do treino
 * @returns {Array} Linhas parseadas com { line, exercise, percent, plugin }
 */
export function parseWorkout(input) {
  const lines = normalizeInput(input);
  
  return lines.map(line => {
    for (const plugin of PLUGINS) {
      if (plugin.match(line)) {
        return plugin.parse(line);
      }
    }
    return { line, exercise: null, percent: null, plugin: 'none' };
  });
}
