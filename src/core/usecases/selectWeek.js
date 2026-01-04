/**
 * Use-case: Selecionar semana
 * Troca semana ativa (preparado para futuro)
 */

import { getWeek, hasWeek } from '../services/weekService.js';
import { isValidWeek } from '../utils/validators.js';

/**
 * Seleciona semana ativa
 * @param {Array} weeks - Array de semanas disponíveis
 * @param {number} weekNumber - Número da semana
 * @returns {Object} Resultado
 */
export function selectWeek(weeks, weekNumber) {
  if (!isValidWeek(weekNumber)) {
    return {
      success: false,
      error: 'Número de semana inválido (1-52)',
      data: null,
    };
  }
  
  if (!hasWeek(weeks, weekNumber)) {
    return {
      success: false,
      error: `Semana ${weekNumber} não encontrada`,
      data: null,
    };
  }
  
  const week = getWeek(weeks, weekNumber);
  
  return {
    success: true,
    data: week,
    weekNumber: weekNumber,
  };
}

/**
 * Retorna primeira semana disponível
 * @param {Array} weeks - Array de semanas
 * @returns {Object} Resultado
 */
export function selectFirstWeek(weeks) {
  if (!Array.isArray(weeks) || weeks.length === 0) {
    return {
      success: false,
      error: 'Nenhuma semana disponível',
      data: null,
    };
  }
  
  const sorted = [...weeks].sort((a, b) => a.week - b.week);
  
  return {
    success: true,
    data: sorted[0],
    weekNumber: sorted[0].week,
  };
}

/**
 * Retorna última semana disponível
 * @param {Array} weeks - Array de semanas
 * @returns {Object} Resultado
 */
export function selectLastWeek(weeks) {
  if (!Array.isArray(weeks) || weeks.length === 0) {
    return {
      success: false,
      error: 'Nenhuma semana disponível',
      data: null,
    };
  }
  
  const sorted = [...weeks].sort((a, b) => b.week - a.week);
  
  return {
    success: true,
    data: sorted[0],
    weekNumber: sorted[0].week,
  };
}
