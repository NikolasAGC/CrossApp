/**
 * Percent Parser Plugin
 * Responsável apenas por extrair percentuais de texto
 */

export function extractPercent(line) {
  if (!line || typeof line !== 'string') return null;

  // @80%, @ 80 %, 80%
  const match =
    line.match(/@\s*(\d{1,3})\s*%/) ||
    line.match(/\b(\d{1,3})\s*%\b/);

  if (!match) return null;

  const percent = Number(match[1]);
  if (percent <= 0 || percent > 100) return null;

  return percent;
}
