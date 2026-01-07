export default {
  name: 'bodybuilding',

  match(line) {
    return /DROP SET|SUPERSET|ISOLATION/i.test(line);
  },

  parse(line) {
    return {
      line,
      exercise: null,
      percent: null
    };
  }
};
