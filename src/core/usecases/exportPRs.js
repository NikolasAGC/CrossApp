/**
 * Use-case: Exportar PRs
 * Gera JSON de PRs para download
 */

import { exportToJSON } from '../services/prsService.js';
import { getTimestamp } from '../utils/date.js';

/**
 * Exporta PRs para JSON
 * @param {Object} prs - PRs cadastrados
 * @returns {Object} Resultado com JSON
 */
export function exportPRs(prs) {
  if (!prs || typeof prs !== 'object') {
    return {
      success: false,
      error: 'PRs inválidos',
      json: null,
    };
  }
  
  if (Object.keys(prs).length === 0) {
    return {
      success: false,
      error: 'Nenhum PR cadastrado para exportar',
      json: null,
    };
  }
  
  try {
    const json = exportToJSON(prs);
    
    return {
      success: true,
      json: json,
      count: Object.keys(prs).length,
      filename: `prs-${new Date().toISOString().slice(0, 10)}.json`,
      exportedAt: getTimestamp(),
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao exportar PRs: ' + error.message,
      json: null,
    };
  }
}
