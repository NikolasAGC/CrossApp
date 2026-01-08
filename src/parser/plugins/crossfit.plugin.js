/**
 * CrossFit Plugin
 */

export default {
  name: 'crossfit',
  match(line) {
    return /AMRAP|EMOM|FOR TIME|RFT/i.test(line);
  },
  parse(line) {
    const percentMatch = line.match(/@\s*(\d{1,3})%/);
    const percent = percentMatch ? Number(percentMatch[1]) : null;
    
    const exerciseMatch = line.match(/\b([A-Z][A-Z\s+-]+?)(?=\s*@|\s*\d+x\d+|$)/);
    const exercise = exerciseMatch 
      ? exerciseMatch[1]
          .replace(/\(.*?\)/g, '')
          .split('+')[0]
          .trim()
      : null;

    return {
      line,
      exercise,
      percent,
      plugin: 'crossfit'
    };
  }
};
