/**
 * Percent Parser - Extração isolada de percentuais
 * Responsabilidade: Regex específico para %
 * NOTA: Agora redundante (plugins fazem isso), mantido para compatibilidade
 */

export function extractPercent(line) {
  if (!line || typeof line !== 'string') return null;
  
  const match =
    line.match(/@\s*(\d{1,3})\s*%/) ||
    line.match(/\b(\d{1,3})\s*%\b/);
  
  if (!match) return null;
  
  const percent = Number(match[1]);
  if (percent <= 0 || percent > 100) return null;
  
  return percent;
}
