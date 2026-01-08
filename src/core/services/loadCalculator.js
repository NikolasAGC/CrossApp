/**
 * Load Calculator Service
 * Responsabilidade: calcular carga a partir de PR + percentual
 */

import { normalizeExerciseName } from '../../parser/core/normalize.js';

/**
 * Calcula carga para um exercício dado percentual e PRs
 * @param {string} exerciseName - Nome do exercício (pode vir cru do parser)
 * @param {number} percent - Percentual (0–100)
 * @param {Object} prs - Mapa de PRs por exercício normalizado
 * @param {Object} options - Opções de arredondamento
 * @returns {Object} Resultado com sucesso, load, unit, warning, missingPR
 */
export function calculateLoad(exerciseName, percent, prs, options = {}) {
  const round = options.round !== false;
  const roundStep = options.roundStep || 2.5;

  if (!exerciseName || !percent) {
    return {
      success: false,
      warning: true,
      reason: 'missing-data',
    };
  }

  // ✅ Normaliza exercício (FRONT SQUATS + HURDLE JUMP → FRONT SQUAT)
  const normalized = normalizeExerciseName(exerciseName);

  const pr = prs[normalized];

  if (!pr) {
    return {
      success: false,
      warning: true,
      reason: 'missing-pr',
      missingPR: normalized,
    };
  }

  const rawLoad = (pr * percent) / 100;
  const load = round ? roundToStep(rawLoad, roundStep) : rawLoad;

  return {
    success: true,
    warning: false,
    exercise: normalized,
    rawLoad,
    load,
    unit: 'kg',
  };
}

function roundToStep(value, step) {
  const factor = 1 / step;
  return Math.round(value * factor) / factor;
}

/**
 * Formata resultado num texto amigável
 */
export function formatLoadResult(result) {
  if (!result || !result.success) return null;
  const value = Number(result.load.toFixed(1));
  return `→ ${value}kg`;
}
