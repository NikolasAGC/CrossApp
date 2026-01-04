/**
 * Import PRs from CSV
 * Importa PRs de arquivo CSV
 */

/**
 * Parseia CSV de PRs
 * @param {string} csvString - String CSV
 * @returns {Object} Resultado
 */
export function importPRsFromCSV(csvString) {
  if (!csvString || typeof csvString !== 'string') {
    return {
      success: false,
      error: 'CSV vazio ou inválido',
    };
  }
  
  try {
    const lines = csvString
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (lines.length === 0) {
      return {
        success: false,
        error: 'CSV vazio',
      };
    }
    
    const prs = {};
    let imported = 0;
    let skipped = 0;
    const errors = [];
    
    lines.forEach((line, index) => {
      // Pula header se tiver
      if (index === 0 && /exerc[ií]cio|exercise|nome|name/i.test(line)) {
        return;
      }
      
      // Parseia linha: "EXERCÍCIO,CARGA" ou "EXERCÍCIO;CARGA"
      const separator = line.includes(';') ? ';' : ',';
      const parts = line.split(separator).map(p => p.trim());
      
      if (parts.length < 2) {
        errors.push(`Linha ${index + 1}: formato inválido "${line}"`);
        skipped++;
        return;
      }
      
      const exerciseName = parts[0].toUpperCase();
      const loadStr = parts[1].replace(/[^\d.-]/g, ''); // Remove tudo exceto números
      const load = parseFloat(loadStr);
      
      if (!exerciseName) {
        errors.push(`Linha ${index + 1}: exercício vazio`);
        skipped++;
        return;
      }
      
      if (isNaN(load) || load <= 0) {
        errors.push(`Linha ${index + 1}: carga inválida "${parts[1]}"`);
        skipped++;
        return;
      }
      
      prs[exerciseName] = load;
      imported++;
    });
    
    if (imported === 0) {
      return {
        success: false,
        error: 'Nenhum PR válido encontrado',
        errors: errors,
      };
    }
    
    return {
      success: true,
      data: prs,
      imported: imported,
      skipped: skipped,
      errors: errors.length > 0 ? errors : null,
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao parsear CSV: ' + error.message,
    };
  }
}

/**
 * Gera CSV de PRs
 * @param {Object} prs - PRs {exercise: load}
 * @returns {Object} Resultado
 */
export function exportPRsToCSV(prs) {
  if (!prs || typeof prs !== 'object') {
    return {
      success: false,
      error: 'PRs inválidos',
    };
  }
  
  const entries = Object.entries(prs);
  
  if (entries.length === 0) {
    return {
      success: false,
      error: 'Nenhum PR cadastrado',
    };
  }
  
  // Header
  let csv = 'Exercício,Carga (kg)\n';
  
  // Dados (ordenados alfabeticamente)
  entries
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([exercise, load]) => {
      csv += `${exercise},${load}\n`;
    });
  
  const filename = `prs-${new Date().toISOString().split('T')[0]}.csv`;
  
  return {
    success: true,
    csv: csv,
    filename: filename,
    count: entries.length,
  };
}

/**
 * Retorna template CSV vazio
 * @returns {string}
 */
export function getCSVTemplate() {
  return `Exercício,Carga (kg)
BACK SQUAT,0
FRONT SQUAT,0
DEADLIFT,0
BENCH PRESS,0
CLEAN,0
JERK,0
SNATCH,0
SHOULDER PRESS,0`;
}
