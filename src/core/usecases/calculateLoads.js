/**
 * Use-case: Calcular cargas de um treino
 * Recebe treino JÁ PARSEADO
 */
import {
  calculateWorkoutLoads,
  hasWarnings,
  getMissingPRsFromResults
} from '../../plugins/workoutLoadProcessor.js';
import { isValidWorkout } from '../services/workoutService.js';

export function calculateLoads(workout, prs, preferences = {}) {
  if (!isValidWorkout(workout)) {
    return {
      success: false,
      error: 'Treino inválido',
      data: []
    };
  }

  if (!prs || typeof prs !== 'object') {
    return {
      success: false,
      error: 'PRs inválidos',
      data: []
    };
  }

  // 🔥 AQUI ESTAVA O ERRO ANTES
  // NÃO parseia nada aqui

  const allLines = workout.sections.flatMap(
    section => section.lines || []
  );

  const results = calculateWorkoutLoads(allLines, prs, preferences);

  return {
    success: true,
    data: results,
    hasWarnings: hasWarnings(results),
    missingPRs: getMissingPRsFromResults(results),
    totalLines: results.length,
    linesWithPercent: results.filter(r => r.hasPercent).length
  };
}
