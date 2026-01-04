/**
 * Selectors: funções derivadas do estado
 * 
 * Evitam duplicação de lógica e centralizam transformações
 */

import { getState } from './store.js';

/**
 * Retorna o treino do dia atual (já filtrado)
 */
export function getTodayWorkout() {
  const state = getState();
  
  if (!state.workout || !state.currentDay) {
    return null;
  }
  
  return state.workout.find(w => w.day === state.currentDay);
}

/**
 * Retorna exercícios que estão sem PR definido
 */
export function getMissingPRs() {
  const state = getState();
  const workout = getTodayWorkout();
  
  if (!workout) return [];
  
  const exercisesInWorkout = new Set();
  
  workout.sections?.forEach(section => {
    section.lines?.forEach(line => {
      // Busca por padrões de exercício (maiúsculas, etc)
      const match = line.match(/\b([A-Z][A-Z\s]+)\b/);
      if (match) {
        const exercise = match[1].trim();
        if (!state.prs[exercise]) {
          exercisesInWorkout.add(exercise);
        }
      }
    });
  });
  
  return Array.from(exercisesInWorkout);
}

/**
 * Retorna se o app está pronto para exibir treino
 */
export function isWorkoutReady() {
  const state = getState();
  return !!(state.pdfText && state.currentDay && state.workout);
}

/**
 * Retorna se é dia de descanso
 */
export function isRestDay() {
  const state = getState();
  return state.currentDay === 'Domingo';
}

/**
 * Retorna estatísticas do treino
 */
export function getWorkoutStats() {
  const workout = getTodayWorkout();
  
  if (!workout) {
    return { exercises: 0, sets: 0, sections: 0 };
  }
  
  return {
    sections: workout.sections?.length || 0,
    exercises: workout.sections?.reduce((acc, s) => acc + (s.lines?.length || 0), 0) || 0,
    sets: 0, // TODO: calcular sets totais
  };
}

/**
 * Retorna se há avisos (warnings) no treino
 */
export function hasWarnings() {
  const state = getState();
  return state.ui.hasWarnings || getMissingPRs().length > 0;
}
