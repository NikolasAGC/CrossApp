import {
  calculatePercent,
  kgToLbs,
  roundToNearest,
  formatNumber
} from '../utils/math.js';

import { isValidPercent } from '../utils/validators.js';
import { getPR } from './prsService.js';
import { trackExerciseContext, resolveExerciseWithContext } from '../../plugins/exercise-context-tracker.js'; // ✅ ADICIONAR ESTA LINHA

export function calculateLoad(exercise, percent, prs, options = {}) {
  const opts = {
    round: true,
    roundStep: 2.5,
    includeLbs: false,
    ...options
  };

  if (!exercise || !isValidPercent(percent)) {
    return { success: false };
  }

  const pr = getPR(prs, exercise);
  if (pr == null) {
    return {
      success: false,
      warning: true,
      missingPR: exercise
    };
  }

  let load = calculatePercent(pr, percent);
  if (opts.round) {
    load = roundToNearest(load, opts.roundStep);
  }

  const result = {
    success: true,
    exercise,
    percent,
    load,
    loadFormatted: `${formatNumber(load, 1)}kg`
  };

  if (opts.includeLbs) {
    const lbs = roundToNearest(kgToLbs(load), 5);
    result.lbsFormatted = `${formatNumber(lbs, 0)}lbs`;
  }

  return result;
}

<<<<<<< HEAD
export function formatLoadResult(result) {
  if (!result?.success) return '';
  return `→ ${result.loadFormatted}${result.lbsFormatted ? ` (${result.lbsFormatted})` : ''}`;
=======
/**
 * Extrai percentual de uma linha de treino
 * @param {string} line - Linha do treino (ex: "3x5 @80%")
 * @returns {number|null} Percentual ou null se não encontrado
 */
export function extractPercent(line) {
  // ✅ Aceita espaço opcional entre @ e número
  const match = line.match(/@\s*(\d+)%/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extrai nome de exercício de uma linha
 * @param {string} line - Linha do treino
 * @param {Object} prs - PRs cadastrados (para validar)
 * @returns {string|null} Nome do exercício ou null
 */
export function extractExerciseName(line, prs) {
  // Busca padrão de exercício em maiúsculas (ex: "BACK SQUAT")
  const matches = line.match(/\b([A-Z][A-Z\s]+)\b/g);
  
  if (!matches) return null;
  
  // Retorna primeiro exercício que tem PR cadastrado
  for (const match of matches) {
    const normalized = normalizeExerciseName(match);
    if (getPR(prs, normalized) !== null) {
      return normalized;
    }
  }
  
  // Se nenhum tem PR, retorna o primeiro encontrado
  return normalizeExerciseName(matches[0]);
}

/**
 * Processa linha completa de exercício
 * @param {string} line - Linha do treino (ex: "BACK SQUAT 3x5 @80%")
 * @param {Object} prs - Objeto de PRs
 * @param {Object} preferences - Preferências do usuário
 * @param {string|null} lastExercise - Último exercício identificado (contexto)
 * @returns {Object} Resultado do processamento
 */
export function processExerciseLine(line, prs, preferences = {}, lastExercise = null) {
  const percent = extractPercent(line);
  
  if (!percent) {
    // Linha sem porcentagem - pode ser definição de exercício
    const exerciseName = extractExerciseName(line, prs);
    
    return {
      hasPercent: false,
      originalLine: line,
      exercise: exerciseName,
    };
  }
  
  // ✅ USA PLUGIN PARA RESOLVER EXERCÍCIO COM CONTEXTO
  const exerciseName = resolveExerciseWithContext(line, lastExercise, prs);
  
  if (!exerciseName) {
    return {
      hasPercent: true,
      warning: true,
      message: 'Exercício não identificado',
      originalLine: line,
    };
  }
  
  const calculation = calculateLoad(exerciseName, percent, prs, {
    includeLbs: preferences.showLbsConversion || false,
  });
  
  return {
    hasPercent: true,
    originalLine: line,
    exercise: exerciseName,
    percent: percent,
    calculatedText: calculation.success ? formatLoadResult(calculation) : null,
    isWarning: calculation.warning || false,
    ...calculation,
  };
}

/**
 * Formata resultado de cálculo para exibição
 * @param {Object} result - Resultado de calculateLoad
 * @returns {string} Texto formatado (ex: "→ 80kg (176lbs)")
 */
export function formatLoadResult(result) {
  if (!result.success) {
    return result.message || 'Erro ao calcular';
  }
  
  let text = `→ ${result.loadFormatted}`;
  
  if (result.lbsFormatted) {
    text += ` (${result.lbsFormatted})`;
  }
  
  return text;
}

/**
 * Calcula todas as cargas de um treino
 * @param {Array} workoutLines - Linhas do treino
 * @param {Object} prs - PRs cadastrados
 * @param {Object} preferences - Preferências
 * @returns {Array} Array com resultados de cada linha
 */
export function calculateWorkoutLoads(workoutLines, prs, preferences = {}) {
  // ✅ USA PLUGIN PARA RASTREAR CONTEXTO
  const linesWithContext = trackExerciseContext(workoutLines, prs);
  
  return linesWithContext.map(({ line, contextExercise }) => {
    return processExerciseLine(line, prs, preferences, contextExercise);
  });
}

/**
 * Verifica se treino tem avisos (PRs faltantes)
 * @param {Array} results - Resultados de calculateWorkoutLoads
 * @returns {boolean}
 */
export function hasWarnings(results) {
  return results.some(r => r.warning === true);
}

/**
 * Retorna lista de PRs faltantes em um treino
 * @param {Array} results - Resultados de calculateWorkoutLoads
 * @returns {string[]} Exercícios sem PR (únicos)
 */
export function getMissingPRsFromResults(results) {
  const missing = new Set();
  
  results.forEach(r => {
    if (r.missingPR) {
      missing.add(r.missingPR);
    }
  });
  
  return Array.from(missing);
}

/**
 * Converte lbs para kg em uma linha de treino
 * @param {string} line - Linha com lbs (ex: "100lbs")
 * @returns {Object} { kg, formatted }
 */
export function convertLbsInLine(line) {
  const lbsMatch = line.match(/(\d+(?:\.\d+)?)\s*lbs?/i);
  
  if (!lbsMatch) {
    return { found: false, original: line };
  }
  
  const lbs = parseFloat(lbsMatch[1]);
  const kg = lbs / 2.20462;
  const rounded = roundToNearest(kg, 2.5);
  
  return {
    found: true,
    original: line,
    lbs: lbs,
    kg: rounded,
    formatted: `${formatNumber(rounded, 1)}kg`,
  };
>>>>>>> 0a5de7ea3a23396515c46e7128900d80ffc3ec9a
}
