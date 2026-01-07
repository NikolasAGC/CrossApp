export default {
  name: 'crossfit',

  match(line) {
    return /AMRAP|EMOM|FOR TIME|RFT/i.test(line);
  },

  parse(line) {
    return {
      line,
      exercise: null,
      percent: null
    };
  }
};
