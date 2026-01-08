/**
 * Exercise Context Tracker - Rastreamento de contexto
 * Responsabilidade: Manter exercício atual entre linhas
 * NOTA: Agora redundante (workoutLoadProcessor faz isso), mantido para compatibilidade
 */

function normalizeExerciseName(name) {
  if (!name || typeof name !== 'string') return null;
  return name
    .replace(/\(.*?\)/g, '')
    .split('+')[0]
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isExerciseDefinition(line) {
  if (!line) return false;
  const text = line.trim();
  if (text.length === 0) return false;
  if (/^REST/i.test(text)) return false;
  if (/@\s*\d+%/.test(text)) return false;
  return /[A-Z]{3,}/.test(text);
}

function extractExerciseFromLine(line) {
  if (!line) return null;
  const match = line.match(/\b([A-Z][A-Z\s()+-]+)\b/);
  if (!match) return null;
  return normalizeExerciseName(match[0]);
}

export function trackExerciseContext(lines) {
  if (!Array.isArray(lines)) return [];
  
  let currentExercise = null;
  
  return lines.map(rawLine => {
    const line = String(rawLine);
    
    if (isExerciseDefinition(line)) {
      const found = extractExerciseFromLine(line);
      if (found) {
        currentExercise = found;
      }
    }
    
    return {
      line,
      contextExercise: currentExercise,
      hasPercent: /@\s*\d+%/.test(line)
    };
  });
}
