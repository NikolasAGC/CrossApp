/**
 * State Management (Store)
 * Gerenciamento de estado global reativo
 */

let state = {
  // PDF e treinos
  weeks: [],                        // Array de semanas parseadas
  activeWeekNumber: null,           // Número da semana ativa
  currentDay: null,                 // Nome do dia (Segunda, Terça, etc)
  workout: null,                    // Treino do dia atual
  
  // PRs (Personal Records)
  prs: {},                          // { "BACK SQUAT": 100, ... }
  
  // Preferências do usuário
  preferences: {
    showLbsConversion: true,
    showEmojis: true,
    showGoals: true,
    theme: 'dark',
  },
  
  // Estado da UI (volatile)
  ui: {
    activeScreen: 'welcome',        // 'welcome' | 'workout' | 'rest'
    hasWarnings: false,
    isLoading: false,
    activeModal: null,
  },
};

// Subscribers (listeners de mudança de estado)
const subscribers = [];

/**
 * Retorna estado completo (imutável)
 * @returns {Object} Estado
 */
export function getState() {
  return structuredClone(state);
}

/**
 * Atualiza estado (parcial merge)
 * @param {Object} updates - Atualizações parciais
 */
export function setState(updates) {
  const oldState = structuredClone(state);
  
  // Merge profundo
  state = deepMerge(state, updates);
  
  // Notifica subscribers
  notifySubscribers(state, oldState);
}

/**
 * Reseta estado para valores iniciais
 */
export function resetState() {
  const oldState = structuredClone(state);
  
  state = {
    weeks: [],
    activeWeekNumber: null,
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
  
  notifySubscribers(state, oldState);
}

/**
 * Subscreve a mudanças de estado
 * @param {Function} callback - Função chamada quando state mudar
 * @returns {Function} Função para cancelar subscription
 */
export function subscribe(callback) {
  if (typeof callback !== 'function') {
    throw new Error('Callback deve ser uma função');
  }
  
  subscribers.push(callback);
  
  // Retorna unsubscribe function
  return () => {
    const index = subscribers.indexOf(callback);
    if (index > -1) {
      subscribers.splice(index, 1);
    }
  };
}

/**
 * Notifica todos os subscribers
 * @param {Object} newState - Novo estado
 * @param {Object} oldState - Estado anterior
 */
function notifySubscribers(newState, oldState) {
  subscribers.forEach(callback => {
    try {
      callback(structuredClone(newState), structuredClone(oldState));
    } catch (error) {
      console.error('Erro em subscriber:', error);
    }
  });
}

/**
 * Merge profundo de objetos
 * @param {Object} target - Objeto alvo
 * @param {Object} source - Objeto fonte
 * @returns {Object} Objeto merged
 */
function deepMerge(target, source) {
  const output = { ...target };
  
  Object.keys(source).forEach(key => {
    if (isObject(source[key])) {
      if (key in target) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  });
  
  return output;
}

/**
 * Verifica se valor é objeto
 * @param {*} item - Valor
 * @returns {boolean}
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Debug: imprime estado no console
 */
export function debugState() {
  console.log('🔍 Estado atual:');
  console.table({
    'Semanas carregadas': state.weeks?.length || 0,
    'Semana ativa': state.activeWeekNumber || 'Nenhuma',
    'Dia atual': state.currentDay || 'Não definido',
    'Treino carregado': state.workout ? `${state.workout.day} (${state.workout.blocks?.length || 0} blocos)` : 'Não',
    'PRs cadastrados': Object.keys(state.prs).length,
    'Tela ativa': state.ui.activeScreen,
    'Warnings': state.ui.hasWarnings ? 'Sim' : 'Não',
  });
  
  console.log('📦 Estado completo:', state);
  
  if (state.weeks && state.weeks.length > 0) {
    console.log('📅 Semanas disponíveis:', state.weeks.map(w => w.weekNumber));
  }
  
  if (Object.keys(state.prs).length > 0) {
    console.log('💪 PRs:', state.prs);
  }
}

/**
 * Debug: retorna total de subscribers
 * @returns {number}
 */
export function getSubscribersCount() {
  return subscribers.length;
}
