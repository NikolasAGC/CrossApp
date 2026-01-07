export default {
  name: 'weightlifting',

  match(line) {
    return /SNATCH|CLEAN|JERK|SQUAT/i.test(line);
  },

  parse(line) {
    const percent = line.match(/@\s*(\d{1,3})%/);
    const exercise = line
      .replace(/\(.*?\)/g, '')
      .split('@')[0]
      .split('+')[0]
      .trim();

    return {
      line,
      exercise,
      percent: percent ? Number(percent[1]) : null
    };
  }
};
