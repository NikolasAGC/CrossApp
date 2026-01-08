/**
 * Bodybuilding Plugin
 */

export default {
  name: 'bodybuilding',
  match(line) {
    return /DROP SET|SUPERSET|ISOLATION/i.test(line);
  },
  parse(line) {
    const percentMatch = line.match(/@\s*(\d{1,3})%/);
    const percent = percentMatch ? Number(percentMatch[1]) : null;
    
    const exerciseMatch = line.match(/\b([A-Z][A-Z\s+-]+?)(?=\s*@|\s*DROP|\s*SUPERSET|$)/);
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
      plugin: 'bodybuilding'
    };
  }
};
