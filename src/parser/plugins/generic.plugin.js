export default {
  name: 'generic',

  match() {
    return true;
  },

  parse(line) {
    const percentMatch = line.match(/@\s*(\d{1,3})\s*%/);
    const percent = percentMatch ? Number(percentMatch[1]) : null;

    let exercise = null;
    const match = line.match(/\b([A-Z][A-Z\s]+)\b/);

    if (match) {
      exercise = match[1]
        .replace(/\(.*?\)/g, '')
        .split('+')[0]
        .trim();
    }

    return {
      line,
      exercise,
      percent
    };
  }
};
