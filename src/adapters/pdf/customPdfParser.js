/**
 * Custom PDF Parser
 * Parser especializado para o formato específico dos PDFs de treino
 */

import { normalizeSpaces, removeEmptyLines } from '../../core/utils/text.js';

/**
 * Detecta número da semana no PDF
 * @param {string} text - Texto do PDF
 * @returns {number[]} Array de números de semanas encontradas
 */
export function detectWeekNumbers(text) {
  const matches = text.match(/SEMANA\s+(\d+)/gi);
  
  if (!matches) return [];
  
  const weekNumbers = matches.map(match => {
    const num = match.match(/\d+/);
    return num ? parseInt(num[0], 10) : null;
  }).filter(Boolean);
  
  // Remove duplicados e ordena
  return [...new Set(weekNumbers)].sort((a, b) => a - b);
}

/**
 * Divide PDF em múltiplas semanas
 * @param {string} text - Texto do PDF
 * @returns {Array} Array de objetos { weekNumber, text }
 */
export function splitPdfIntoWeeks(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const lines = text.split('\n');
  const weeks = [];
  let currentWeek = null;
  let currentText = [];
  
  lines.forEach(line => {
    // Detecta início de nova semana
    const weekMatch = line.match(/SEMANA\s+(\d+)/i);
    
    if (weekMatch) {
      // Salva semana anterior se existir
      if (currentWeek !== null && currentText.length > 0) {
        weeks.push({
          weekNumber: currentWeek,
          text: currentText.join('\n'),
        });
      }
      
      // Inicia nova semana
      currentWeek = parseInt(weekMatch[1], 10);
      currentText = [line];
    } else if (currentWeek !== null) {
      currentText.push(line);
    }
  });
  
  // Salva última semana
  if (currentWeek !== null && currentText.length > 0) {
    weeks.push({
      weekNumber: currentWeek,
      text: currentText.join('\n'),
    });
  }
  
  return weeks;
}

/**
 * Normaliza nomes de dias (suporta variações)
 * @param {string} line - Linha do PDF
 * @returns {string|null} Nome do dia normalizado ou null
 */
export function detectDayName(line) {
  const dayMap = {
    'SEGUNDA': 'Segunda',
    'TERÇA': 'Terça',
    'TERCA': 'Terça',
    'QUARTA': 'Quarta',
    'QUINTA': 'Quinta',
    'QUI': 'Quinta',
    'SEXTA': 'Sexta',
    'SEX': 'Sexta',
    'SÁBADO': 'Sábado',
    'SABADO': 'Sábado',
    'SAB': 'Sábado',
    'DOMINGO': 'Domingo',
  };
  
  const upper = line.trim().toUpperCase();
  
  // Verifica se linha é exatamente um nome de dia
  if (dayMap[upper]) {
    return dayMap[upper];
  }
  
  // Verifica se começa com nome de dia
  for (const [key, value] of Object.entries(dayMap)) {
    if (upper.startsWith(key)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Detecta blocos de treino (WOD, MANHÃ, TARDE, etc)
 * @param {string} line - Linha
 * @returns {string|null} Tipo de bloco ou null
 */
export function detectBlockType(line) {
  const upper = line.trim().toUpperCase();
  
  if (/^WOD\s*\d*$/.test(upper)) return 'WOD';
  if (upper === 'WOD 2') return 'WOD 2';
  if (upper === 'MANHÃ' || upper === 'MANHA') return 'MANHÃ';
  if (upper === 'TARDE') return 'TARDE';
  if (upper.includes('(OPTIONAL)')) return 'OPTIONAL';
  if (/^\d+[`´]\s*(AMRAP|FOR TIME|EMOM)/.test(upper)) return 'TIMED_WOD';
  
  return null;
}

/**
 * Verifica se linha deve ser ignorada
 * @param {string} line - Linha
 * @returns {boolean}
 */
export function shouldSkipLine(line) {
  if (!line || line.trim().length === 0) return true;
  
  const lower = line.toLowerCase();
  
  return (
    line.includes('http://') ||
    line.includes('https://') ||
    line.includes('youtube.com') ||
    line.includes('youtu.be') ||
    lower.includes('@gmail.com') ||
    lower.includes('@hotmail.com') ||
    line.startsWith('#garanta') ||
    line.startsWith('#treine') ||
    lower.includes('licensed to') ||
    lower.includes('hp1570') ||
    /^\d{3}\.\d{3}\.\d{3}/.test(line)
  );
}

/**
 * Parse de uma semana específica em estrutura de treinos
 * @param {string} weekText - Texto de uma semana
 * @param {number} weekNumber - Número da semana
 * @returns {Object} Estrutura de treino da semana
 */
export function parseWeekText(weekText, weekNumber) {
  const lines = weekText.split('\n').map(l => l.trim());
  const workouts = [];
  
  let currentDay = null;
  let currentBlock = null;
  let currentLines = [];
  
  lines.forEach(line => {
    // Pula linhas vazias ou inválidas
    if (shouldSkipLine(line)) {
      return;
    }
    
    // Detecta novo dia
    const dayName = detectDayName(line);
    if (dayName) {
      // Salva bloco anterior
      if (currentDay && currentLines.length > 0) {
        if (!workouts.find(w => w.day === currentDay)) {
          workouts.push({
            day: currentDay,
            blocks: [],
          });
        }
        const workout = workouts.find(w => w.day === currentDay);
        workout.blocks.push({
          type: currentBlock || 'DEFAULT',
          lines: currentLines,
        });
      }
      
      currentDay = dayName;
      currentBlock = null;
      currentLines = [];
      return;
    }
    
    // Detecta novo bloco (WOD, MANHÃ, etc)
    const blockType = detectBlockType(line);
    if (blockType) {
      // Salva bloco anterior
      if (currentDay && currentLines.length > 0) {
        if (!workouts.find(w => w.day === currentDay)) {
          workouts.push({
            day: currentDay,
            blocks: [],
          });
        }
        const workout = workouts.find(w => w.day === currentDay);
        workout.blocks.push({
          type: currentBlock || 'DEFAULT',
          lines: currentLines,
        });
      }
      
      currentBlock = blockType;
      currentLines = [];
      return;
    }
    
    // Adiciona linha ao bloco atual
    if (currentDay) {
      currentLines.push(line);
    }
  });
  
  // Salva último bloco
  if (currentDay && currentLines.length > 0) {
    if (!workouts.find(w => w.day === currentDay)) {
      workouts.push({
        day: currentDay,
        blocks: [],
      });
    }
    const workout = workouts.find(w => w.day === currentDay);
    workout.blocks.push({
      type: currentBlock || 'DEFAULT',
      lines: currentLines,
    });
  }
  
  return {
    weekNumber: weekNumber,
    workouts: workouts,
  };
}

/**
 * Parse completo de PDF com múltiplas semanas
 * @param {string} pdfText - Texto completo do PDF
 * @returns {Array} Array de semanas parseadas
 */
export function parseMultiWeekPdf(pdfText) {
  if (!pdfText || typeof pdfText !== 'string') {
    return [];
  }
  
  // Divide em semanas
  const weeks = splitPdfIntoWeeks(pdfText);
  
  // Parse de cada semana
  return weeks.map(week => parseWeekText(week.text, week.weekNumber));
}

/**
 * Extrai treino de um dia específico de uma semana
 * @param {Object} parsedWeek - Semana parseada
 * @param {string} dayName - Nome do dia
 * @returns {Object|null} Treino do dia ou null
 */
export function getWorkoutFromWeek(parsedWeek, dayName) {
  if (!parsedWeek || !parsedWeek.workouts) {
    return null;
  }
  
  return parsedWeek.workouts.find(w => w.day === dayName) || null;
}

/**
 * Valida formato do PDF
 * @param {string} pdfText - Texto do PDF
 * @returns {Object} Resultado da validação
 */
export function validateCustomPdfFormat(pdfText) {
  if (!pdfText || typeof pdfText !== 'string') {
    return {
      valid: false,
      error: 'Texto vazio',
    };
  }
  
  const weekNumbers = detectWeekNumbers(pdfText);
  
  if (weekNumbers.length === 0) {
    return {
      valid: false,
      error: 'Nenhuma semana encontrada (procure por "SEMANA XX")',
    };
  }
  
  const days = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
  const foundDays = days.filter(day => 
    new RegExp(`\\b${day}\\b`, 'i').test(pdfText)
  );
  
  if (foundDays.length === 0) {
    return {
      valid: false,
      error: 'Nenhum dia da semana encontrado',
    };
  }
  
  return {
    valid: true,
    weekNumbers: weekNumbers,
    daysFound: foundDays.length,
    weeksCount: weekNumbers.length,
  };
}
