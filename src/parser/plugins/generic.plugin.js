/**
 * Generic Plugin - Fallback
 */

export default {
  name: 'generic',
  match() {
    return true;
  },
  parse(line) {
    // Regex para percentual
    let percent = null;
    const percentPatterns = [
      /@\s*(\d{1,3})\s*%/,
      /\b(\d{1,3})\s*%\b/
    ];
    
    for (const pattern of percentPatterns) {
      const match = line.match(pattern);
      if (match) {
        const p = Number(match[1]);
        if (p > 0 && p <= 100) {
          percent = p;
          break;
        }
      }
    }

    // ✅ IGNORA linhas que não são exercícios
    const ignoredPatterns = /^(REST|DESCANSO|A\s+CADA|EVERY|BETWEEN|PAUSA|NOTA|OBS|\*|\()/i;
    let exercise = null;
    
    if (!ignoredPatterns.test(line.trim())) {
      const cleanLine = line.split('@')[0].split('%')[0];
      const match = cleanLine.match(/\b([A-Z][A-Z\s+-]+)\b/);
      if (match) {
        const candidate = match[1].trim();
        
        // Valida: deve ter pelo menos 5 caracteres e não ser palavra ignorada
        if (candidate.length >= 5 && !ignoredPatterns.test(candidate)) {
          exercise = candidate;
        }
      }
    }

    return {
      line,
      exercise,
      percent,
      plugin: 'generic'
    };
  }
};
