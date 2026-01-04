/**
 * Workout Service
 * Parse de PDF text → estrutura de treino
 */

import { normalizeSpaces, removeEmptyLines, hasExercisePattern } from '../utils/text.js';
import { isValidDayName } from '../utils/validators.js';

/**
 * Parse de texto do PDF em estrutura de treino
 * @param {string} pdfText - Texto bruto do PDF
 * @returns {Array} Array de workouts por dia
 */
export function parseWorkoutText(pdfText) {
  if (!pdfText || typeof pdfText !== 'string') {
    return [];
  }
  
  const lines = pdfText.split(/\r?\n/).map(l => l.trim());
  const workouts = [];
  let currentDay = null;
  let currentSections = [];
  let currentLines = [];
  
  lines.forEach(line => {
    // Detecta início de novo dia
    const dayMatch = detectDayHeader(line);
    
    if (dayMatch) {
      // Salva dia anterior se existir
      if (currentDay && currentLines.length > 0) {
        currentSections.push({ lines: currentLines });
        workouts.push({
          day: currentDay,
          sections: currentSections,
        });
      }
      
      // Inicia novo dia
      currentDay = dayMatch;
      currentSections = [];
      currentLines = [];
      return;
    }
    
    // Detecta nova seção (WOD, AMRAP, etc)
    if (isSectionHeader(line)) {
      if (currentLines.length > 0) {
        currentSections.push({ 
          title: line,
          lines: currentLines 
        });
        currentLines = [];
      }
      return;
    }
    
    // Filtra linhas inválidas
    if (shouldSkipLine(line)) {
      return;
    }
    
    // Adiciona linha ao treino atual
    if (currentDay) {
      currentLines.push(line);
    }
  });
  
  // Salva último dia
  if (currentDay && currentLines.length > 0) {
    currentSections.push({ lines: currentLines });
    workouts.push({
      day: currentDay,
      sections: currentSections,
    });
  }
  
  return workouts;
}

/**
 * Detecta cabeçalho de dia da semana
 * @param {string} line - Linha do PDF
 * @returns {string|null} Nome do dia ou null
 */
function detectDayHeader(line) {
  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  
  for (const day of days) {
    if (line.toUpperCase().includes(day.toUpperCase())) {
      return day;
    }
  }
  
  return null;
}

/**
 * Verifica se linha é cabeçalho de seção
 * @param {string} line - Linha
 * @returns {boolean}
 */
function isSectionHeader(line) {
  const upper = line.toUpperCase();
  
  return (
    /^WOD\b/i.test(line) ||
    /AMRAP/i.test(upper) ||
    /FOR TIME/i.test(upper) ||
    /EMOM/i.test(upper) ||
    /TABATA/i.test(upper) ||
    /^\d+\s*['´`]/.test(line) // Ex: "20' AMRAP"
  );
}

/**
 * Verifica se linha deve ser ignorada
 * @param {string} line - Linha
 * @returns {boolean}
 */
function shouldSkipLine(line) {
  if (!line || line.length === 0) return true;
  
  return (
    line.includes('http://') ||
    line.includes('https://') ||
    line.includes('@gmail.com') ||
    line.includes('@hotmail.com') ||
    line.startsWith('#') ||
    line.includes('Licensed to') ||
    line.includes('HP1570') ||
    /^\d{3}\.\d{3}\.\d{3}/.test(line) // CPF/CNPJ
  );
}

/**
 * Filtra treino por dia da semana
 * @param {Array} workouts - Array de workouts
 * @param {string} dayName - Nome do dia
 * @returns {Object|null} Treino do dia ou null
 */
export function getWorkoutByDay(workouts, dayName) {
  if (!Array.isArray(workouts) || !isValidDayName(dayName)) {
    return null;
  }
  
  return workouts.find(w => w.day === dayName) || null;
}

/**
 * Quebra seções em cards de WOD
 * @param {Array} lines - Linhas de uma seção
 * @returns {Array} Cards de WOD
 */
export function buildWodCards(lines) {
  const cards = [];
  let current = {
    title: '',
    lines: [],
    goal: '',
  };
  
  lines.forEach(line => {
    // Detecta objetivo (ex: "Objetivo = Força")
    if (/^Objetivo\s*=/i.test(line)) {
      current.goal = line;
      return;
    }
    
    // Detecta título de card
    if (isSectionHeader(line)) {
      if (current.lines.length > 0 || current.title || current.goal) {
        cards.push(current);
      }
      current = { title: line, lines: [], goal: '' };
      return;
    }
    
    current.lines.push(line);
  });
  
  // Salva último card
  if (current.lines.length > 0 || current.title || current.goal) {
    cards.push(current);
  }
  
  // Se não há cards, retorna tudo como um único card
  if (cards.length === 0 && lines.length > 0) {
    return [{ title: '', lines: lines, goal: '' }];
  }
  
  return cards;
}

/**
 * Extrai estatísticas de um treino
 * @param {Object} workout - Objeto de treino
 * @returns {Object} Estatísticas
 */
export function getWorkoutStats(workout) {
  if (!workout || !workout.sections) {
    return { sections: 0, lines: 0, exercises: 0 };
  }
  
  const totalLines = workout.sections.reduce((acc, s) => {
    return acc + (s.lines ? s.lines.length : 0);
  }, 0);
  
  const exercises = workout.sections.reduce((acc, s) => {
    if (!s.lines) return acc;
    const exerciseLines = s.lines.filter(l => hasExercisePattern(l));
    return acc + exerciseLines.length;
  }, 0);
  
  return {
    sections: workout.sections.length,
    lines: totalLines,
    exercises: exercises,
  };
}

/**
 * Valida estrutura de workout
 * @param {*} workout - Dados para validar
 * @returns {boolean}
 */
export function isValidWorkout(workout) {
  return (
    workout &&
    typeof workout === 'object' &&
    isValidDayName(workout.day) &&
    Array.isArray(workout.sections) &&
    workout.sections.length > 0
  );
}

/**
 * Limpa texto do PDF (remove ruído comum)
 * @param {string} pdfText - Texto bruto
 * @returns {string} Texto limpo
 */
export function cleanPDFText(pdfText) {
  let cleaned = pdfText;
  
  // Remove múltiplas linhas vazias
  cleaned = removeEmptyLines(cleaned);
  
  // Normaliza espaços em cada linha
  cleaned = cleaned
    .split('\n')
    .map(line => normalizeSpaces(line))
    .join('\n');
  
  return cleaned;
}

/**
 * Extrai lista de exercícios únicos de um treino
 * @param {Object} workout - Treino
 * @returns {string[]} Lista de exercícios
 */
export function extractExercises(workout) {
  if (!isValidWorkout(workout)) return [];
  
  const exercises = new Set();
  
  workout.sections.forEach(section => {
    section.lines?.forEach(line => {
      const matches = line.match(/\b([A-Z][A-Z\s]+)\b/g);
      if (matches) {
        matches.forEach(ex => exercises.add(ex.trim()));
      }
    });
  });
  
  return Array.from(exercises).sort();
}
