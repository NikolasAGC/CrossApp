/**
 * Utilidades de data/hora
 * Funções puras, zero dependências externas
 */

const DAY_NAMES = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/**
 * Retorna o nome do dia da semana
 * @param {Date} date - Data (default: hoje)
 * @returns {string} Nome do dia (Segunda, Terça, etc)
 */
export function getDayName(date = new Date()) {
  return DAY_NAMES[date.getDay()];
}

/**
 * Retorna o índice do dia da semana (0-6)
 * @param {string} dayName - Nome do dia
 * @returns {number} Índice (Domingo=0, Segunda=1, etc)
 */
export function getDayIndex(dayName) {
  return DAY_NAMES.indexOf(dayName);
}

/**
 * Formata data em pt-BR
 * @param {Date} date - Data
 * @param {Object} options - Opções de formatação
 * @returns {string} Data formatada
 */
export function formatDate(date = new Date(), options = {}) {
  const defaults = {
    includeDay: true,
    includeYear: true,
    format: 'long', // 'long' | 'short'
  };
  
  const opts = { ...defaults, ...options };
  
  const day = date.getDate();
  const month = opts.format === 'long' 
    ? MONTH_NAMES[date.getMonth()] 
    : String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  if (opts.format === 'short') {
    // Formato: DD/MM/YYYY
    return `${String(day).padStart(2, '0')}/${month}/${year}`;
  }
  
  // Formato: DD de mês de YYYY
  let formatted = `${day} de ${month}`;
  
  if (opts.includeYear) {
    formatted += ` de ${year}`;
  }
  
  return formatted;
}

/**
 * Retorna descrição completa do dia
 * @param {Date} date - Data
 * @returns {string} Ex: "Segunda, 4 de janeiro de 2026"
 */
export function getFullDayDescription(date = new Date()) {
  const dayName = getDayName(date);
  const formatted = formatDate(date, { includeYear: true, format: 'long' });
  return `${dayName}, ${formatted}`;
}

/**
 * Verifica se é fim de semana
 * @param {Date} date - Data
 * @returns {boolean}
 */
export function isWeekend(date = new Date()) {
  const day = date.getDay();
  return day === 0 || day === 6; // Domingo ou Sábado
}

/**
 * Verifica se é dia de descanso (Domingo)
 * @param {Date} date - Data
 * @returns {boolean}
 */
export function isRestDay(date = new Date()) {
  return date.getDay() === 0;
}

/**
 * Retorna timestamp formatado para logs
 * @returns {string} Ex: "2026-01-04T14:30:15.123Z"
 */
export function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Calcula diferença em dias entre duas datas
 * @param {Date} date1 
 * @param {Date} date2 
 * @returns {number} Diferença em dias (absoluto)
 */
export function daysDifference(date1, date2) {
  const ms = Math.abs(date1.getTime() - date2.getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
