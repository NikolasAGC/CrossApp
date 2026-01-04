/**
 * Use-case: Obter treino do dia atual
 * Orquestra parsing + filtro por dia
 */

import { parseWorkoutText, getWorkoutByDay } from '../services/workoutService.js';
import { getDayName } from '../utils/date.js';
import { isValidDayName } from '../utils/validators.js';

/**
 * Retorna treino do dia atual
 * @param {string} pdfText - Texto do PDF
 * @param {Date} date - Data de referência (default: hoje)
 * @returns {Object} Resultado com treino ou erro
 */
export function getWorkoutOfDay(pdfText, date = new Date()) {
  // Validações
  if (!pdfText || typeof pdfText !== 'string') {
    return {
      success: false,
      error: 'PDF vazio ou inválido',
      data: null,
    };
  }
  
  if (pdfText.trim().length < 50) {
    return {
      success: false,
      error: 'PDF muito pequeno (texto insuficiente)',
      data: null,
    };
  }
  
  // Obtém dia atual
  const dayName = getDayName(date);
  
  if (!isValidDayName(dayName)) {
    return {
      success: false,
      error: 'Dia da semana inválido',
      data: null,
    };
  }
  
  try {
    // Parse do PDF completo
    const allWorkouts = parseWorkoutText(pdfText);
    
    if (!allWorkouts || allWorkouts.length === 0) {
      return {
        success: false,
        error: 'Nenhum treino encontrado no PDF',
        data: null,
      };
    }
    
    // Filtra por dia
    const todayWorkout = getWorkoutByDay(allWorkouts, dayName);
    
    if (!todayWorkout) {
      return {
        success: true,
        warning: `Nenhum treino encontrado para ${dayName}`,
        data: null,
        dayName: dayName,
      };
    }
    
    return {
      success: true,
      data: todayWorkout,
      dayName: dayName,
      allWorkouts: allWorkouts, // Útil para debug
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao processar PDF: ' + error.message,
      data: null,
    };
  }
}

/**
 * Retorna treino de um dia específico
 * @param {string} pdfText - Texto do PDF
 * @param {string} dayName - Nome do dia (Segunda, Terça, etc)
 * @returns {Object} Resultado
 */
export function getWorkoutByDayName(pdfText, dayName) {
  if (!isValidDayName(dayName)) {
    return {
      success: false,
      error: 'Nome do dia inválido',
      data: null,
    };
  }
  
  try {
    const allWorkouts = parseWorkoutText(pdfText);
    const workout = getWorkoutByDay(allWorkouts, dayName);
    
    return {
      success: true,
      data: workout,
      dayName: dayName,
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

/**
 * Retorna todos os treinos da semana
 * @param {string} pdfText - Texto do PDF
 * @returns {Object} Resultado com todos os treinos
 */
export function getAllWorkouts(pdfText) {
  if (!pdfText || typeof pdfText !== 'string') {
    return {
      success: false,
      error: 'PDF inválido',
      data: [],
    };
  }
  
  try {
    const workouts = parseWorkoutText(pdfText);
    
    return {
      success: true,
      data: workouts,
      count: workouts.length,
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
}