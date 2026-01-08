/**
 * Workout Load Processor - Integrado com Parser e LoadCalculator
 */

import { parseWorkout } from '../parser/index.js';
import { calculateLoad, formatLoadResult } from '../core/services/loadCalculator.js';
import { extractLbsToKg } from '../parser/core/extract.js';

export function calculateWorkoutLoads(lines, prs, preferences = {}) {
  const parsed = parseWorkout(lines);
  
  const calcOptions = {
    round: preferences.round !== false,
    roundStep: preferences.roundStep || 2.5,
    includeLbs: preferences.includeLbs || false
  };
  
  let currentExercise = null;
  
  return parsed.map((parsedLine, index) => {
    // Conversão lbs
    const lbsValue = extractLbsToKg(parsedLine.line);
    if (lbsValue) {
      return {
        originalLine: parsedLine.line,
        hasPercent: false,
        exercise: currentExercise,
        plugin: parsedLine.plugin,
        calculatedText: `→ ${lbsValue}kg`,
        load: lbsValue,
        unit: 'kg',
        isWarning: false,
        convertedFromLbs: true
      };
    }
    
    // Atualiza contexto
    if (parsedLine.exercise) {
      currentExercise = parsedLine.exercise;
    }
    
    const exercise = parsedLine.exercise || currentExercise;
    const percent = parsedLine.percent;
    
    // ✅ DEBUG: Log linhas problemáticas
    if (parsedLine.line.includes('@') && parsedLine.line.includes('%') && !percent) {
      console.error('🐛 Percentual não detectado:', {
        line: parsedLine.line,
        parsedPercent: parsedLine.percent,
        exercise: exercise,
        plugin: parsedLine.plugin
      });
    }
    
    // Linha sem percentual
    if (!percent) {
      return {
        originalLine: parsedLine.line,
        hasPercent: false,
        exercise: exercise,
        plugin: parsedLine.plugin
      };
    }
    
    // Calcula carga
    const result = calculateLoad(exercise, percent, prs, calcOptions);
    
    return {
      originalLine: parsedLine.line,
      hasPercent: true,
      exercise: exercise,
      percent: percent,
      calculatedText: result.success ? formatLoadResult(result) : null,
      plugin: parsedLine.plugin,
      isWarning: result.warning,
      ...result
    };
  });
}

export function hasWarnings(results) {
  return results.some(r => r.warning || r.isWarning);
}

export function getMissingPRsFromResults(results) {
  const set = new Set();
  results.forEach(r => {
    if (r.missingPR) set.add(r.missingPR);
  });
  return [...set];
}
