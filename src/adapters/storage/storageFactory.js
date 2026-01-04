/**
 * Storage Factory
 * Decide qual adapter usar baseado em:
 * - Tamanho dos dados
 * - Disponibilidade do browser
 * - Performance
 */

import * as localStorageAdapter from './localStorageAdapter.js';
import * as indexedDbAdapter from './indexedDbAdapter.js';

// Limite para trocar de localStorage para IndexedDB
const INDEXEDDB_THRESHOLD = 4 * 1024 * 1024; // 4MB

/**
 * Cria adapter apropriado baseado em estimativa de tamanho
 * @param {string} key - Chave que será armazenada
 * @param {number} estimatedSize - Tamanho estimado em bytes
 * @returns {Object} Adapter (localStorage ou IndexedDB)
 */
export function createStorage(key = '', estimatedSize = 0) {
  // Se IndexedDB não disponível, usa localStorage
  if (!indexedDbAdapter.isAvailable()) {
    console.log('📦 Storage: localStorage (IndexedDB não disponível)');
    return localStorageAdapter;
  }
  
  // Se localStorage não disponível, força IndexedDB
  if (!localStorageAdapter.isAvailable()) {
    console.log('📦 Storage: IndexedDB (localStorage não disponível)');
    return indexedDbAdapter;
  }
  
  // Decide baseado em tamanho
  if (estimatedSize > INDEXEDDB_THRESHOLD) {
    console.log(`📦 Storage: IndexedDB (${formatBytes(estimatedSize)} > 4MB)`);
    return indexedDbAdapter;
  }
  
  console.log(`📦 Storage: localStorage (${formatBytes(estimatedSize)} ≤ 4MB)`);
  return localStorageAdapter;
}

/**
 * Cria adapter para dados pequenos (sempre localStorage se disponível)
 * @returns {Object} Adapter
 */
export function createSmallStorage() {
  if (localStorageAdapter.isAvailable()) {
    return localStorageAdapter;
  }
  return indexedDbAdapter;
}

/**
 * Cria adapter para dados grandes (sempre IndexedDB se disponível)
 * @returns {Object} Adapter
 */
export function createLargeStorage() {
  if (indexedDbAdapter.isAvailable()) {
    return indexedDbAdapter;
  }
  return localStorageAdapter;
}

/**
 * Retorna adapter padrão (baseado em disponibilidade)
 * @returns {Object} Adapter
 */
export function createDefaultStorage() {
  // Preferência: localStorage (mais rápido para dados pequenos)
  if (localStorageAdapter.isAvailable()) {
    return localStorageAdapter;
  }
  return indexedDbAdapter;
}

/**
 * Migra dados de um adapter para outro
 * @param {string} key - Chave
 * @param {Object} fromAdapter - Adapter origem
 * @param {Object} toAdapter - Adapter destino
 * @returns {Promise<boolean>} Sucesso
 */
export async function migrateData(key, fromAdapter, toAdapter) {
  try {
    const value = await fromAdapter.get(key);
    
    if (value === null) {
      return false;
    }
    
    await toAdapter.set(key, value);
    await fromAdapter.remove(key);
    
    console.log(`✅ Migrado: ${key} (${fromAdapter.getInfo().name} → ${toAdapter.getInfo().name})`);
    return true;
    
  } catch (error) {
    console.error('Erro ao migrar dados:', error);
    return false;
  }
}

/**
 * Retorna informações de todos os adapters
 * @returns {Object}
 */
export function getStorageInfo() {
  return {
    localStorage: localStorageAdapter.getInfo(),
    indexedDB: indexedDbAdapter.getInfo(),
    threshold: formatBytes(INDEXEDDB_THRESHOLD),
  };
}

/**
 * Limpa todos os storages (localStorage + IndexedDB)
 * @returns {Promise<void>}
 */
export async function clearAllStorages() {
  const results = await Promise.allSettled([
    localStorageAdapter.clear(),
    indexedDbAdapter.clear(),
  ]);
  
  const errors = results.filter(r => r.status === 'rejected');
  
  if (errors.length > 0) {
    console.warn('Alguns storages não puderam ser limpos:', errors);
  } else {
    console.log('✅ Todos os storages limpos');
  }
}

/**
 * Retorna espaço total usado (localStorage + IndexedDB)
 * @returns {Promise<Object>}
 */
export async function getTotalUsedSpace() {
  const [localStorageSize, indexedDbSize] = await Promise.all([
    localStorageAdapter.getUsedSpace(),
    indexedDbAdapter.getUsedSpace(),
  ]);
  
  return {
    localStorage: localStorageSize,
    indexedDB: indexedDbSize,
    total: localStorageSize + indexedDbSize,
    formatted: {
      localStorage: formatBytes(localStorageSize),
      indexedDB: formatBytes(indexedDbSize),
      total: formatBytes(localStorageSize + indexedDbSize),
    },
  };
}

/**
 * Formata bytes para leitura humana
 * @param {number} bytes - Bytes
 * @returns {string} Formatado (ex: "1.5 MB")
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Testa funcionalidade dos adapters
 * @returns {Promise<Object>} Resultados dos testes
 */
export async function testAdapters() {
  const results = {
    localStorage: { available: false, working: false },
    indexedDB: { available: false, working: false },
  };
  
  // Testa localStorage
  if (localStorageAdapter.isAvailable()) {
    results.localStorage.available = true;
    
    try {
      const testKey = '__test__';
      const testValue = { test: true, timestamp: Date.now() };
      
      await localStorageAdapter.set(testKey, testValue);
      const retrieved = await localStorageAdapter.get(testKey);
      await localStorageAdapter.remove(testKey);
      
      results.localStorage.working = retrieved?.test === true;
    } catch (error) {
      console.warn('localStorage test failed:', error);
    }
  }
  
  // Testa IndexedDB
  if (indexedDbAdapter.isAvailable()) {
    results.indexedDB.available = true;
    
    try {
      const testKey = '__test__';
      const testValue = { test: true, timestamp: Date.now() };
      
      await indexedDbAdapter.set(testKey, testValue);
      const retrieved = await indexedDbAdapter.get(testKey);
      await indexedDbAdapter.remove(testKey);
      
      results.indexedDB.working = retrieved?.test === true;
    } catch (error) {
      console.warn('IndexedDB test failed:', error);
    }
  }
  
  return results;
}

// Expõe globalmente para debug
if (typeof window !== 'undefined') {
  window.__STORAGE__ = {
    getInfo: getStorageInfo,
    getUsedSpace: getTotalUsedSpace,
    test: testAdapters,
    clear: clearAllStorages,
  };
}
