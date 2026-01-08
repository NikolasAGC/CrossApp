/**
 * Weightlifting Plugin
 */

export default {
  name: 'weightlifting',
  match(line) {
    return /SNATCH|CLEAN|JERK|SQUAT/i.test(line);
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
    
    // ✅ IGNORA linhas de descanso/instruções
    const ignoredPatterns = /^(REST|DESCANSO|A\s+CADA|EVERY|BETWEEN|PAUSA|\*|\()/i;
    let exercise = null;
    
    if (!ignoredPatterns.test(line.trim())) {
      const cleanLine = line.split('@')[0].split('%')[0];
      const exerciseMatch = cleanLine.match(/\b(SNATCH|CLEAN|JERK|SQUAT[A-Z\s]*)\b/i);
      
      if (exerciseMatch) {
        exercise = exerciseMatch[1]
          .replace(/\(.*?\)/g, '')
          .split('+')[0]
          .trim()
          .toUpperCase();
      }
    }

    return {
      line,
      exercise,
      percent,
      plugin: 'weightlifting'
    };
  }
};
