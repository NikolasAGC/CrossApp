/**
 * PRs (Personal Records) - Banco de dados padrão
 * 
 * Este arquivo contém os PRs predefinidos do usuário.
 * Edite os valores abaixo com suas cargas máximas.
 * 
 * Formato: { "NOME DO EXERCÍCIO": carga_em_kg }
 */

export const defaultPRs = {
  // AGACHAMENTOS
  "BACK SQUAT": 0,
  "FRONT SQUAT": 0,
  "OVERHEAD SQUAT": 0,
  "SQUAT CLEAN": 0,
  
  // LEVANTAMENTOS OLÍMPICOS
  "CLEAN": 0,
  "JERK": 0,
  "CLEAN AND JERK": 0,
  "SNATCH": 0,
  "POWER SNATCH": 0,
  "POWER CLEAN": 0,
  
  // DEADLIFTS
  "DEADLIFT": 0,
  "SUMO DEADLIFT": 0,
  
  // SUPINO/PRESS
  "BENCH PRESS": 0,
  "SHOULDER PRESS": 0,
  "PUSH PRESS": 0,
  "STRICT PRESS": 0,
  
  // OUTROS
  "THRUSTER": 0,
  "WALL BALL": 0,
};

/**
 * Retorna PRs padrão
 * @returns {Object}
 */
export function getDefaultPRs() {
  return { ...defaultPRs };
}

/**
 * Valida se um exercício existe no banco
 * @param {string} exerciseName - Nome do exercício
 * @returns {boolean}
 */
export function isKnownExercise(exerciseName) {
  return exerciseName.toUpperCase() in Object.keys(defaultPRs).reduce((acc, key) => {
    acc[key.toUpperCase()] = true;
    return acc;
  }, {});
}

/**
 * Retorna lista de exercícios conhecidos
 * @returns {string[]}
 */
export function listKnownExercises() {
  return Object.keys(defaultPRs).sort();
}
