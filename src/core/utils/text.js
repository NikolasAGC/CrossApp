/**
 * Utilidades de manipulação de texto
 * Segurança, normalização e formatação
 */

/**
 * Sanitiza texto para prevenir XSS
 * @param {string} str - Texto a sanitizar
 * @returns {string} Texto seguro
 */
export function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return str.replace(/[&<>"'/]/g, char => map[char]);
}

/**
 * Normaliza espaços em branco
 * @param {string} str - Texto
 * @returns {string} Texto sem espaços extras
 */
export function normalizeSpaces(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Remove caracteres especiais (mantém letras, números e espaços)
 * @param {string} str - Texto
 * @returns {string} Texto limpo
 */
export function removeSpecialChars(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9\sÀ-ÿ]/g, '');
}

/**
 * Converte texto para uppercase normalizado
 * @param {string} str - Texto
 * @returns {string} Texto em maiúsculas, sem espaços extras
 */
export function normalizeExerciseName(str) {
  if (typeof str !== 'string') return '';
  return normalizeSpaces(str.toUpperCase());
}

/**
 * Trunca texto com ellipsis
 * @param {string} str - Texto
 * @param {number} maxLength - Tamanho máximo
 * @returns {string} Texto truncado
 */
export function truncate(str, maxLength = 50) {
  if (typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Capitaliza primeira letra
 * @param {string} str - Texto
 * @returns {string} Texto com primeira letra maiúscula
 */
export function capitalize(str) {
  if (typeof str !== 'string' || str.length === 0) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Remove linhas vazias consecutivas
 * @param {string} text - Texto multilinhas
 * @returns {string} Texto sem linhas vazias duplicadas
 */
export function removeEmptyLines(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/\n{3,}/g, '\n\n');
}

/**
 * Extrai números de uma string
 * @param {string} str - Texto
 * @returns {number[]} Array de números encontrados
 */
export function extractNumbers(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\d+(\.\d+)?/g);
  return matches ? matches.map(parseFloat) : [];
}

/**
 * Verifica se string contém exercício (padrão maiúsculas)
 * @param {string} str - Texto
 * @returns {boolean}
 */
export function hasExercisePattern(str) {
  if (typeof str !== 'string') return false;
  // Procura por 2+ palavras em maiúsculas (ex: "BACK SQUAT")
  return /\b[A-Z]{2,}(\s+[A-Z]{2,})+\b/.test(str);
}

/**
 * Substitui placeholders em template
 * @param {string} template - Template com {key}
 * @param {Object} values - Valores para substituir
 * @returns {string} Template preenchido
 */
export function fillTemplate(template, values = {}) {
  if (typeof template !== 'string') return '';
  
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values.hasOwnProperty(key) ? values[key] : match;
  });
}

/**
 * Cria slug de URL a partir de texto
 * @param {string} str - Texto
 * @returns {string} Slug (ex: "meu-treino-de-hoje")
 */
export function slugify(str) {
  if (typeof str !== 'string') return '';
  
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Espaços → hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
}
