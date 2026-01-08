/**
 * Classify - Classificação de linhas
 */

export function classifyLine(line) {
  if (!line) return 'EMPTY';
  
  // Palavras que NÃO são exercícios
  const ignoredWords = /^(REST|DESCANSO|A\s+CADA|EVERY|BETWEEN|PAUSA|NOTA|OBS|\*)/i;
  
  if (ignoredWords.test(line.trim())) {
    return 'TEXT';
  }
  
  if (/@\s*\d+\s*%/.test(line)) return 'PERCENT';
  if (/[A-Z]{3,}/.test(line)) return 'EXERCISE';
  
  return 'TEXT';
}

export function isExerciseLine(line) {
  return classifyLine(line) === 'EXERCISE';
}
