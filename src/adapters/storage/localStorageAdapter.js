/**
 * LocalStorage Adapter
 * Implementa persistência usando localStorage
 * 
 * Limitações:
 * - ~5-10MB por domínio
 * - Síncrono (pode bloquear thread)
 * - Apenas strings (JSON.stringify necessário)
 */

const STORAGE_PREFIX = 'treino_';

/**
 * Salva valor no localStorage
 * @param {string} key - Chave
 * @param {*} value - Valor (será serializado)
 * @returns {Promise<void>}
 */
export async function set(key, value) {
  const fullKey = STORAGE_PREFIX + key;
  
  try {
    const serialized = typeof value === 'string' 
      ? value 
      : JSON.stringify(value);
    
    localStorage.setItem(fullKey, serialized);
    
  } catch (error) {
    // Quota exceeded
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      throw new Error('Espaço de armazenamento cheio (localStorage)');
    }
    
    throw new Error('Erro ao salvar no localStorage: ' + error.message);
  }
}

/**
 * Recupera valor do localStorage
 * @param {string} key - Chave
 * @returns {Promise<*>} Valor ou null se não encontrado
 */
export async function get(key) {
  const fullKey = STORAGE_PREFIX + key;
  
  try {
    const value = localStorage.getItem(fullKey);
    
    if (value === null) {
      return null;
    }
    
    // Tenta parsear como JSON
    try {
      return JSON.parse(value);
    } catch {
      // Se não for JSON válido, retorna string bruta
      return value;
    }
    
  } catch (error) {
    console.warn('Erro ao ler do localStorage:', error);
    return null;
  }
}

/**
 * Remove item do localStorage
 * @param {string} key - Chave
 * @returns {Promise<void>}
 */
export async function remove(key) {
  const fullKey = STORAGE_PREFIX + key;
  
  try {
    localStorage.removeItem(fullKey);
  } catch (error) {
    console.warn('Erro ao remover do localStorage:', error);
  }
}

/**
 * Verifica se chave existe
 * @param {string} key - Chave
 * @returns {Promise<boolean>}
 */
export async function has(key) {
  const fullKey = STORAGE_PREFIX + key;
  return localStorage.getItem(fullKey) !== null;
}

/**
 * Lista todas as chaves do app
 * @returns {Promise<string[]>} Array de chaves (sem prefixo)
 */
export async function keys() {
  const allKeys = Object.keys(localStorage);
  return allKeys
    .filter(k => k.startsWith(STORAGE_PREFIX))
    .map(k => k.replace(STORAGE_PREFIX, ''));
}

/**
 * Limpa todos os dados do app
 * @returns {Promise<void>}
 */
export async function clear() {
  const appKeys = await keys();
  
  appKeys.forEach(key => {
    const fullKey = STORAGE_PREFIX + key;
    localStorage.removeItem(fullKey);
  });
}

/**
 * Retorna tamanho aproximado usado (em bytes)
 * @returns {Promise<number>} Bytes usados
 */
export async function getUsedSpace() {
  let total = 0;
  
  const appKeys = await keys();
  
  appKeys.forEach(key => {
    const fullKey = STORAGE_PREFIX + key;
    const value = localStorage.getItem(fullKey);
    if (value) {
      // 2 bytes por caractere (UTF-16)
      total += value.length * 2;
    }
  });
  
  return total;
}

/**
 * Verifica se localStorage está disponível
 * @returns {boolean}
 */
export function isAvailable() {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retorna informações do adapter
 * @returns {Object}
 */
export function getInfo() {
  return {
    name: 'localStorage',
    type: 'sync',
    maxSize: '~5-10MB',
    available: isAvailable(),
  };
}
