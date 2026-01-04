/**
 * Use-case: Copiar treino formatado
 * Gera texto formatado para clipboard
 */

import { processExerciseLine, formatLoadResult } from '../services/loadCalculator.js';
import { isValidWorkout } from '../services/workoutService.js';
import { getFullDayDescription } from '../utils/date.js';

/**
 * Gera texto formatado do treino para copiar
 * @param {Object} workout - Treino
 * @param {Object} prs - PRs cadastrados
 * @param {Object} preferences - Preferências
 * @param {Object} options - Opções de formatação
 * @returns {Object} Resultado com texto
 */
export function copyWorkout(workout, prs, preferences = {}, options = {}) {
  const defaults = {
    includeHeader: true,
    includeDate: true,
    includeEmoji: preferences.showEmojis !== false,
    skipWarnings: false, // Se true, omite linhas com warning
  };
  
  const opts = { ...defaults, ...options };
  
  // Validações
  if (!isValidWorkout(workout)) {
    return {
      success: false,
      error: 'Treino inválido',
      text: '',
    };
  }
  
  try {
    let text = '';
    
    // Cabeçalho
    if (opts.includeHeader) {
      const emoji = opts.includeEmoji ? '💪 ' : '';
      text += `${emoji}TREINO - ${workout.day.toUpperCase()}\n`;
      
      if (opts.includeDate) {
        text += `${getFullDayDescription()}\n`;
      }
      
      text += '\n';
    }
    
    // Processa cada seção
    workout.sections.forEach(section => {
      if (section.title) {
        text += `${section.title}\n`;
      }
      
      if (section.lines) {
        section.lines.forEach(line => {
          // Processa linha (calcula carga se tiver %)
          const result = processExerciseLine(line, prs, preferences);
          
          // Pula linhas com warning se solicitado
          if (opts.skipWarnings && result.warning) {
            return;
          }
          
          // Formata linha
          if (result.success && result.load) {
            const loadText = formatLoadResult(result);
            text += `${line} ${loadText}\n`;
          } else {
            text += `${line}\n`;
          }
        });
      }
      
      if (section.goal && preferences.showGoals !== false) {
        text += `${section.goal}\n`;
      }
      
      text += '\n';
    });
    
    // Remove linhas vazias excessivas
    text = text.replace(/\n{3,}/g, '\n\n').trim();
    
    return {
      success: true,
      text: text,
      lineCount: text.split('\n').length,
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao formatar treino: ' + error.message,
      text: '',
    };
  }
}

/**
 * Gera versão resumida do treino
 * @param {Object} workout - Treino
 * @returns {Object} Resultado com resumo
 */
export function copyWorkoutSummary(workout) {
  if (!isValidWorkout(workout)) {
    return {
      success: false,
      error: 'Treino inválido',
      text: '',
    };
  }
  
  try {
    const sections = workout.sections.length;
    const lines = workout.sections.reduce((acc, s) => acc + (s.lines?.length || 0), 0);
    
    const text = `${workout.day}: ${sections} blocos, ${lines} exercícios`;
    
    return {
      success: true,
      text: text,
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      text: '',
    };
  }
}
