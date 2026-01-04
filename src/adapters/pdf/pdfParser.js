/**
 * Limpa texto extraído de PDF (remove artefatos comuns)
 * @param {string} rawText - Texto bruto do PDF
 * @returns {string} Texto limpo
 */
export function cleanPdfText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }
  
  let cleaned = rawText;
  
  // Normaliza quebras de linha
  cleaned = cleaned.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/\r/g, '\n');
  
  // Remove URLs (mantém quebra de linha)
  cleaned = cleaned.split('\n')
    .map(line => line.replace(/https?:\/\/[^\s]+/g, ''))
    .join('\n');
  
  // Remove emails (mantém quebra de linha)
  cleaned = cleaned.split('\n')
    .map(line => line.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, ''))
    .join('\n');
  
  // Remove linhas com "Licensed to"
  cleaned = cleaned.split('\n')
    .filter(line => !line.includes('Licensed to'))
    .join('\n');
  
  // Remove linhas com hashtags
  cleaned = cleaned.split('\n')
    .filter(line => !line.trim().startsWith('#garanta'))
    .filter(line => !line.trim().startsWith('#treine'))
    .join('\n');
  
  // Remove linhas vazias EXCESSIVAS (3+ vazias viram 1)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Remove espaços no início/fim de cada linha (MAS MANTÉM AS QUEBRAS!)
  cleaned = cleaned.split('\n')
    .map(line => line.trim())
    .join('\n');
  
  // Remove linhas completamente vazias
  cleaned = cleaned.split('\n')
    .filter(line => line.length > 0)
    .join('\n');
  
  return cleaned.trim();
}
