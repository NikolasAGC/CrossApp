/**
 * Core Index - Barrel Export
 * Centraliza exports do módulo core + integrações
 */

// ========== RE-EXPORTS DE PARSER E PLUGINS ==========
// Essas funções estão fora de /core mas são importadas pelo app.js via core/index.js

export { parseWorkout } from '../parser/index.js';
export { calculateWorkoutLoads, hasWarnings, getMissingPRsFromResults } from '../plugins/workoutLoadProcessor.js';

// ========== EXPORTS DO CORE ==========

// State
export { getState, setState, subscribe, debugState } from './state/store.js';

// Events
export { on, emit } from './events/eventBus.js';

// Use Cases
export { calculateLoads } from './usecases/calculateLoads.js';
export { copyWorkout } from './usecases/copyWorkout.js';
export { exportWorkout } from './usecases/exportWorkout.js';
export { exportPRs } from './usecases/exportPRs.js';
export { importPRs } from './usecases/importPRs.js';
export { addOrUpdatePR, removePR, listAllPRs } from './usecases/managePRs.js';

// Services
export { calculateLoad, formatLoadResult } from './services/loadCalculator.js';

// Utils
export { getDayName, isRestDay } from './utils/date.js';
