/**
 * IndexedDB Adapter
 * Implementa persistência usando IndexedDB
 * 
 * Vantagens:
 * - Muito mais espaço (~50MB-unlimited)
 * - Assíncrono (não bloqueia thread)
 * - Suporta dados binários
 */

const DB_NAME = 'treino-db';
const DB_VERSION = 1;
const STORE_NAME = 'storage';

let dbInstance = null;

/**
 * Abre conexão com IndexedDB (lazy initialization)
 * @returns {Promise<IDBDatabase>}
 */
async function openDB() {
  // Retorna instância em cache se já existir
  if (dbInstance) {
    return dbInstance;
  }
  
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error('IndexedDB não suportado neste navegador'));
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    // Upgrade: cria object store se não existir
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    
    request.onsuccess = () => {
      dbInstance = request.result;
      
      // Reconecta se connection fechar
      dbInstance.onclose = () => {
        dbInstance = null;
      };
      
      resolve(dbInstance);
    };
    
    request.onerror = () => {
      reject(new Error('Erro ao abrir IndexedDB: ' + request.error?.message));
    };
    
    request.onblocked = () => {
      console.warn('IndexedDB bloqueado. Feche outras abas deste app.');
    };
  });
}

/**
 * Salva valor no IndexedDB
 * @param {string} key - Chave
 * @param {*} value - Valor (qualquer tipo serializável)
 * @returns {Promise<void>}
 */
export async function set(key, value) {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Erro ao salvar no IndexedDB: ' + request.error?.message));
  });
}

/**
 * Recupera valor do IndexedDB
 * @param {string} key - Chave
 * @returns {Promise<*>} Valor ou null se não encontrado
 */
export async function get(key) {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    
    request.onsuccess = () => {
      resolve(request.result !== undefined ? request.result : null);
    };
    
    request.onerror = () => {
      console.warn('Erro ao ler do IndexedDB:', request.error);
      resolve(null);
    };
  });
}

/**
 * Remove item do IndexedDB
 * @param {string} key - Chave
 * @returns {Promise<void>}
 */
export async function remove(key) {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);
    
    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.warn('Erro ao remover do IndexedDB:', request.error);
      resolve(); // Não rejeita, apenas avisa
    };
  });
}

/**
 * Verifica se chave existe
 * @param {string} key - Chave
 * @returns {Promise<boolean>}
 */
export async function has(key) {
  const value = await get(key);
  return value !== null;
}

/**
 * Lista todas as chaves
 * @returns {Promise<string[]>}
 */
export async function keys() {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAllKeys();
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => {
      console.warn('Erro ao listar chaves do IndexedDB:', request.error);
      resolve([]);
    };
  });
}

/**
 * Limpa todos os dados
 * @returns {Promise<void>}
 */
export async function clear() {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Erro ao limpar IndexedDB: ' + request.error?.message));
  });
}

/**
 * Retorna tamanho aproximado usado (em bytes)
 * @returns {Promise<number>}
 */
export async function getUsedSpace() {
  // IndexedDB não tem API nativa para isso
  // Estimativa baseada em JSON.stringify
  const db = await openDB();
  
  return new Promise(async (resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const values = request.result || [];
        let total = 0;
        
        values.forEach(value => {
          try {
            const serialized = typeof value === 'string' 
              ? value 
              : JSON.stringify(value);
            total += serialized.length * 2; // UTF-16
          } catch {
            // Ignora se não conseguir serializar
          }
        });
        
        resolve(total);
      };
      
      request.onerror = () => resolve(0);
      
    } catch {
      resolve(0);
    }
  });
}

/**
 * Verifica se IndexedDB está disponível
 * @returns {boolean}
 */
export function isAvailable() {
  return 'indexedDB' in window;
}

/**
 * Fecha conexão (útil para testes)
 * @returns {Promise<void>}
 */
export async function close() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Apaga database completamente (útil para reset)
 * @returns {Promise<void>}
 */
export async function deleteDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Erro ao apagar database'));
    request.onblocked = () => {
      console.warn('Delete bloqueado. Feche outras abas.');
      resolve(); // Resolve mesmo bloqueado
    };
  });
}

/**
 * Retorna informações do adapter
 * @returns {Object}
 */
export function getInfo() {
  return {
    name: 'IndexedDB',
    type: 'async',
    maxSize: '~50MB-unlimited',
    available: isAvailable(),
  };
}
