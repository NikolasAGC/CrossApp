/**
 * Normalize - Normalização de nomes de exercícios
 */

export function normalizeExerciseName(name) {
  if (!name) return null;

  let normalized = name
    .toUpperCase()
    .trim()
    // Remove parênteses e conteúdo
    .replace(/\(.*?\)/g, '')
    .trim();

  // ✅ Remove tudo após '+' (exercícios compostos)
  if (normalized.includes('+')) {
    normalized = normalized.split('+')[0].trim();
  }

  // ✅ Remove plural: SQUATS → SQUAT
  normalized = normalized.replace(/S\b/g, '');

  // Mapeamento de aliases
  const aliases = {
    'POWER SNATCH': 'SNATCH',
    'SQUAT SNATCH': 'SNATCH',
    'HANG SNATCH': 'SNATCH',
    'HANG POWER SNATCH': 'SNATCH',
    'HIGH HANG SQUAT SNATCH': 'SNATCH',
    'LOW HANG SQUAT SNATCH': 'SNATCH',
    
    'POWER CLEAN': 'CLEAN',
    'SQUAT CLEAN': 'CLEAN',
    'HANG CLEAN': 'CLEAN',
    'HANG POWER CLEAN': 'CLEAN',
    
    'PUSH PRESS': 'PUSH PRESS',
    'PUSH JERK': 'JERK',
    'SPLIT JERK': 'JERK',
    
    'FRONT SQUAT': 'FRONT SQUAT',
    'BACK SQUAT': 'BACK SQUAT',
    'OVERHEAD SQUAT': 'OVERHEAD SQUAT',
    
    'CLEAN AND JERK': 'CLEAN AND JERK',
    'SQUAT CLEAN AND JERK': 'CLEAN AND JERK'
  };

  // Procura no mapeamento
  for (const [key, value] of Object.entries(aliases)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  return normalized;
}
