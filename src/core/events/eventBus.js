/**
 * Event Bus simples (pub/sub)
 * 
 * Usado para comunicação desacoplada entre módulos
 * Exemplo: UI dispara evento → Use-case escuta → State atualiza
 */

const events = new Map();

/**
 * Registra um listener para um evento
 * @param {string} eventName - Nome do evento
 * @param {Function} handler - Callback (payload) => void
 * @returns {Function} Unsubscribe function
 */
export function on(eventName, handler) {
  if (!events.has(eventName)) {
    events.set(eventName, new Set());
  }
  
  events.get(eventName).add(handler);
  
  return () => off(eventName, handler);
}

/**
 * Remove um listener
 */
export function off(eventName, handler) {
  if (!events.has(eventName)) return;
  events.get(eventName).delete(handler);
}

/**
 * Dispara um evento
 * @param {string} eventName - Nome do evento
 * @param {*} payload - Dados do evento
 */
export function emit(eventName, payload) {
  if (!events.has(eventName)) return;
  
  events.get(eventName).forEach(handler => {
    try {
      handler(payload);
    } catch (error) {
      console.error(`Erro no handler de "${eventName}":`, error);
    }
  });
}

/**
 * Remove todos os listeners de um evento
 */
export function clear(eventName) {
  if (eventName) {
    events.delete(eventName);
  } else {
    events.clear();
  }
}

/**
 * Debug: lista eventos ativos
 */
export function debug() {
  console.group('📡 Event Bus');
  events.forEach((handlers, eventName) => {
    console.log(`${eventName}: ${handlers.size} listener(s)`);
  });
  console.groupEnd();
}

// Expõe globalmente para debug
if (typeof window !== 'undefined') {
  window.__EVENTS__ = { on, emit, debug };
}
