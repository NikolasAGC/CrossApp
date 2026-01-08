/**
 * Use Case: Calculate Loads
 * Responsabilidade: Orquestrar cálculo de cargas usando parser + processor
 */

import { calculateWorkoutLoads } from '../../plugins/workoutLoadProcessor.js';

/**
 * Calcula cargas para treino
 * @param {Object} workout - { day, sections: [...blocks] }
 * @param {Object} prs - PRs do usuário
 * @param {Object} preferences - Preferências
 * @returns {Object} { success, data, hasWarnings, missingPRs }
 */
export function calculateLoads(workout, prs, preferences = {}) {
  try {
    console.log('🔢 calculateLoads iniciado:', {
      day: workout?.day,
      sectionsCount: workout?.sections?.length,
      prsCount: Object.keys(prs || {}).length
    });

    if (!workout?.sections) {
      return {
        success: false,
        error: 'Workout inválido: falta sections',
        hasWarnings: false,
        data: []
      };
    }

    // Extrai todas as linhas
    const allLines = [];
    workout.sections.forEach(section => {
      if (section?.lines) {
        section.lines.forEach(line => {
          const lineText = typeof line === 'string' 
            ? line 
            : (line?.raw || String(line));
          allLines.push(lineText);
        });
      }
    });

    console.log('📄 Linhas extraídas:', allLines.length);

    // Processa com parser integrado
    const results = calculateWorkoutLoads(allLines, prs, preferences);

    const hasWarnings = results.some(r => r.warning || r.isWarning);
    const missingPRs = [...new Set(
      results
        .filter(r => r.missingPR)
        .map(r => r.missingPR)
    )];

    console.log('✅ Cargas calculadas:', {
      total: results.length,
      withLoads: results.filter(r => r.calculatedText).length,
      warnings: hasWarnings,
      missingPRs: missingPRs.length
    });

    return {
      success: true,
      data: results,
      hasWarnings: hasWarnings,
      missingPRs: missingPRs
    };

  } catch (error) {
    console.error('❌ Erro em calculateLoads:', error);
    return {
      success: false,
      error: error.message,
      hasWarnings: false,
      data: []
    };
  }
}
