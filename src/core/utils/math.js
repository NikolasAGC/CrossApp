/**
 * Utilidades matemáticas
 * Conversões, arredondamentos e cálculos
 */

/**
 * Converte quilogramas para libras
 * @param {number} kg - Peso em kg
 * @returns {number} Peso em lbs
 */
export function kgToLbs(kg) {
  if (typeof kg !== 'number' || isNaN(kg)) return 0;
  return kg * 2.20462;
}

/**
 * Converte libras para quilogramas
 * @param {number} lbs - Peso em lbs
 * @returns {number} Peso em kg
 */
export function lbsToKg(lbs) {
  if (typeof lbs !== 'number' || isNaN(lbs)) return 0;
  return lbs / 2.20462;
}

/**
 * Arredonda para múltiplo mais próximo
 * @param {number} value - Valor
 * @param {number} step - Incremento (ex: 2.5, 5, 10)
 * @returns {number} Valor arredondado
 */
export function roundToNearest(value, step = 2.5) {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  if (typeof step !== 'number' || isNaN(step) || step <= 0) return value;
  
  return Math.round(value / step) * step;
}

/**
 * Calcula percentual de um valor
 * @param {number} value - Valor base
 * @param {number} percent - Percentual (ex: 80 para 80%)
 * @returns {number} Valor calculado
 */
export function calculatePercent(value, percent) {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  if (typeof percent !== 'number' || isNaN(percent)) return 0;
  
  return (value * percent) / 100;
}

/**
 * Formata número com casas decimais
 * @param {number} value - Número
 * @param {number} decimals - Casas decimais
 * @returns {string} Número formatado
 */
export function formatNumber(value, decimals = 1) {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  return value.toFixed(decimals);
}

/**
 * Verifica se número está dentro de um range
 * @param {number} value - Valor
 * @param {number} min - Mínimo
 * @param {number} max - Máximo
 * @returns {boolean}
 */
export function inRange(value, min, max) {
  if (typeof value !== 'number' || isNaN(value)) return false;
  return value >= min && value <= max;
}

/**
 * Clamp: limita valor entre min e max
 * @param {number} value - Valor
 * @param {number} min - Mínimo
 * @param {number} max - Máximo
 * @returns {number} Valor limitado
 */
export function clamp(value, min, max) {
  if (typeof value !== 'number' || isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Calcula média de array de números
 * @param {number[]} numbers - Array de números
 * @returns {number} Média
 */
export function average(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return 0;
  const valid = numbers.filter(n => typeof n === 'number' && !isNaN(n));
  if (valid.length === 0) return 0;
  return valid.reduce((sum, n) => sum + n, 0) / valid.length;
}

/**
 * Soma array de números (ignora inválidos)
 * @param {number[]} numbers - Array de números
 * @returns {number} Soma
 */
export function sum(numbers) {
  if (!Array.isArray(numbers)) return 0;
  return numbers
    .filter(n => typeof n === 'number' && !isNaN(n))
    .reduce((total, n) => total + n, 0);
}

/**
 * Gera range de números
 * @param {number} start - Início
 * @param {number} end - Fim (exclusivo)
 * @param {number} step - Incremento
 * @returns {number[]} Array de números
 */
export function range(start, end, step = 1) {
  const result = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}
