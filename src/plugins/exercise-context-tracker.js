/**
 * Plugin: Exercise Context Tracker
 * Auxilia loadCalculator a identificar exercícios em linhas de % isoladas
 * Mantém contexto do último exercício detectado
 */

/**
 * Detecta se linha é um exercício principal (sem % ou REST)
 */
function isExerciseLine(line) {
  if (!line || typeof line !== 'string') return false;

  const normalized = line.trim();

  // Ignora vazias
  if (normalized.length === 0) return false;

  // Ignora linhas que começam com séries/percentuais
  if (/^\d+\s*[@x]/.test(normalized)) return false;

  // Ignora REST
  if (/^(REST|A\s+CADA)/i.test(normalized)) return false;

  // Aceita linhas com letras maiúsculas que parecem exercícios
  const hasUpperCase = /[A-Z]{3,}/.test(normalized);
  
  return hasUpperCase;
}

/**
 * Extrai nome do exercício de uma linha
 */
function extractExerciseName(line) {
  if (!line || typeof line !== 'string') return null;

  // Remove padrões comuns que não são exercício
  let cleaned = line
    .replace(/^\d+\s*[@x].*/, '') // Remove séries no início
    .replace(/@\s*\d+%/, '')       // Remove percentuais
    .replace(/REST.*/i, '')        // Remove REST
    .trim();

  // Busca padrão de exercício em CAPS
  const match = cleaned.match(/\b([A-Z][A-Z\s()]+)\b/);
  
  return match ? match[0].trim() : null;
}

/**
 * Processa linhas mantendo contexto de exercício
 * Retorna array com exercício identificado em cada linha
 * 
 * @param {string[]} lines - Array de linhas do treino
 * @param {Object} prs - PRs cadastrados (para validar)
 * @returns {Array} Array com { line, exercise, isPercentLine }
 */
export function trackExerciseContext(lines, prs = {}) {
  if (!Array.isArray(lines)) return [];

  let currentExercise = null;
  
  return lines.map(line => {
    const lineText = typeof line === 'object' && line.raw 
      ? line.raw 
      : String(line);

    // Detecta se linha define um novo exercício
    if (isExerciseLine(lineText)) {
      const exerciseName = extractExerciseName(lineText);
      
      // Atualiza contexto se encontrou exercício válido
      if (exerciseName) {
        currentExercise = exerciseName;
      }

      return {
        line: lineText,
        exercise: exerciseName,
        contextExercise: currentExercise,
        isPercentLine: /@\s*\d+%/.test(lineText),
        isExerciseDefinition: true
      };
    }

    // Linha não é exercício - usa contexto atual
    return {
      line: lineText,
      exercise: null,
      contextExercise: currentExercise, // ✅ Carrega exercício do contexto
      isPercentLine: /@\s*\d+%/.test(lineText),
      isExerciseDefinition: false
    };
  });
}

/**
 * Valida se exercício existe nos PRs (busca fuzzy)
 */
export function findExerciseInPRs(exerciseName, prs) {
  if (!exerciseName || !prs) return null;

  const normalized = exerciseName.toUpperCase().trim();

  // Busca exata
  if (prs[normalized] !== undefined) {
    return normalized;
  }

  // Busca parcial (ex: "FRONT SQUAT" casa com "FRONT SQUAT (pausa)")
  for (const key of Object.keys(prs)) {
    const keyUpper = key.toUpperCase();
    if (normalized.includes(keyUpper) || keyUpper.includes(normalized)) {
      return key;
    }
  }

  return null;
}

/**
 * Melhora detecção de exercício com contexto e validação de PRs
 * Função auxiliar para usar no loadCalculator
 * 
 * @param {string} line - Linha atual
 * @param {string|null} contextExercise - Exercício do contexto (linha anterior)
 * @param {Object} prs - PRs cadastrados
 * @returns {string|null} Nome do exercício a usar
 */
export function resolveExerciseWithContext(line, contextExercise, prs) {
  if (!line) return null;

  // Tenta extrair da linha atual
  const exerciseInLine = extractExerciseName(line);

  // Se achou na linha e existe PR, usa
  if (exerciseInLine) {
    const found = findExerciseInPRs(exerciseInLine, prs);
    if (found) return found;
  }

  // Se não achou ou não tem PR, usa contexto
  if (contextExercise) {
    const found = findExerciseInPRs(contextExercise, prs);
    if (found) return found;
  }

  return exerciseInLine || contextExercise;
}
