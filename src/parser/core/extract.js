/**
 * Extract - Extração de dados brutos de linhas
 */

import { normalizeExerciseName } from './normalize.js';

export function extractPercent(line) {
  if (!line || typeof line !== 'string') return null;
  
  // Regex robusto: aceita qualquer variação de espaçamento
  const patterns = [
    /@\s*(\d{1,3})\s*%/,
    /\b(\d{1,3})\s*%\b/
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const percent = Number(match[1]);
      if (percent > 0 && percent <= 100) {
        return percent;
      }
    }
  }
  
  return null;
}

export function extractExercise(line) {
  if (!line || typeof line !== 'string') return null;
  
  // ✅ IGNORA linhas que não são exercícios
  const ignoredPatterns = /^(REST|DESCANSO|A\s+CADA|EVERY|BETWEEN|PAUSA|\*|\()/i;
  
  if (ignoredPatterns.test(line.trim())) {
    return null;
  }
  
  const cleanLine = line.split('@')[0].split('%')[0];
  const match = cleanLine.match(/\b([A-Z][A-Z\s+-]+)\b/);
  
  if (!match) return null;
  
  const candidate = match[1].trim();
  
  // Valida: não pode ser palavra ignorada
  if (ignoredPatterns.test(candidate)) {
    return null;
  }
  
  return normalizeExerciseName(candidate);
}

/**
 * Extrai valores em lbs e converte para kg
 */
export function extractLbsToKg(line) {
  if (!line || typeof line !== 'string') return null;
  
  const match = line.match(/(\d+(?:\.\d+)?)\s*-?\s*\d*\s*lbs/i);
  if (!match) return null;
  
  const lbs = Number(match[1]);
  const kg = Math.round((lbs * 0.453592) * 10) / 10;
  
  return kg;
}
