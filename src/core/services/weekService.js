/**
 * Week Service
 * Gerenciamento de múltiplas semanas (preparado para futuro)
 */

import { isValidWeek } from '../utils/validators.js';

/**
 * Cria objeto de semana
 * @param {number} weekNumber - Número da semana (1-52)
 * @param {string} pdfText - Texto do PDF dessa semana
 * @param {Object} metadata - Metadados (opcional)
 * @returns {Object} Objeto de semana
 */
export function createWeek(weekNumber, pdfText, metadata = {}) {
  if (!isValidWeek(weekNumber)) {
    throw new Error('Número de semana inválido (1-52)');
  }
  
  return {
    week: weekNumber,
    pdfText: pdfText || null,
    uploadedAt: new Date().toISOString(),
    ...metadata,
  };
}

/**
 * Adiciona semana à coleção
 * @param {Array} weeks - Array de semanas
 * @param {Object} newWeek - Nova semana
 * @returns {Array} Nova array de semanas (imutável)
 */
export function addWeek(weeks, newWeek) {
  if (!Array.isArray(weeks)) {
    weeks = [];
  }
  
  // Remove semana existente com mesmo número
  const filtered = weeks.filter(w => w.week !== newWeek.week);
  
  return [...filtered, newWeek].sort((a, b) => a.week - b.week);
}

/**
 * Remove semana da coleção
 * @param {Array} weeks - Array de semanas
 * @param {number} weekNumber - Número da semana
 * @returns {Array} Nova array de semanas (imutável)
 */
export function removeWeek(weeks, weekNumber) {
  if (!Array.isArray(weeks)) return [];
  return weeks.filter(w => w.week !== weekNumber);
}

/**
 * Busca semana por número
 * @param {Array} weeks - Array de semanas
 * @param {number} weekNumber - Número da semana
 * @returns {Object|null} Semana ou null se não encontrada
 */
export function getWeek(weeks, weekNumber) {
  if (!Array.isArray(weeks)) return null;
  return weeks.find(w => w.week === weekNumber) || null;
}

/**
 * Verifica se semana existe
 * @param {Array} weeks - Array de semanas
 * @param {number} weekNumber - Número da semana
 * @returns {boolean}
 */
export function hasWeek(weeks, weekNumber) {
  return getWeek(weeks, weekNumber) !== null;
}

/**
 * Retorna próxima semana disponível
 * @param {Array} weeks - Array de semanas
 * @returns {number} Número da próxima semana (1 se vazio)
 */
export function getNextWeekNumber(weeks) {
  if (!Array.isArray(weeks) || weeks.length === 0) {
    return 1;
  }
  
  const max = Math.max(...weeks.map(w => w.week));
  return max + 1 <= 52 ? max + 1 : 1;
}

/**
 * Retorna semana atual baseado em data
 * @param {Date} date - Data de referência
 * @returns {number} Número da semana (1-52)
 */
export function getCurrentWeekNumber(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

/**
 * Lista todas as semanas disponíveis
 * @param {Array} weeks - Array de semanas
 * @returns {number[]} Array de números de semanas (ordenado)
 */
export function listWeeks(weeks) {
  if (!Array.isArray(weeks)) return [];
  return weeks.map(w => w.week).sort((a, b) => a - b);
}

/**
 * Conta quantas semanas estão cadastradas
 * @param {Array} weeks - Array de semanas
 * @returns {number} Quantidade de semanas
 */
export function countWeeks(weeks) {
  return Array.isArray(weeks) ? weeks.length : 0;
}

/**
 * Valida array de semanas
 * @param {*} weeks - Dados para validar
 * @returns {boolean}
 */
export function isValidWeeksArray(weeks) {
  if (!Array.isArray(weeks)) return false;
  
  return weeks.every(w => {
    return (
      w &&
      typeof w === 'object' &&
      isValidWeek(w.week) &&
      typeof w.pdfText === 'string'
    );
  });
}

/**
 * Exporta semanas para JSON
 * @param {Array} weeks - Array de semanas
 * @returns {string} JSON formatado
 */
export function exportWeeksToJSON(weeks) {
  return JSON.stringify(weeks, null, 2);
}

/**
 * Importa semanas de JSON
 * @param {string} jsonString - String JSON
 * @returns {Array} Array de semanas validado
 * @throws {Error} Se JSON inválido
 */
export function importWeeksFromJSON(jsonString) {
  let parsed;
  
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw new Error('JSON inválido: ' + error.message);
  }
  
  if (!isValidWeeksArray(parsed)) {
    throw new Error('Formato de semanas inválido no JSON');
  }
  
  return parsed;
}
