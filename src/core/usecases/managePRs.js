/**
 * Use-case: Gerenciar PRs
 * Wrapper dos métodos do prsService com validação
 */

import * as prsService from '../services/prsService.js';

/**
 * Adiciona ou atualiza PR
 * @param {Object} currentPRs - PRs atuais
 * @param {string} exerciseName - Nome do exercício
 * @param {number} load - Carga máxima
 * @returns {Object} Resultado
 */
export function addOrUpdatePR(currentPRs, exerciseName, load) {
  try {
    const newPRs = prsService.setPR(currentPRs, exerciseName, load);
    
    return {
      success: true,
      data: newPRs,
      exercise: exerciseName,
      load: load,
      isNew: !prsService.hasPR(currentPRs, exerciseName),
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: currentPRs,
    };
  }
}

/**
 * Remove PR
 * @param {Object} currentPRs - PRs atuais
 * @param {string} exerciseName - Nome do exercício
 * @returns {Object} Resultado
 */
export function removePR(currentPRs, exerciseName) {
  try {
    const newPRs = prsService.removePR(currentPRs, exerciseName);
    
    return {
      success: true,
      data: newPRs,
      exercise: exerciseName,
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: currentPRs,
    };
  }
}

/**
 * Busca PR de um exercício
 * @param {Object} prs - PRs cadastrados
 * @param {string} exerciseName - Nome do exercício
 * @returns {Object} Resultado
 */
export function findPR(prs, exerciseName) {
  const pr = prsService.getPR(prs, exerciseName);
  
  if (pr === null) {
    return {
      success: false,
      error: `PR não encontrado para ${exerciseName}`,
      data: null,
    };
  }
  
  return {
    success: true,
    data: pr,
    exercise: exerciseName,
  };
}

/**
 * Lista todos os PRs cadastrados
 * @param {Object} prs - PRs
 * @returns {Object} Resultado com lista
 */
export function listAllPRs(prs) {
  const exercises = prsService.listExercises(prs);
  const count = prsService.countPRs(prs);
  
  return {
    success: true,
    data: exercises.map(ex => ({
      exercise: ex,
      pr: prs[ex],
    })),
    count: count,
  };
}

/**
 * Reseta todos os PRs
 * @returns {Object} Resultado com PRs vazios
 */
export function resetAllPRs() {
  return {
    success: true,
    data: prsService.createEmptyPRs(),
  };
}

/**
 * Cria PRs padrão (exercícios básicos)
 * @returns {Object} Resultado com PRs padrão
 */
export function createDefaultPRs() {
  return {
    success: true,
    data: prsService.createDefaultPRs(),
  };
}
