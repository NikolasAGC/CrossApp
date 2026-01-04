let state = {
  // PDF e treinos
  pdfText: null,                    // Texto bruto do PDF
  currentWeek: 1,                   // Semana ativa (futuro: múltiplas semanas)
  currentDay: null,                 // Nome do dia (Segunda, Terça, etc)
  workout: null,                    // Treino parseado do PDF
  
  // PRs (Personal Records)
  prs: {},                          // { "BACK SQUAT": 100, "DEADLIFT": 140, ... }
  
  // Preferências do usuário
  preferences: {
    showLbsConversion: true,        // Mostra conversão kg → lbs
    showEmojis: true,               // Mostra emojis nos títulos
    showGoals: true,                // Mostra objetivos do WOD
    theme: 'dark',                  // 'dark' | 'light'
  },
  
  // Estado da UI (volatile)
  ui: {
    activeScreen: 'welcome',        // 'welcome' | 'workout' | 'rest'
    hasWarnings: false,             // Se há exercícios sem PR
    isLoading: false,               // Loading state
    activeModal: null,              // 'prs' | 'settings' | 'raw' | null
  },
};

// Listeners (observers)
const listeners = new Set();

/**
 * Retorna o estado atual (read-only)
 */
export function getState() {
  return state;
}

/**
 * Atualiza o estado (imutável) e notifica listeners
 * @param {Object} updates - Objeto com atualizações parciais
 */
export function setState(updates) {
  const oldState = state;
  
  // Merge profundo manual (evita lodash)
  state = {
    ...oldState,
    ...updates,
    preferences: {
      ...oldState.preferences,
      ...(updates.preferences || {}),
    },
    ui: {
      ...oldState.ui,
      ...(updates.ui || {}),
    },
  };
  
  // Notifica todos os listeners
  notify(state, oldState);
}

/**
 * Reseta o estado (útil para logout ou clear data)
 */
export function resetState() {
  state = {
    pdfText: null,
    currentWeek: 1,
    currentDay: null,
    workout: null,
    prs: {},
    preferences: {
      showLbsConversion: true,
      showEmojis: true,
      showGoals: true,
      theme: 'dark',
    },
    ui: {
      activeScreen: 'welcome',
      hasWarnings: false,
      isLoading: false,
      activeModal: null,
    },
  };
  
  notify(state, {});
}

/**
 * Registra um listener (observer)
 * @param {Function} fn - Callback (newState, oldState) => void
 * @returns {Function} Unsubscribe function
 */
export function subscribe(fn) {
  listeners.add(fn);
  
  // Retorna função de cleanup
  return () => listeners.delete(fn);
}

/**
 * Notifica todos os listeners
 * @private
 */
function notify(newState, oldState) {
  listeners.forEach(fn => {
    try {
      fn(newState, oldState);
    } catch (error) {
      console.error('Erro no listener:', error);
    }
  });
}

/**
 * Debug: exibe estado no console
 */
export function debugState() {
  console.group('📊 Estado Atual');
  console.log('PDF carregado:', !!state.pdfText);
  console.log('Dia atual:', state.currentDay);
  console.log('Semana ativa:', state.currentWeek);
  console.log('PRs cadastrados:', Object.keys(state.prs).length);
  console.log('Tela ativa:', state.ui.activeScreen);
  console.log('Preferências:', state.preferences);
  console.groupEnd();
  return state;
}

// Expõe globalmente para debug no console
if (typeof window !== 'undefined') {
  window.__STATE__ = { getState, setState, debugState };
}
